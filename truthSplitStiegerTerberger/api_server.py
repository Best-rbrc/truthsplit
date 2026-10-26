#!/usr/bin/env python3
"""
TruthSplit API Server

REST API backend for the TruthSplit frontend.
Exposes pipeline functions as HTTP endpoints.
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import sys
from pathlib import Path
from typing import Dict, Any, List
import traceback
import os
import requests
from dotenv import load_dotenv
import json
import re
from datetime import datetime

# Load environment variables from .env file
load_dotenv()

# Add current directory to path for imports
sys.path.append(str(Path(__file__).parent))

from comparative_reasoning.pipeline import quick_analyze, compare_worldviews, TruthSplitPipeline
from comparative_reasoning.llm_reasoning_engine import LLMComparativeReasoner

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend

# Initialize pipeline and reasoners (cached)
pipeline = None
llm_reasoner = None
gemma_analyzer = None

# Persistent storage for saved analyses
BASE_DIR = Path(__file__).parent
ANALYSIS_STORE_PATH = BASE_DIR / "data" / "saved_analyses.json"
ANALYSIS_STORE_PATH.parent.mkdir(parents=True, exist_ok=True)

SLUG_PATTERN = re.compile(r"^[a-z0-9_-]{3,50}$")


def _load_saved_analyses() -> Dict[str, Any]:
    if not ANALYSIS_STORE_PATH.exists():
        return {}
    try:
        with open(ANALYSIS_STORE_PATH, "r", encoding="utf-8") as f:
            data = json.load(f)
            if isinstance(data, dict):
                return data
    except Exception as e:
        print(f"⚠️ Could not read saved analyses: {e}")
    return {}


def _write_saved_analyses(data: Dict[str, Any]) -> None:
    tmp_path = ANALYSIS_STORE_PATH.with_suffix(".tmp")
    with open(tmp_path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)
    tmp_path.replace(ANALYSIS_STORE_PATH)


def _validate_slug(slug: str) -> bool:
    return bool(slug and SLUG_PATTERN.match(slug))

def _calculate_gemma_confidence(reasoning_length: int, premise_claim_score: float,
                                worldview_internal_score: float, position: str,
                                has_assumptions: bool, has_concerns: bool,
                                has_alternative: bool) -> float:
    """
    Calculate confidence score for Gemma steering analysis.
    
    Factors:
    - Consistency scores (40%): Premise-claim and worldview internal
    - Reasoning quality (30%): Length and coherence
    - Completeness (20%): Assumptions, concerns, alternatives
    - Position clarity (10%): Support/oppose vs conditional
    """
    # 1. Consistency component (40%)
    avg_consistency = (premise_claim_score * 0.6 + worldview_internal_score * 0.4)
    consistency_component = avg_consistency * 0.4
    
    # 2. Reasoning quality component (30%)
    if reasoning_length >= 300:
        length_score = 1.0
    elif reasoning_length >= 150:
        length_score = 0.85
    elif reasoning_length >= 100:
        length_score = 0.7
    elif reasoning_length >= 50:
        length_score = 0.5
    else:
        length_score = 0.3
    reasoning_component = length_score * 0.3
    
    # 3. Completeness component (20%)
    completeness = 0.0
    if has_assumptions:
        completeness += 0.4
    if has_concerns:
        completeness += 0.3
    if has_alternative:
        completeness += 0.3
    completeness_component = completeness * 0.2
    
    # 4. Position clarity component (10%)
    if position in ['support', 'oppose']:
        position_score = 1.0
    elif position == 'conditional':
        position_score = 0.7
    else:
        position_score = 0.5
    position_component = position_score * 0.1
    
    # Total confidence
    total = consistency_component + reasoning_component + completeness_component + position_component
    
    # Clamp between 0.5 and 0.95
    return max(0.5, min(0.95, round(total, 2)))

def get_pipeline():
    """Get or create pipeline instance"""
    global pipeline
    if pipeline is None:
        pipeline = TruthSplitPipeline()
    return pipeline

def get_llm_reasoner(use_local_divergence=False, llm_provider="openai", llm_model=None):
    """Get or create LLM reasoner instance - creates new instance if settings change"""
    global llm_reasoner
    # Create new instance if settings changed or not initialized
    needs_new = (
        llm_reasoner is None or
        getattr(llm_reasoner, 'use_local_divergence', None) != use_local_divergence or
        getattr(llm_reasoner, 'provider_name', None) != llm_provider
    )
    if needs_new:
        llm_reasoner = LLMComparativeReasoner(
            use_local_divergence=use_local_divergence,
            llm_provider=llm_provider,
            llm_model=llm_model
        )
    return llm_reasoner

def get_gemma_analyzer(
    force_reload: bool = False,
    sae_layer_index: int = 6,
    hook_layer_index: int | None = None,
):
    """Get or create Gemma analyzer instance with configurable SAE and hook layers."""
    global gemma_analyzer
    if gemma_analyzer is None or force_reload:
        try:
            from gemma_steering.analyzer import GemmaWorldviewAnalyzer
            gemma_analyzer = GemmaWorldviewAnalyzer(
                sae_layer_index=sae_layer_index,
                hook_layer_index=hook_layer_index,
            )
            print(
                f"✅ Gemma analyzer initialized (sae_layer={sae_layer_index}, "
                f"hook_layer={hook_layer_index if hook_layer_index is not None else sae_layer_index})"
            )
            # Print loaded profiles for debugging
            available_profiles = gemma_analyzer.profile_loader.list_profiles()
            print(f"📋 Loaded {len(available_profiles)} profiles: {', '.join(available_profiles)}")
        except ImportError as e:
            print(f"⚠️ Could not load Gemma analyzer: {e}")
            return None
        except Exception as e:
            print(f"⚠️ Error initializing Gemma analyzer: {e}")
            return None
    return gemma_analyzer

def analyze_with_gemma(gemma_analyzer, base_results: Dict[str, Any], 
                       selected_worldviews: List[str], use_local_divergence: bool,
                       worldview_strengths: Dict[str, float] | None = None) -> Dict[str, Any]:
    """
    Run worldview analysis using Gemma steering.
    Returns same format as LLM reasoner for compatibility.
    """
    claims = base_results.get('claims', [])
    claim_texts = [c.get('text', '') for c in claims]
    
    # Run Gemma analysis for all claims and worldviews
    print(f"🤖 Analyzing {len(claim_texts)} claims with {len(selected_worldviews)} worldviews using Gemma steering...")
    if worldview_strengths:
        print(f"   Worldview strengths from frontend: {worldview_strengths}")
    gemma_results = gemma_analyzer.analyze_multiple_claims(
        claims=claim_texts,
        worldview_ids=selected_worldviews,
        amplification=1.8,
        worldview_amplifications=worldview_strengths,
        num_features=20,
        max_new_tokens=250,
        include_baseline=False  # No baseline - only steered analysis
    )
    
    # Transform Gemma results to LLM reasoner format
    worldview_analyses = {}
    for wv_id in selected_worldviews:
        wv_results = gemma_results['worldview_analyses'].get(wv_id, {})
        claim_analyses = []
        
        for claim_idx, claim in enumerate(claims):
            analysis_data = wv_results.get(claim_idx, {})
            steered_text = analysis_data.get('steered', '')
            
            # Enhanced parsing of structured output
            # Clean the text first - remove incomplete sentences at the end
            steered_text = steered_text.strip()
            # Remove trailing incomplete sentences (sentences that don't end with punctuation)
            sentences = steered_text.split('.')
            if sentences and not sentences[-1].strip().endswith(('.', '!', '?')):
                # Last sentence is incomplete, remove it
                steered_text = '.'.join(sentences[:-1]) + '.' if len(sentences) > 1 else steered_text
            
            lower_text = steered_text.lower()
            
            # Extract position - look for explicit position indicators in first 300 chars
            position = 'conditional'  # default
            text_sample = lower_text[:300]
            
            # Check for support indicators
            support_words = ['support', 'agree', 'endorse', 'favor', 'back', 'correct', 'right', 'good']
            oppose_words = ['oppose', 'reject', 'against', 'disagree', 'object', 'wrong', 'bad', 'harmful']
            conditional_words = ['conditional', 'depends', 'qualified', 'nuanced', 'complex', 'varies']
            
            support_count = sum(1 for word in support_words if word in text_sample)
            oppose_count = sum(1 for word in oppose_words if word in text_sample)
            conditional_count = sum(1 for word in conditional_words if word in text_sample)
            
            if oppose_count > support_count and oppose_count > 0:
                position = 'oppose'
            elif support_count > oppose_count and support_count > 0:
                position = 'support'
            elif conditional_count > 0:
                position = 'conditional'
            # If no clear indicators, try to infer from context
            elif 'should not' in text_sample or 'should not be' in text_sample or 'wrong' in text_sample:
                position = 'oppose'
            elif 'should' in text_sample and 'not' not in text_sample[:50]:
                position = 'support'
            
            # Extract key assumptions - improved parsing
            assumptions = []
            sentences = [s.strip() for s in steered_text.split('.') if len(s.strip()) > 20]
            
            # Filter out incoherent or repetitive sentences
            assumption_keywords = ['believe', 'principle', 'value', 'hold that', 'think that', 'because', 
                                 'since', 'based on', 'according to', 'from my perspective']
            
            # Look for sentences with assumption indicators
            for sentence in sentences:
                sentence_lower = sentence.lower()
                # Skip if sentence is too repetitive or incoherent
                if len(set(sentence_lower.split())) < 5:  # Too few unique words
                    continue
                if sentence_lower.count(sentence_lower.split()[0] if sentence_lower.split() else '') > 3:
                    continue  # Too repetitive
                
                # Check if sentence contains assumption indicators or is a reasoning statement
                if any(kw in sentence_lower for kw in assumption_keywords):
                    assumptions.append(sentence)
                elif len(assumptions) < 3 and len(sentence) > 30:  # Take first few substantial sentences
                    assumptions.append(sentence)
            
            # If still no assumptions, take the most coherent sentences
            if not assumptions:
                # Filter for sentences that make sense (have subject-verb-object structure)
                for sentence in sentences:
                    if len(sentence) > 30 and len(sentence) < 200:
                        # Basic coherence check: has multiple words, not just repetition
                        words = sentence.split()
                        if len(words) > 5 and len(set(words)) > len(words) * 0.5:
                            assumptions.append(sentence)
                            if len(assumptions) >= 3:
                                break
            
            # Remove duplicates and limit
            seen = set()
            unique_assumptions = []
            for a in assumptions:
                a_lower = a.lower()[:50]  # Check first 50 chars for uniqueness
                if a_lower not in seen:
                    seen.add(a_lower)
                    unique_assumptions.append(a)
            
            assumptions = unique_assumptions[:5]
            
            # Extract concerns - look for "concern", "problem", "objection", "worry"
            concerns = ''
            concern_keywords = ['concern', 'problem', 'objection', 'worry', 'issue', 'risk']
            for sentence in sentences:
                if any(kw in sentence.lower() for kw in concern_keywords):
                    concerns = sentence
                    break
            
            # Extract alternative approach - look for "alternative", "prefer", "instead", "would"
            alternative_approach = ''
            alt_keywords = ['alternative', 'prefer', 'instead', 'would rather', 'should be']
            for sentence in sentences:
                if any(kw in sentence.lower() for kw in alt_keywords):
                    alternative_approach = sentence
                    break
            
            # Calculate consistency scores based on response quality
            # Premise-claim consistency: how well reasoning connects to the claim
            premise_claim_score = 0.7  # Base score
            if len(steered_text) > 100:  # Substantive response
                premise_claim_score = 0.75
            if any(word in lower_text for word in ['because', 'since', 'therefore', 'thus', 'reason']):
                premise_claim_score = 0.8  # Shows logical connection
            
            # Worldview internal consistency: how well it aligns with worldview
            worldview_internal_score = 0.7  # Base score
            # Check if response references worldview principles
            worldview_terms = ['libertarian', 'conservative', 'progressive', 'justice', 'freedom', 
                             'rights', 'equality', 'tradition', 'individual', 'community']
            if any(term in lower_text for term in worldview_terms):
                worldview_internal_score = 0.8
            if position != 'conditional':  # Clear position suggests internal consistency
                worldview_internal_score = 0.85
            
            # Full reasoning text (not truncated)
            reasoning = steered_text if steered_text else 'No analysis available'
            
            # Calculate dynamic confidence for Gemma steering
            gemma_confidence = _calculate_gemma_confidence(
                reasoning_length=len(steered_text),
                premise_claim_score=premise_claim_score,
                worldview_internal_score=worldview_internal_score,
                position=position,
                has_assumptions=len(assumptions) > 0,
                has_concerns=len(concerns) > 0,
                has_alternative=len(alternative_approach) > 0
            )
            
            claim_analyses.append({
                'position': position,
                'reasoning': reasoning,
                'interpretation': f"Gemma steering analysis from {wv_id} perspective",
                'assumptions': assumptions,
                'confidence': gemma_confidence,
                'concerns': concerns,
                'alternative_approach': alternative_approach,
                'consistency_data': {
                    'premise_claim_consistency': premise_claim_score,
                    'worldview_internal_consistency': worldview_internal_score
                }
            })
        
        worldview_analyses[wv_id] = {
            'worldview_id': wv_id,
            'claim_analyses': claim_analyses
        }
    
    # Run divergence analysis if requested
    divergence_analysis = {'divergence_details': []}
    if use_local_divergence:
        from comparative_reasoning.local_divergence_analyzer import analyze_divergence_local
        divergence_analysis = analyze_divergence_local(worldview_analyses, {})
    
    return {
        'worldview_analyses': worldview_analyses,
        'divergence_analysis': divergence_analysis
    }

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'TruthSplit API'
    })

@app.route('/api/extract-claims', methods=['POST'])
def extract_claims():
    """
    Extract claims from text.
    
    Request body:
    {
        "text": "Your text here",
        "use_openai": true/false (optional, defaults to True for normal mode)
    }
    
    Returns:
    {
        "claims": [...],
        "premises": [...],
        "assumptions": [...],
        ...
    }
    """
    try:
        data = request.get_json()
        if not data or 'text' not in data:
            return jsonify({'error': 'Missing "text" in request body'}), 400
        
        text = data['text']
        use_openai = data.get('use_openai', True)  # Default to True for normal mode
        llm_model = data.get('llm_model', 'gpt-4o-mini')  # Default to gpt-4o-mini
        llm_provider = data.get('llm_provider', 'openai')  # Default to openai
        
        # Log which extraction method is being used
        extraction_method = f"{llm_provider.capitalize()} {llm_model}" if use_openai else "Local Models (BART + embeddings)"
        print(f"🔍 Extracting claims using: {extraction_method}")
        
        # Run analysis pipeline
        result = quick_analyze(text, use_openai=use_openai, llm_model=llm_model, llm_provider=llm_provider)
        
        # Format claims for frontend
        claims = result.get('claims', [])
        formatted_claims = []
        for i, claim in enumerate(claims):
            formatted_claims.append({
                'id': claim.get('id', f'C{i+1}'),
                'text': claim.get('text', ''),
                'premises': [p.get('text', '') for p in claim.get('premises', [])],
                'confidence': claim.get('confidence', 0.0)
            })
        
        return jsonify({
            'claims': formatted_claims,
            'full_result': result  # Include full result for later use
        })
    
    except Exception as e:
        print(f"Error in extract_claims: {e}")
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@app.route('/api/analyze', methods=['POST'])
def analyze():
    """
    Run full worldview analysis.
    
    Request body:
    {
        "text": "Your text here",
        "selected_claim_ids": ["C1", "C2", ...],  # Optional: filter specific claims
        "selected_worldviews": ["libertarian", "eco-justice", ...],
        "use_openai": true/false (optional, defaults to True)
    }
    
    Returns:
    {
        "worldview_analyses": {...},
        "comparison_analysis": {...},
        "divergence_analysis": {...},
        ...
    }
    """
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'Missing request body'}), 400
        
        text = data.get('text', '')
        selected_claim_ids = data.get('selected_claim_ids', [])
        selected_worldviews = data.get('selected_worldviews', [])
        use_openai = data.get('use_openai', True)
        use_openai_extraction = data.get('use_openai_extraction', use_openai)  # Default to use_openai if not specified
        use_local_divergence = data.get('use_local_divergence', False)  # Default to LLM divergence
        use_gemma_steering = data.get('use_gemma_steering', False)  # NEW: Gemma steering option
        worldview_strengths = data.get('worldview_strengths') or {}
        llm_model = data.get('llm_model', 'gpt-4o-mini')  # Default to gpt-4o-mini
        llm_provider = data.get('llm_provider', 'openai')  # Default to openai
        
        if not text:
            return jsonify({'error': 'Missing "text" in request body'}), 400
        
        if not selected_worldviews:
            return jsonify({'error': 'Missing "selected_worldviews" in request body'}), 400
        
        # Cap the number of comparable positions to 3
        original_count = len(selected_worldviews)
        selected_worldviews = selected_worldviews[:3]
        if original_count > 3:
            print(f"Capping wplorldview comparison to 3 positions (requested {original_count}). Using: {selected_worldviews}")
        
        # Step 1: Extract claims and prepare structured data
        # Use the same extraction method as the initial claim extraction to ensure matching IDs
        extraction_method = f"{llm_provider.capitalize()} {llm_model}" if use_openai_extraction else "Local Models (BART + embeddings)"
        print(f"Step 1: Extracting claims using {extraction_method}...")
        base_results = quick_analyze(text, use_openai=use_openai_extraction, llm_model=llm_model, llm_provider=llm_provider)
        
        # Step 2: Filter claims if specific ones were selected
        if selected_claim_ids and len(selected_claim_ids) > 0:
            claims = base_results.get('claims', [])
            available_ids = [claim.get('id') for claim in claims]
            print(f"🔍 Selected claim IDs: {selected_claim_ids}")
            print(f"🔍 Available claim IDs: {available_ids}")
            
            filtered_claims = [
                claim for claim in claims 
                if claim.get('id') in selected_claim_ids
            ]
            base_results['claims'] = filtered_claims
            if not filtered_claims:
                print(f"No matching claims found! Selected: {selected_claim_ids}, Available: {available_ids}")
                return jsonify({'error': f'No claims found matching selected claim IDs. Selected: {selected_claim_ids}, Available: {available_ids}'}), 400
            
            print(f"Filtered to {len(filtered_claims)} claim(s)")
        
        # Step 3: Run worldview analysis (Gemma steering or LLM)
        if use_gemma_steering:
            print(f"Step 2: Running Gemma steering worldview analysis...")
            if worldview_strengths:
                print(f"   Frontend-specified worldview strengths: {worldview_strengths}")
            # Layer configuration for Gemma steering (optional; defaults handled in get_gemma_analyzer)
            sae_layer_index = int(data.get('sae_layer_index', 6))
            hook_layer_index = data.get('hook_layer_index')
            if hook_layer_index is not None:
                try:
                    hook_layer_index = int(hook_layer_index)
                except (TypeError, ValueError):
                    hook_layer_index = None

            # Force reload to pick up any new profiles / config
            gemma_analyzer = get_gemma_analyzer(
                force_reload=True,
                sae_layer_index=sae_layer_index,
                hook_layer_index=hook_layer_index,
            )
            if gemma_analyzer is None:
                return jsonify({'error': 'Gemma steering not available (dependencies not installed)'}), 500
            
            # Use Gemma analyzer
            llm_results = analyze_with_gemma(
                gemma_analyzer,
                base_results,
                selected_worldviews,
                use_local_divergence,
                worldview_strengths
            )
        else:
            divergence_method = "Local NLI" if use_local_divergence else "LLM"
            print(f"Step 2: Running worldview analysis ({llm_provider} {llm_model}, divergence: {divergence_method})...")
            llm_reasoner = get_llm_reasoner(
                use_local_divergence=use_local_divergence,
                llm_provider=llm_provider,
                llm_model=llm_model
            )
            llm_results = llm_reasoner.analyze_worldview_reasoning(
                base_results, 
                selected_worldviews
            )
        
        # Combine results
        result = {
            'base_analysis': base_results,
            'llm_analysis': llm_results,
            'selected_claims': selected_claim_ids if selected_claim_ids else [c.get('id') for c in base_results.get('claims', [])],
            'selected_worldviews': selected_worldviews
        }
        
        return jsonify(result)
    
    except Exception as e:
        print(f"Error in analyze: {e}")
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


@app.route('/api/analyses/<slug>', methods=['GET', 'PUT', 'DELETE'])
def saved_analysis(slug: str):
    """
    Save or load an analysis by slug.

    PUT body:
    {
        "analysis_result": {...},          # Required - transformed frontend analysis result
        "analysis_text": "original text",  # Required
        "selected_worldviews": [...],      # Required
        "convergence_data": {...},         # Optional
        "title": "optional title",         # Optional
        "overwrite": true/false            # Optional (default false)
    }
    """
    if not _validate_slug(slug):
        return jsonify({'error': 'Invalid slug. Use 3-50 chars: lowercase letters, numbers, dash, underscore.'}), 400

    store = _load_saved_analyses()

    if request.method == 'GET':
        if slug not in store:
            return jsonify({'error': 'Analysis not found'}), 404
        return jsonify(store[slug])

    # DELETE
    if request.method == 'DELETE':
        delete_secret = os.getenv("ANALYSIS_DELETE_SECRET")
        if not delete_secret:
            return jsonify({'error': 'Delete secret not configured. Set ANALYSIS_DELETE_SECRET.'}), 500

        provided = (
            request.headers.get("X-Delete-Secret")
            or request.args.get("delete_secret")
        )
        if not provided or provided != delete_secret:
            return jsonify({'error': 'Unauthorized: invalid delete secret'}), 401

        if slug not in store:
            return jsonify({'error': 'Analysis not found'}), 404
        store.pop(slug, None)
        _write_saved_analyses(store)
        return jsonify({'status': 'deleted', 'slug': slug}), 200

    # PUT - save/update
    try:
        data = request.get_json() or {}
        analysis_result = data.get('analysis_result')
        analysis_text = data.get('analysis_text')
        selected_worldviews = data.get('selected_worldviews')
        convergence_data = data.get('convergence_data', {})
        title = data.get('title', '')
        overwrite = bool(data.get('overwrite', False))

        if analysis_result is None or analysis_text is None or selected_worldviews is None:
            return jsonify({'error': 'Missing required fields: analysis_result, analysis_text, selected_worldviews'}), 400

        if not isinstance(selected_worldviews, list) or len(selected_worldviews) == 0:
            return jsonify({'error': 'selected_worldviews must be a non-empty list'}), 400

        exists = slug in store
        if exists and not overwrite:
            return jsonify({'error': 'Slug already exists', 'slug': slug}), 409

        now = datetime.utcnow().isoformat() + 'Z'
        previous = store.get(slug, {})
        created_at = previous.get('created_at', now)

        store[slug] = {
            'slug': slug,
            'title': title,
            'analysis_result': analysis_result,
            'analysis_text': analysis_text,
            'selected_worldviews': selected_worldviews,
            'convergence_data': convergence_data,
            'created_at': created_at,
            'updated_at': now
        }

        _write_saved_analyses(store)

        status = 200 if exists else 201
        return jsonify(store[slug]), status

    except Exception as e:
        print(f"Error saving analysis: {e}")
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@app.route('/api/worldviews', methods=['GET'])
def get_worldviews():
    """
    Get list of available worldviews with factor scores from CSV.
    
    Returns:
    {
        "worldviews": [
            {
                "id": "libertarian",
                "name": "Libertarian",
                "factors": {...},
                ...
            },
            ...
        ]
    }
    """
    try:
        import pandas as pd
        
        # Load factor scores from CSV
        base_dir = Path(__file__).parent
        csv_path = base_dir / "structured_knowledge_layer" / "vectors" / "factor_scores.csv"
        
        if not csv_path.exists():
            return jsonify({'error': f'Factor scores CSV not found at {csv_path}'}), 500
        
        # Read CSV
        df = pd.read_csv(csv_path)
        
        # Get profile loader for metadata
        pipeline = get_pipeline()
        profile_loader = pipeline.profile_loader
        
        # Get factor column names from CSV header (exclude worldview_id)
        factor_columns = [col for col in df.columns if col != 'worldview_id']
        
        worldviews = []
        for _, row in df.iterrows():
            worldview_id = row['worldview_id']
            
            # Get factor scores (convert from 0-1 scale to -1 to +1 scale)
            factors = {}
            for col in factor_columns:
                value = float(row[col])
                # Transform from 0-1 to -1 to +1: (value * 2) - 1
                factors[col] = (value * 2) - 1
            
            # Get profile metadata
            profile = profile_loader.get_profile(worldview_id) if worldview_id in profile_loader.list_profiles() else None
            
            worldviews.append({
                'id': worldview_id,
                'name': profile.get('display_name', worldview_id) if profile else worldview_id,
                'factors': factors
            })
        
        return jsonify({
            'worldviews': worldviews,
            'factor_columns': factor_columns  # Return CSV header columns
        })
    
    except Exception as e:
        print(f"Error in get_worldviews: {e}")
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@app.route('/api/analyze-convergence', methods=['POST'])
def analyze_convergence():
    """
    Analyze convergence/divergence in reasoning chains for a specific claim.
    This is an optional, on-demand analysis that runs after initial worldview analysis.
    
    Request body:
    {
        "claim_id": "C1",
        "claim_text": "Climate change requires action",
        "worldview_analyses": {
            "libertarian": { "reasoning_chain": [...], ... },
            "communist": { "reasoning_chain": [...], ... }
        },
        "llm_provider": "openrouter",
        "llm_model": "anthropic/claude-opus-4.5"
    }
    
    Returns: ConvergenceAnalysis JSON
    """
    try:
        data = request.json
        claim_id = data.get('claim_id')
        claim_text = data.get('claim_text')
        worldview_analyses = data.get('worldview_analyses', {})
        llm_provider = data.get('llm_provider', 'openrouter')
        llm_model = data.get('llm_model')
        
        if not claim_text or not worldview_analyses:
            return jsonify({"error": "Missing claim_text or worldview_analyses"}), 400
        
        print(f"\\n🔄 Analyzing convergence for claim: {claim_text[:50]}...")
        print(f"   Worldviews: {list(worldview_analyses.keys())}")
        
        # Get LLM reasoner
        reasoner = get_llm_reasoner(use_local_divergence=False, llm_provider=llm_provider, llm_model=llm_model)
        
        # Run convergence analysis
        convergence_result = reasoner.analyze_convergence(claim_text, worldview_analyses)
        
        if 'error' in convergence_result:
            print(f"   ❌ Convergence analysis failed: {convergence_result['error']}")
            return jsonify(convergence_result), 500
        
        print(f"   ✅ Convergence analysis completed")
        print(f"   Primary divergence at step: {convergence_result.get('primary_divergence_point')}")
        
        return jsonify({
            "claim_id": claim_id,
            "convergence_analysis": convergence_result
        })
        
    except Exception as e:
        print(f"❌ Convergence analysis error: {e}")
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


@app.route('/api/chat', methods=['POST'])
def chat_with_worldview():
    """
    Chat with an LLM embodying a specific worldview
    
    Request body:
    {
        "worldview_id": "libertarian",
        "message": "Why do you oppose government intervention?",
        "conversation_history": [
            {"role": "user", "content": "..."},
            {"role": "assistant", "content": "..."}
        ],
        "analysis_context": {
            "claims": [...],
            "worldview_analyses": {...}
        },
        "llm_provider": "openrouter",
        "llm_model": "anthropic/claude-opus-4.5"
    }
    
    Returns: {"response": "assistant message"}
    """
    try:
        from structured_knowledge_layer.profile_loader import ProfileLoader
        from llm.prompt_templates import PromptTemplates
        
        data = request.json
        worldview_id = data.get('worldview_id')
        user_message = data.get('message')
        conversation_history = data.get('conversation_history', [])
        analysis_context = data.get('analysis_context', {})
        llm_provider = data.get('llm_provider', 'openrouter')
        llm_model = data.get('llm_model')
        
        if not worldview_id or not user_message:
            return jsonify({"error": "Missing worldview_id or message"}), 400
        
        print(f"\n💬 Chat request for worldview: {worldview_id}")
        print(f"   Message: {user_message[:100]}...")
        
        # Load worldview profile
        profiles_dir = Path(__file__).parent / "structured_knowledge_layer" / "profiles" / "json"
        profile_loader = ProfileLoader(str(profiles_dir))
        worldview_profile = profile_loader.get_profile(worldview_id)
        
        if not worldview_profile:
            return jsonify({"error": f"Worldview '{worldview_id}' not found"}), 404
        
        # Build analysis summary
        claims_summary = ""
        if analysis_context.get('claims'):
            claims_summary = "ANALYZED CLAIMS:\n"
            for claim in analysis_context['claims']:
                claim_text = claim.get('claim_text', '')
                premises = claim.get('premises', [])
                claims_summary += f"\nClaim: {claim_text}\n"
                if premises:
                    claims_summary += "Premises:\n"
                    for premise in premises:
                        claims_summary += f"  - {premise}\n"
                
                # Add this worldview's analysis if available
                wv_analyses = claim.get('worldview_analyses', {})
                if worldview_id in wv_analyses:
                    wv_analysis = wv_analyses[worldview_id]
                    claims_summary += f"\nYour ({worldview_profile['display_name']}) stance: {wv_analysis.get('stance', 'Unknown')}\n"
                    claims_summary += f"Your reasoning: {wv_analysis.get('reasoning', '')}\n"
        
        # Build system prompt
        system_prompt = PromptTemplates.worldview_chat_system_prompt(worldview_profile, claims_summary)
        
        # Build messages for LLM
        messages = [{"role": "system", "content": system_prompt}]
        
        # Add conversation history
        for msg in conversation_history:
            messages.append({"role": msg['role'], "content": msg['content']})
        
        # Add current user message
        messages.append({"role": "user", "content": user_message})
        
        # Get LLM provider
        reasoner = get_llm_reasoner(use_local_divergence=False, llm_provider=llm_provider, llm_model=llm_model)
        
        # Call LLM
        print(f"   📤 Sending chat request to LLM...")
        response = reasoner.provider.chat_completion(
            messages=messages,
            temperature=0.7,
            max_tokens=1000
        )
        
        assistant_message = response.get('content', 'Sorry, I could not generate a response.')
        
        print(f"   ✅ Chat response generated ({len(assistant_message)} chars)")
        
        return jsonify({"response": assistant_message})
        
    except Exception as e:
        print(f"❌ Chat error: {e}")
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


@app.route('/api/news', methods=['GET'])
def get_news():
    """
    Fetch news articles from NewsAPI.org
    
    Query parameters:
    - query: Search query (optional)
    - category: News category - business, technology, politics, health, science (optional)
    
    Returns:
    {
        "articles": [
            {
                "id": "...",
                "title": "...",
                "description": "...",
                "content": "...",
                "url": "...",
                "source": "...",
                "publishedAt": "...",
                "author": "...",
                "urlToImage": "..."
            },
            ...
        ]
    }
    """
    try:
        news_api_key = os.getenv('NEWS_API_KEY')
        
        if not news_api_key:
            return jsonify({
                'error': 'NewsAPI key not configured. Please set NEWS_API_KEY in your .env file.'
            }), 500
        
        query = request.args.get('query', '')
        category = request.args.get('category', '')
        
        # Build NewsAPI URL
        if query:
            # Search for articles by query
            url = f'https://newsapi.org/v2/everything?q={requests.utils.quote(query)}&sortBy=relevancy&pageSize=20&language=en&apiKey={news_api_key}'
        elif category:
            # Get top headlines by category
            url = f'https://newsapi.org/v2/top-headlines?category={category}&pageSize=20&country=us&apiKey={news_api_key}'
        else:
            # Get general top headlines
            url = f'https://newsapi.org/v2/top-headlines?pageSize=20&country=us&apiKey={news_api_key}'
        
        # Fetch from NewsAPI
        response = requests.get(url, timeout=10)
        
        if not response.ok:
            error_data = response.json() if response.content else {}
            return jsonify({
                'error': f'NewsAPI error: {response.status_code} {response.status_text}',
                'details': error_data.get('message', 'Unknown error')
            }), response.status_code
        
        data = response.json()
        
        if data.get('status') == 'error':
            return jsonify({
                'error': 'NewsAPI error',
                'details': data.get('message', 'Unknown error')
            }), 400
        
        # Transform NewsAPI format to our format
        articles = []
        for index, article in enumerate(data.get('articles', [])):
            articles.append({
                'id': f'news-{index}-{int(os.path.getmtime(__file__))}',
                'title': article.get('title', 'Untitled'),
                'description': article.get('description', ''),
                'content': article.get('content') or article.get('description', ''),
                'url': article.get('url', ''),
                'source': article.get('source', {}).get('name', 'Unknown'),
                'publishedAt': article.get('publishedAt', ''),
                'author': article.get('author'),
                'urlToImage': article.get('urlToImage')
            })
        
        # Filter out articles without titles
        articles = [a for a in articles if a['title'] and a['title'] != 'Untitled']
        
        return jsonify({
            'articles': articles,
            'totalResults': data.get('totalResults', len(articles))
        })
        
    except requests.exceptions.RequestException as e:
        print(f"❌ NewsAPI request error: {e}")
        return jsonify({
            'error': 'Failed to fetch news articles',
            'details': str(e)
        }), 500
    except Exception as e:
        print(f"❌ News endpoint error: {e}")
        traceback.print_exc()
        return jsonify({
            'error': 'Internal server error',
            'details': str(e)
        }), 500


if __name__ == '__main__':
    import os
    # Use port 5001 by default to avoid conflict with macOS AirPlay Receiver (port 5000)
    port = int(os.getenv('API_PORT', 5001))
    
    print("🚀 Starting TruthSplit API Server...")
    print(f"📡 API will be available at http://localhost:{port}")
    print(f"🔗 Frontend should connect to: http://localhost:{port}/api")
    print("-" * 50)
    
    app.run(host='0.0.0.0', port=port, debug=True, use_reloader=False)

