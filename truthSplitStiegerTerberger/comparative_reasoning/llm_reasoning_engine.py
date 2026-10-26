"""
LLM-Enhanced Comparative Reasoning Engine

Uses structured data from claim_linker and consistency_tester to feed LLMs
for nuanced worldview analysis and cross-worldview comparison.

Architecture:
1. Get structured data (consistency + linked concepts)  
2. LLM analyzes each claim through each worldview lens
3. Compare LLM outputs to identify divergence points
4. Generate insights about reasoning path differences

Clean separation: specialized tools → LLM reasoning → comparison analysis
"""

import sys
from pathlib import Path
from typing import Dict, Any, List, Optional
import json
import os

# Add parent directory for imports
sys.path.append(str(Path(__file__).parent.parent))

from structured_knowledge_layer.profile_loader import ProfileLoader

# Load environment variables from .env file
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    print("⚠️  python-dotenv not installed. Trying to load from environment variables directly.")

# LLM Provider abstraction
sys.path.insert(0, str(Path(__file__).parent.parent))
from llm.provider_factory import create_provider
from llm.prompt_templates import PromptTemplates


class LLMComparativeReasoner:
    """
    Uses LLMs to analyze how different worldviews interpret claims,
    building on structured data from consistency_tester and claim_linker.
    Supports both LLM-based and local NLI-based divergence analysis.
    """
    
    def __init__(self, profiles_dir: str = None, use_local_divergence: bool = False, 
                 llm_provider: str = "openai", llm_model: str = None):
        if profiles_dir is None:
            base_dir = Path(__file__).parent.parent
            profiles_dir = str(base_dir / "structured_knowledge_layer" / "profiles" / "json")
        
        self.profile_loader = ProfileLoader(profiles_dir)
        self.use_local_divergence = use_local_divergence
        
        # Initialize LLM provider
        try:
            self.provider = create_provider(llm_provider, llm_model)
            self.provider_name = llm_provider
            print(f"✓ LLM reasoning enabled: {llm_provider} ({self.provider.get_model_name()})")
        except Exception as e:
            print(f"❌ LLM provider setup failed: {e}")
            raise RuntimeError(f"LLM provider '{llm_provider}' initialization failed. {str(e)}")
    
    def analyze_worldview_reasoning(self, structured_data: Dict[str, Any], 
                                   target_worldviews: List[str] = None) -> Dict[str, Any]:
        """
        Main function: Analyze how each worldview reasons about claims.
        
        Input: Structured data from claim_linker + consistency_tester
        Output: Detailed worldview-specific reasoning for each claim
        """
        if target_worldviews is None:
            target_worldviews = self.profile_loader.list_profiles()
        
        # Cap the number of comparable positions to 3
        if len(target_worldviews) > 3:
            original_count = len(target_worldviews)
            target_worldviews = target_worldviews[:3]
            print(f"⚠️  Capping worldview comparison to 3 positions (requested {original_count}). Using: {target_worldviews}")
        
        claims = structured_data.get('claims', [])
        if not claims:
            return {'error': 'No claims found in structured data'}
        
        # Step 1: Generate worldview-specific reasoning for each claim
        worldview_analyses = {}
        for worldview_id in target_worldviews:
            print(f"🧠 Analyzing through {worldview_id} worldview...")
            worldview_analyses[worldview_id] = self._analyze_single_worldview(
                structured_data, worldview_id
            )
        
        # Step 2: Compare reasoning paths across worldviews
        print("🔍 Comparing reasoning paths...")
        comparison_analysis = self._compare_worldview_reasoning(worldview_analyses, claims)
        
        # Step 3: Identify divergence points
        print("🎯 Identifying divergence points...")
        if self.use_local_divergence:
            # Use local NLI-based divergence analysis
            from comparative_reasoning.local_divergence_analyzer import analyze_divergence_local
            divergence_analysis = analyze_divergence_local(worldview_analyses, comparison_analysis)
        else:
            # Use LLM-based divergence analysis
            divergence_analysis = self._identify_divergence_points(worldview_analyses, comparison_analysis)
        
        return {
            'worldview_analyses': worldview_analyses,
            'comparison_analysis': comparison_analysis,
            'divergence_analysis': divergence_analysis,
            'structured_input': structured_data
        }
    
    def _analyze_single_worldview(self, structured_data: Dict[str, Any], 
                                worldview_id: str) -> Dict[str, Any]:
        """
        Analyze how ONE specific worldview interprets ALL claims.
        Uses LLM with structured context from claim_linker + consistency_tester.
        """
        profile = self.profile_loader.get_profile(worldview_id)
        if not profile:
            return {'error': f'Worldview {worldview_id} not found'}
        
        claims = structured_data.get('claims', [])
        worldview_reasoning = []
        
        for claim in claims:
            claim_analysis = self._llm_analyze_claim_through_worldview(
                claim, structured_data, profile
            )
            worldview_reasoning.append(claim_analysis)
        
        return {
            'worldview_id': worldview_id,
            'worldview_name': profile.get('display_name', worldview_id),
            'claim_analyses': worldview_reasoning,
            'overall_assessment': self._generate_overall_worldview_assessment(worldview_reasoning, profile)
        }
    
    def _llm_analyze_claim_through_worldview(self, claim: Dict[str, Any], 
                                           structured_data: Dict[str, Any], 
                                           profile: Dict[str, Any]) -> Dict[str, Any]:
        """
        Use LLM to analyze ONE claim through ONE worldview lens.
        Fed with rich structured context from claim_linker and consistency_tester.
        """
        # Extract structured context from both components
        claim_text = claim.get('text', '')
        
        # Get all 3 types of consistency data from consistency_tester
        consistency_data = self._extract_consistency_data(claim, structured_data, profile)
        
        # Get linked concepts from claim_linker
        linked_concepts = self._extract_linked_concepts(claim, profile.get('worldview_id', ''))
        
        # Build rich prompt with all structured data
        prompt = self._build_enhanced_worldview_prompt(
            claim_text, consistency_data, linked_concepts, profile
        )
        
        try:
            # Use provider abstraction with centralized prompts and schema
            messages = [
                {"role": "system", "content": PromptTemplates.worldview_analysis_system_prompt()},
                {"role": "user", "content": prompt}
            ]
            
            response_schema = PromptTemplates.worldview_analysis_schema()
            
            response = self.provider.chat_completion(
                messages=messages,
                schema=response_schema,
                temperature=0.3,
                max_tokens=2000  # Increased for more detailed reasoning
            )
            
            llm_response_json = response.get('parsed')
            
            # Validate reasoning length - check if it meets minimum requirement
            reasoning = llm_response_json.get('reasoning', '')
            if reasoning:
                sentences = [s.strip() for s in reasoning.split('.') if s.strip()]
                if len(sentences) < 3:
                    print(f"⚠️  Warning: Reasoning has only {len(sentences)} sentence(s), expected at least 3. Content: {reasoning[:100]}...")
            
            # Debug: Show the structured response
            print(f"🔍 LLM Structured Response: {json.dumps(llm_response_json, indent=2)[:200]}...")
            
            # Convert to our internal format
            return self._convert_structured_response(llm_response_json, claim_text, consistency_data, claim)
            
        except Exception as e:
            print(f"❌ LLM analysis failed: {e}")
            # If LLM fails, the system should fail - no fallback
            return {
                'error': f'LLM analysis required but failed: {e}',
                'claim_text': claim_text
            }
    
    def _extract_consistency_data(self, claim: Dict[str, Any], structured_data: Dict[str, Any], 
                                profile: Dict[str, Any]) -> Dict[str, Any]:
        """Extract all 3 types of consistency data from consistency_tester"""
        
        worldview_id = profile.get('worldview_id', '')
        claim_text = claim.get('text', '')
        
        consistency_data = {
            # Type 1: Basic premise-claim logic
            'premise_claim_consistency': claim.get('overall_consistency', 0.5),
            'premise_scores': [p.get('consistency_score', 0.5) for p in claim.get('premises', [])],
            
            # Type 2: Within worldview consistency (from structured_data if available)
            'worldview_internal_consistency': 0.5,  # Default
            
            # Type 3: Cross worldview consistency (from structured_data if available)
            'cross_worldview_consistency': {}
        }
        
        # Try to extract worldview-specific consistency if available
        cross_worldview_data = structured_data.get('cross_worldview_consistency', {})
        if cross_worldview_data:
            worldview_consistencies = cross_worldview_data.get('worldview_consistencies', {})
            if worldview_id in worldview_consistencies:
                wv_data = worldview_consistencies[worldview_id]
                consistency_data['worldview_internal_consistency'] = wv_data.get('consistency_score', 0.5)
            
            consistency_data['cross_worldview_consistency'] = cross_worldview_data.get('cross_worldview_analysis', {})
        
        return consistency_data

    def _build_enhanced_worldview_prompt(self, claim_text: str, consistency_data: Dict[str, Any],
                                       linked_concepts: List[Dict], profile: Dict[str, Any]) -> str:
        """Build enhanced prompt using all structured data from claim_linker and consistency_tester"""
        
        worldview_name = profile.get('display_name', 'Unknown')
        core_values = profile.get('core_values', [])[:3]  # Top 3 values
        definitions = profile.get('definitions', {})
        
        # Format linked concepts from claim_linker
        try:
            concepts_text = self._format_linked_concepts(linked_concepts)
            if not concepts_text:
                concepts_text = "No specific concepts linked"
        except Exception as format_err:
            print(f"⚠️ Failed to format linked concepts for {worldview_name}: {format_err} (type={type(linked_concepts)})")
            concepts_text = "Linked concept details unavailable"
        
        # Format consistency data from consistency_tester (all 3 types)
        premise_consistency = consistency_data.get('premise_claim_consistency', 0.5)
        worldview_consistency = consistency_data.get('worldview_internal_consistency', 0.5)
        cross_worldview = consistency_data.get('cross_worldview_consistency', {})
        
        consistency_text = f"""
CONSISTENCY ANALYSIS (from NLI model):
1. Premise-Claim Logic: {premise_consistency:.2f} (how well premises support this claim)
2. Within {worldview_name}: {worldview_consistency:.2f} (how well claim fits this worldview's principles)
3. Cross-Worldview Agreement: {cross_worldview.get('agreement_level', 'unknown')} (how much worldviews agree on this claim)"""
        
        prompt = f"""
Analyze this claim from a {worldview_name} worldview perspective using the structured data provided.

CLAIM: "{claim_text}"

{consistency_text}

WORLDVIEW PROFILE:
- Name: {worldview_name}
- Core values: {', '.join([v.get('name', '') for v in core_values])}
- Core value details: {json.dumps([{'name': v.get('name', ''), 'desc': v.get('desc', '')} for v in core_values], indent=2)}
- Key definitions: {json.dumps(definitions, indent=2) if definitions else 'None provided'}

LINKED CONCEPTS (from claim_linker):
{concepts_text if concepts_text else 'No specific concepts linked'}

Provide a detailed analysis of how {worldview_name} would interpret and respond to this claim. Consider:

1. How would {worldview_name} interpret this claim given their core values and definitions?
2. Would they support, oppose, or be conditional about it? (Use the consistency scores as guidance)
3. What's the logical reasoning path from their values through the linked concepts to their position?
4. What are 3-5 key underlying assumptions or beliefs that lead to this worldview's position? For EACH assumption, also identify which core value from the worldview profile it primarily relates to. The core_value should be one of the worldview's core values listed above (e.g., "negative_liberty", "stewardship", "national_sovereignty", "moral_order") or a closely related value name (2-4 words, capitalized like "Free Markets", "Individual Liberty").
5. What specific concerns would {worldview_name} raise based on their principles?
6. What alternative approach would better align with {worldview_name} values?

IMPORTANT: The key_assumptions should be worldview-specific beliefs that explain WHY this worldview takes this position. They should be distinct, meaningful assumptions that can be traced to the worldview's core values.

Respond with structured JSON containing your analysis.
"""
        
        return prompt

    def _format_linked_concepts(self, linked_concepts: Any) -> str:
        """Safely format linked concepts into bullet points."""
        
        if not linked_concepts:
            return ""
        
        concept_iterable: List[Any]
        try:
            if isinstance(linked_concepts, dict):
                # Some versions return dict keyed by concept ids
                concept_iterable = list(linked_concepts.values())
            elif isinstance(linked_concepts, list):
                concept_iterable = linked_concepts
            elif hasattr(linked_concepts, 'to_dict'):
                concept_iterable = list(linked_concepts.to_dict().values())
            elif hasattr(linked_concepts, '__iter__') and not isinstance(linked_concepts, (str, bytes)):
                concept_iterable = list(linked_concepts)
            else:
                # Unexpected type (could be string, tuple, etc.)
                concept_iterable = [linked_concepts]
        except Exception as err:
            print(f"⚠️ Unable to normalize linked_concepts ({type(linked_concepts)}): {err}")
            concept_iterable = [linked_concepts]
        
        concept_lines = []
        
        for concept in concept_iterable[:3]:
            name = "Unnamed concept"
            raw_content = ""
            
            if isinstance(concept, dict):
                concept_data = concept.get('concept') if hasattr(concept, 'get') else None
                if not isinstance(concept_data, dict):
                    concept_data = {}
                
                name = (
                    concept_data.get('name')
                    or concept.get('name')
                    or concept.get('concept_name')
                    or concept.get('title')
                    or concept.get('id')
                    or "Unnamed concept"
                )
                
                raw_content = (
                    concept_data.get('content')
                    or concept_data.get('description')
                    or concept.get('content')
                    or concept.get('summary')
                    or concept.get('concept_summary')
                    or concept.get('details')
                    or ""
                )
            elif isinstance(concept, (list, tuple)) and concept:
                name = str(concept[0])[:60]
                raw_content = " ".join(str(part) for part in concept[1:])[:200]
            else:
                # Primitive types (str, tuple, etc.)
                name = str(concept)[:60] if concept else "Unnamed concept"
            
            snippet = raw_content[:100].strip()
            if raw_content and len(raw_content) > 100:
                snippet += "..."
            if not snippet:
                snippet = "No description provided"
            
            concept_lines.append(f"- {name}: {snippet}")
        
        if not concept_lines:
            return ""
        
        return "\\n".join(concept_lines)
    
    def _extract_linked_concepts(self, claim: Dict[str, Any], worldview_id: str) -> List[Dict]:
        """Extract concepts that were linked to this claim for this worldview"""
        
        # Look for worldview_links in the claim (stored per claim by claim_linker)
        worldview_links = claim.get('worldview_links', {})
        if worldview_id in worldview_links:
            # claim_linker stores 'relevant_concepts', not 'linked_concepts'
            return worldview_links[worldview_id].get('relevant_concepts', [])
        
        return []
    
    def _convert_structured_response(self, llm_response_json: Dict[str, Any], claim_text: str, 
                                   consistency_data: Dict[str, Any], claim: Dict[str, Any] = None) -> Dict[str, Any]:
        """Convert structured JSON response from OpenAI to our internal format"""
        
        # Extract assumptions
        # New format: key_assumptions is array of {assumption: str, core_value: str, relevance: str}
        assumptions_raw = llm_response_json.get('key_assumptions', [])
        assumptions = []
        
        if assumptions_raw:
            for item in assumptions_raw:
                if isinstance(item, dict):
                    assumption_text = item.get('assumption', '')
                    if assumption_text:
                        assumptions.append(assumption_text)
                elif isinstance(item, str):
                    # Fallback: if old format (just strings), use as-is
                    assumptions.append(item)
        
        # If LLM didn't provide assumptions, try to get from NLP layer
        if not assumptions and claim:
            assumptions_list = claim.get('assumptions', [])
            if assumptions_list:
                assumptions = [a.get('text', a) if isinstance(a, dict) else str(a) for a in assumptions_list[:5]]
        
        # Final fallback: extract from reasoning (but this is less ideal)
        if not assumptions:
            reasoning = llm_response_json.get('reasoning', '')
            # Extract key sentences from reasoning as assumptions
            sentences = [s.strip() for s in reasoning.split('.') if len(s.strip()) > 20 and len(s.strip()) < 150]
            assumptions = sentences[:3]  # Take first 3 meaningful sentences
        
        # Ensure we have at least some assumptions
        if not assumptions:
            assumptions = ["Core worldview principle applies"]
        
        # Calculate dynamic confidence score based on analysis quality
        confidence = self._calculate_confidence_score(
            llm_response_json=llm_response_json,
            consistency_data=consistency_data,
            assumptions=assumptions
        )
        
        return {
            'claim_text': claim_text,
            'interpretation': llm_response_json.get('interpretation', 'No interpretation provided'),
            'position': llm_response_json.get('position', 'conditional'),
            'reasoning': llm_response_json.get('reasoning', 'No reasoning provided'),
            'reasoning_chain': llm_response_json.get('reasoning_chain', []),  # Step-by-step logical chain
            'concerns': llm_response_json.get('concerns', 'No concerns identified'),
            'detailed_concerns': llm_response_json.get('detailed_concerns', []),  # Structured concerns with explanations
            'alternative_approach': llm_response_json.get('alternative_approach', 'No alternative suggested'),
            'assumptions': assumptions,  # Array of assumption strings
            'assumption_details': llm_response_json.get('key_assumptions', []),  # Full assumption objects with relevance
            'consistency_data': consistency_data,
            'confidence': confidence,
            'llm_generated': True,
            'structured_response': True  # Mark as using new structured API
        }
    def _calculate_confidence_score(self, llm_response_json: Dict[str, Any], 
                                   consistency_data: Dict[str, Any],
                                   assumptions: List[str]) -> float:
        """
        Calculate dynamic confidence score (0.0-1.0) based on analysis quality.
        
        Factors considered:
        1. Consistency scores (40%): How well premises support claim and worldview alignment
        2. Reasoning quality (25%): Length, detail, and structure of reasoning
        3. Completeness (20%): Presence of key elements (assumptions, concerns, reasoning chain)
        4. Position clarity (15%): Clear support/oppose vs conditional
        """
        confidence_components = []
        
        # 1. Consistency Component (40% weight)
        premise_claim_consistency = consistency_data.get('premise_claim_consistency', 0.5)
        worldview_internal_consistency = consistency_data.get('worldview_internal_consistency', 0.5)
        
        # Average consistency scores, but give slight preference to premise-claim
        avg_consistency = (premise_claim_consistency * 0.6 + worldview_internal_consistency * 0.4)
        consistency_score = avg_consistency * 0.4  # 40% weight
        confidence_components.append(consistency_score)
        
        # 2. Reasoning Quality Component (25% weight)
        reasoning = llm_response_json.get('reasoning', '')
        reasoning_length = len(reasoning.strip())
        
        # Check for reasoning chain (step-by-step logic)
        reasoning_chain = llm_response_json.get('reasoning_chain', [])
        has_reasoning_chain = len(reasoning_chain) >= 3  # At least 3 steps
        
        # Quality scoring:
        # - Length: 100-300 chars = good, 300+ = excellent, <100 = poor
        if reasoning_length >= 300:
            length_score = 1.0
        elif reasoning_length >= 100:
            length_score = 0.8
        elif reasoning_length >= 50:
            length_score = 0.6
        else:
            length_score = 0.3
        
        # Bonus for structured reasoning chain
        chain_bonus = 0.2 if has_reasoning_chain else 0.0
        
        reasoning_score = (length_score + chain_bonus) * 0.25  # 25% weight
        confidence_components.append(reasoning_score)
        
        # 3. Completeness Component (20% weight)
        interpretation = llm_response_json.get('interpretation', '')
        concerns = llm_response_json.get('concerns', '')
        detailed_concerns = llm_response_json.get('detailed_concerns', [])
        alternative_approach = llm_response_json.get('alternative_approach', '')
        
        completeness_score = 0.0
        # Interpretation present and meaningful (>20 chars)
        if len(interpretation.strip()) > 20:
            completeness_score += 0.25
        # Assumptions identified
        if len(assumptions) >= 2:
            completeness_score += 0.25
        # Concerns identified (either simple or detailed)
        if (len(concerns.strip()) > 20 and 'No concerns' not in concerns) or len(detailed_concerns) > 0:
            completeness_score += 0.25
        # Alternative approach suggested
        if len(alternative_approach.strip()) > 20 and 'No alternative' not in alternative_approach:
            completeness_score += 0.25
        
        completeness_component = completeness_score * 0.20  # 20% weight
        confidence_components.append(completeness_component)
        
        # 4. Position Clarity Component (15% weight)
        position = llm_response_json.get('position', 'conditional').lower()
        
        # Clear positions (support/oppose) indicate higher confidence
        if position in ['support', 'oppose']:
            position_score = 1.0
        elif position == 'conditional':
            position_score = 0.7  # Conditional is less certain
        else:
            position_score = 0.5  # Unknown position
        
        position_component = position_score * 0.15  # 15% weight
        confidence_components.append(position_component)
        
        # Calculate final confidence (sum of all components)
        total_confidence = sum(confidence_components)
        
        # Ensure confidence is between 0.5 and 0.95
        # Minimum 0.5 because if we got a response, there's at least some confidence
        # Maximum 0.95 because we can never be 100% certain
        final_confidence = max(0.5, min(0.95, total_confidence))
        
        return round(final_confidence, 2)
    

    
    def _generate_overall_worldview_assessment(self, claim_analyses: List[Dict], 
                                             profile: Dict[str, Any]) -> Dict[str, Any]:
        """Generate overall assessment of how this worldview approaches the topic"""
        
        positions = [analysis.get('position', 'conditional') for analysis in claim_analyses]
        support_count = positions.count('support')
        oppose_count = positions.count('oppose')
        conditional_count = positions.count('conditional')
        
        # Determine dominant stance
        if support_count > oppose_count and support_count > conditional_count:
            dominant_stance = 'generally supportive'
        elif oppose_count > support_count and oppose_count > conditional_count:
            dominant_stance = 'generally opposed'
        else:
            dominant_stance = 'mixed/conditional'
        
        return {
            'dominant_stance': dominant_stance,
            'position_distribution': {
                'support': support_count,
                'oppose': oppose_count,
                'conditional': conditional_count
            },
            'consistency_pattern': 'consistent' if len(set(positions)) <= 2 else 'varied',
            'worldview_summary': f"{profile.get('display_name', 'Unknown')} shows {dominant_stance} stance"
        }
    
    def _compare_worldview_reasoning(self, worldview_analyses: Dict[str, Any], 
                                   claims: List[Dict]) -> Dict[str, Any]:
        """
        Compare reasoning paths across worldviews to find similarities and differences.
        This addresses: 'Compare reasoning paths across worldviews'
        """
        
        comparison_results = []
        
        for i, claim in enumerate(claims):
            claim_comparison = self._compare_single_claim_across_worldviews(i, worldview_analyses)
            comparison_results.append(claim_comparison)
        
        return {
            'claim_comparisons': comparison_results,
            'summary': self._generate_comparison_summary(comparison_results)
        }
    
    def _compare_single_claim_across_worldviews(self, claim_index: int, 
                                              worldview_analyses: Dict[str, Any]) -> Dict[str, Any]:
        """Compare how different worldviews analyzed the same claim"""
        
        worldview_positions = {}
        reasoning_approaches = {}
        
        for worldview_id, analysis in worldview_analyses.items():
            if claim_index < len(analysis.get('claim_analyses', [])):
                claim_analysis = analysis['claim_analyses'][claim_index]
                worldview_positions[worldview_id] = {
                    'position': claim_analysis.get('position', 'conditional'),
                    'reasoning': claim_analysis.get('reasoning', ''),
                    'concerns': claim_analysis.get('concerns', ''),
                    'interpretation': claim_analysis.get('interpretation', '')
                }
        
        # Identify agreement vs disagreement
        positions = list(set([pos['position'] for pos in worldview_positions.values()]))
        has_disagreement = len(positions) > 1
        
        return {
            'claim_index': claim_index,
            'worldview_positions': worldview_positions,
            'has_disagreement': has_disagreement,
            'position_variety': positions,
            'disagreement_type': self._categorize_disagreement(worldview_positions) if has_disagreement else None
        }
    
    def _categorize_disagreement(self, worldview_positions: Dict[str, Any]) -> str:
        """Use LLM to categorize the type of disagreement between worldviews"""
        
        # Build a concise summary of positions for LLM
        position_summary = "\n".join([
            f"{wv_id}: {data.get('position')} - {data.get('reasoning', '')[:100]}"
            for wv_id, data in worldview_positions.items()
        ])
        
        messages = [
            {"role": "system", "content": PromptTemplates.disagreement_categorization_system_prompt()},
            {"role": "user", "content": PromptTemplates.disagreement_categorization_user_prompt(position_summary)}
        ]
        
        try:
            response = self.provider.chat_completion(
                messages=messages,
                schema=None,  # No structured output needed, just text
                temperature=0.3,
                max_tokens=20
            )
            return response.get('content', '').strip()
        except Exception as e:
            print(f"⚠️  Failed to categorize disagreement: {e}")
            return "Value prioritization difference"
    
    def _identify_divergence_points(self, worldview_analyses: Dict[str, Any], 
                                  comparison_analysis: Dict[str, Any]) -> Dict[str, Any]:
        """
        Use LLM to identify and explain divergence points in values or assumptions.
        """
        
        claim_comparisons = comparison_analysis.get('claim_comparisons', [])
        divergence_points = []
        
        for comparison in claim_comparisons:
            if comparison.get('has_disagreement', False):
                divergence_point = self._analyze_divergence_with_llm(comparison)
                divergence_points.append(divergence_point)
        
        # Extract patterns from LLM-generated divergence analysis
        disagreement_types = [dp.get('disagreement_type', '') for dp in divergence_points]
        common_patterns = [dt for dt in set(disagreement_types) if disagreement_types.count(dt) >= 2]
        fundamental_divides = [dp.get('disagreement_type', '') for dp in divergence_points if dp.get('severity') == 'high']
        
        return {
            'total_divergences': len(divergence_points),
            'divergence_details': divergence_points,
            'common_divergence_patterns': common_patterns,
            'fundamental_divides': list(set(fundamental_divides))
        }
    
    def _analyze_divergence_with_llm(self, comparison: Dict[str, Any]) -> Dict[str, Any]:
        """Use LLM to analyze divergence points with detailed explanations"""
        
        worldview_positions = comparison.get('worldview_positions', {})
        disagreement_type = comparison.get('disagreement_type', 'Unknown')
        claim_index = comparison.get('claim_index', 0)
        
        # Build detailed position summary for LLM
        positions_text = "\n\n".join([
            f"**{wv_id.replace('_', ' ').title()}**\n"
            f"Position: {data.get('position', 'unknown')}\n"
            f"Reasoning: {data.get('reasoning', '')}\n"
            f"Concerns: {data.get('concerns', '')}"
            for wv_id, data in worldview_positions.items()
        ])
        
        messages = [
            {"role": "system", "content": PromptTemplates.divergence_analysis_system_prompt()},
            {"role": "user", "content": PromptTemplates.divergence_analysis_user_prompt(positions_text)}
        ]
        
        try:
            response_schema = PromptTemplates.divergence_analysis_schema()
            
            response = self.provider.chat_completion(
                messages=messages,
                schema=response_schema,
                temperature=0.3,
                max_tokens=8000  # Increased significantly for detailed divergence analysis with all fields
            )
            
            # The provider should NEVER return None - it should either return a dict or raise an exception
            # If we get None, something is seriously wrong with the provider implementation
            if response is None:
                error_msg = "CRITICAL: LLM provider returned None response - this should never happen. Provider should return dict or raise exception."
                print(f"❌ {error_msg}")
                raise ValueError(error_msg)
            
            # Check if response is a dict before calling .get()
            if not isinstance(response, dict):
                error_msg = f"CRITICAL: LLM provider returned non-dict response: {type(response)}. Expected dict."
                print(f"❌ {error_msg}")
                raise ValueError(error_msg)
            
            llm_response = response.get('parsed')
            
            # Check if parsed response is None
            if not llm_response:
                print(f"⚠️  LLM divergence analysis returned None parsed response, trying raw content")
                raw_content = response.get('content', '')
                
                if not raw_content:
                    raise ValueError("LLM response has no content")
                
                # Try to parse JSON if it's a string
                if isinstance(raw_content, str):
                    try:
                        import json
                        llm_response = json.loads(raw_content)
                    except json.JSONDecodeError as parse_err:
                        print(f"⚠️  Failed to parse JSON from content: {parse_err}")
                        print(f"   Content length: {len(raw_content)} characters")
                        print(f"   Content preview (first 500 chars): {raw_content[:500]}")
                        print(f"   Content preview (last 500 chars): {raw_content[-500:]}")
                        
                        # Try to fix common truncation issues - look for the last complete JSON object
                        # This is a fallback for when the response was truncated
                        try:
                            # Try to find the last complete closing brace
                            last_brace = raw_content.rfind('}')
                            if last_brace > 0:
                                # Try to parse up to the last brace
                                partial_json = raw_content[:last_brace + 1]
                                llm_response = json.loads(partial_json)
                                print(f"   ✓ Successfully parsed partial JSON (truncated response)")
                            else:
                                raise ValueError("Could not find valid JSON structure")
                        except Exception as fix_err:
                            print(f"   ✗ Could not fix truncated JSON: {fix_err}")
                            # Return a minimal valid structure so the frontend doesn't break
                            llm_response = {
                                'severity': 'moderate',
                                'explanation': f"Divergence analysis was truncated. Raw content length: {len(raw_content)} characters. This may indicate the response exceeded token limits.",
                                'value_conflicts': [],
                                'assumption_conflicts': [],
                                'disagreement_dimensions': [],
                                'common_ground': {}
                            }
                    except Exception as parse_err:
                        print(f"⚠️  Unexpected error parsing JSON: {parse_err}")
                        llm_response = {}
                else:
                    llm_response = raw_content if isinstance(raw_content, dict) else {}
            
            if not llm_response:
                raise ValueError("LLM response is empty or could not be parsed")
            
            print(f"✅ LLM Divergence Analysis: Severity={llm_response.get('severity', 'unknown')}, Explanation length={len(llm_response.get('explanation', ''))}")
            
            # Transform LLM response to frontend format
            # New format: LLM returns [{worldview1, worldview2, value1, value2, conflict_type, detailed_explanation, impact}, ...]
            # Also support old format for backward compatibility
            
            value_conflicts_raw = llm_response.get('value_conflicts', [])
            value_conflicts_transformed = []
            
            for conflict in value_conflicts_raw:
                # Check if new format (has worldview1, worldview2, value1, value2)
                if 'worldview1' in conflict and 'worldview2' in conflict:
                    # New detailed format
                    value_conflicts_transformed.append({
                        'worldview1': conflict.get('worldview1', ''),
                        'worldview2': conflict.get('worldview2', ''),
                        'conflicting_value1': conflict.get('value1', ''),
                        'conflicting_value2': conflict.get('value2', ''),
                        'conflict_type': conflict.get('conflict_type', 'priority'),
                        'detailed_explanation': conflict.get('detailed_explanation', ''),
                        'impact': conflict.get('impact', '')
                    })
                else:
                    # Old format - transform to new format
                    worldview = conflict.get('worldview', '')
                    values = conflict.get('values', [])
                    if values and len(values) > 0:
                        # For old format, we need to pair with other worldviews
                        # This is a simplified transformation
                        value_conflicts_transformed.append({
                            'worldview1': worldview,
                            'worldview2': 'Other',
                            'conflicting_value1': values[0] if values else 'core values',
                            'conflicting_value2': 'core values',
                            'conflict_type': 'priority',
                            'detailed_explanation': f"{worldview} prioritizes {values[0] if values else 'these values'}",
                            'impact': 'This affects their overall position on the claim'
                        })
            
            # Transform assumption conflicts
            # New format: [{worldview, assumptions, position, why_conflicting, root_belief}, ...]
            assumption_conflicts_raw = llm_response.get('assumption_conflicts', [])
            assumption_conflicts_transformed = []
            
            for conflict in assumption_conflicts_raw:
                # Check if it's an object (new format) or string (old format)
                if isinstance(conflict, dict):
                    worldview = conflict.get('worldview', 'Unknown')
                    position = conflict.get('position', 'unknown')
                    assumptions = conflict.get('assumptions', [])
                    why_conflicting = conflict.get('why_conflicting', '')
                    root_belief = conflict.get('root_belief', '')
                    
                    # Store as structured object for frontend
                    assumption_conflicts_transformed.append({
                        'worldview': worldview,
                        'position': position,
                        'assumptions': assumptions,
                        'why_conflicting': why_conflicting,
                        'root_belief': root_belief
                    })
                else:
                    # Old format - string
                    assumption_conflicts_transformed.append(conflict)
            
            # Map 'moderate' to 'medium' for frontend
            severity = llm_response.get('severity', 'moderate')
            if severity == 'moderate':
                severity = 'medium'
            
            return {
                'claim_index': claim_index,
                'disagreement_type': disagreement_type,
                'severity': severity,
                'explanation': llm_response.get('explanation', ''),
                'value_conflicts': value_conflicts_transformed,
                'assumption_conflicts': assumption_conflicts_transformed,
                'disagreement_dimensions': llm_response.get('disagreement_dimensions', []),
                'common_ground': llm_response.get('common_ground', {})
            }
            
        except Exception as e:
            import traceback
            print(f"❌ LLM divergence analysis failed for claim {claim_index}: {e}")
            print(f"   Traceback: {traceback.format_exc()}")
            # Minimal fallback
            return {
                'claim_index': claim_index,
                'disagreement_type': disagreement_type,
                'severity': 'moderate',
                'explanation': f"Worldviews disagree on this claim. Analysis unavailable due to: {str(e)}",
                'value_conflicts': [],
                'assumption_conflicts': [],
                'disagreement_dimensions': [],
                'common_ground': {}
            }
    
    def _generate_comparison_summary(self, comparison_results: List[Dict]) -> Dict[str, Any]:
        """Generate summary of cross-worldview comparison"""
        
        total_claims = len(comparison_results)
        disagreements = sum(1 for cr in comparison_results if cr.get('has_disagreement', False))
        consensus = total_claims - disagreements
        
        return {
            'total_claims_analyzed': total_claims,
            'disagreements': disagreements,
            'consensus_points': consensus,
            'disagreement_rate': disagreements / total_claims if total_claims > 0 else 0,
            'most_common_disagreement_type': self._get_most_common_disagreement(comparison_results)
        }
    
    def _get_most_common_disagreement(self, comparison_results: List[Dict]) -> str:
        """Find the most common type of disagreement"""
        
        disagreement_types = [
            cr.get('disagreement_type', 'Unknown') 
            for cr in comparison_results 
            if cr.get('has_disagreement', False)
        ]
        
        if not disagreement_types:
            return 'No disagreements found'
        
        # Count frequency
        type_counts = {}
        for dt in disagreement_types:
            type_counts[dt] = type_counts.get(dt, 0) + 1
        
        return max(type_counts.items(), key=lambda x: x[1])[0]
    
    def analyze_convergence(self, claim_text: str, worldview_analyses: Dict[str, Any]) -> Dict[str, Any]:
        """
        Analyze convergence/divergence in reasoning chains across worldviews.
        This is an optional, on-demand analysis that identifies where reasoning paths converge or diverge.
        
        Args:
            claim_text: The claim being analyzed
            worldview_analyses: Dict of {worldview_id: analysis_data} containing reasoning_chain
        
        Returns:
            Dict containing convergence analysis with steps, primary_divergence_point, key_insight
        """
        try:
            print(f"🔄 Starting convergence analysis for {len(worldview_analyses)} worldviews...")
            
            # Format worldview reasoning data for the prompt
            reasoning_data_parts = []
            for wv_id, analysis in worldview_analyses.items():
                reasoning_chain = analysis.get('reasoning_chain', [])
                if not reasoning_chain:
                    print(f"   ⚠️  {wv_id} has no reasoning_chain, skipping")
                    continue
                
                reasoning_data_parts.append(f"**{wv_id.upper()}:**")
                for step in reasoning_chain:
                    step_num = step.get('step_number', '?')
                    description = step.get('description', '')
                    connects_to = step.get('connects_to', '')
                    reasoning_data_parts.append(f"  Step {step_num} ({connects_to}): {description}")
                reasoning_data_parts.append("")  # Blank line between worldviews
            
            worldview_reasoning_data = "\n".join(reasoning_data_parts)
            
            if not worldview_reasoning_data.strip():
                return {
                    'error': 'No reasoning chain data available for convergence analysis',
                    'steps': [],
                    'primary_divergence_point': 1,
                    'key_insight': 'Insufficient data for convergence analysis'
                }
            
            # Build prompt (same pattern as worldview analysis)
            system_prompt = PromptTemplates.convergence_analysis_system_prompt()
            user_prompt = PromptTemplates.convergence_analysis_user_prompt(claim_text, worldview_reasoning_data)
            response_schema = PromptTemplates.convergence_analysis_schema()
            
            print(f"   📤 Sending convergence analysis request to LLM...")
            
            # Format messages (same as existing working calls)
            messages = [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ]
            
            # Call LLM with structured output (same pattern as worldview analysis)
            response = self.provider.chat_completion(
                messages=messages,
                schema=response_schema,
                temperature=0.3,
                max_tokens=3000
            )
            
            # Get parsed response (same as worldview analysis)
            llm_response_json = response.get('parsed')
            
            # Validate response (same pattern as worldview analysis)
            if not llm_response_json:
                # Fallback: try to parse raw content
                raw_content = response.get('content', '') if response else ''
                if raw_content:
                    import json
                    try:
                        llm_response_json = json.loads(raw_content)
                        print(f"   ⚠️  Used fallback JSON parsing from raw content")
                    except json.JSONDecodeError as e:
                        raise ValueError(f"Failed to parse convergence analysis: {e}")
                else:
                    raise ValueError("No parsed result in LLM response for convergence analysis")
            
            print(f"   ✅ Convergence analysis completed")
            print(f"   Primary divergence point: Step {llm_response_json.get('primary_divergence_point')}")
            print(f"   Key insight: {llm_response_json.get('key_insight', '')[:80]}...")
            
            return llm_response_json
            
        except Exception as e:
            print(f"   ❌ Convergence analysis failed: {e}")
            import traceback
            traceback.print_exc()
            return {
                'error': f'Convergence analysis failed: {str(e)}',
                'steps': [],
                'primary_divergence_point': 1,
                'key_insight': 'Analysis failed due to error'
            }


def analyze_with_llm_reasoning(structured_data: Dict[str, Any], 
                             worldviews: List[str] = None,
                             llm_provider: str = "openai",
                             llm_model: str = None) -> Dict[str, Any]:
    """
    Quick function to run LLM-enhanced comparative reasoning analysis.
    
    Takes structured data from claim_linker + consistency_tester,
    uses LLM to analyze each worldview's reasoning,
    then compares to find divergence points.
    
    Args:
        structured_data: Data from claim_linker + consistency_tester
        worldviews: List of worldview IDs to analyze
        llm_provider: LLM provider to use ("openai", "claude", etc.)
        llm_model: Optional specific model name
    """
    
    reasoner = LLMComparativeReasoner(
        llm_provider=llm_provider,
        llm_model=llm_model
    )
    return reasoner.analyze_worldview_reasoning(structured_data, worldviews)


if __name__ == "__main__":
    # Test with mock structured data
    print("🧠 Testing LLM-Enhanced Comparative Reasoning...")
    print("⚠️  Requires OpenAI API key to run")
    
    mock_structured_data = {
        'claims': [
            {
                'text': 'The government should implement universal healthcare as a fundamental right.',
                'overall_consistency': 0.82,
                'premises': [{'text': 'Healthcare is essential for human dignity', 'consistency_score': 0.85}]
            }
        ],
        'worldview_links': {
            'libertarian': {
                'linked_concepts': [
                    {'concept': {'name': 'negative_liberty', 'content': 'Freedom from government interference'}}
                ]
            }
        },
        'cross_worldview_consistency': {
            'worldview_consistencies': {
                'libertarian': {'consistency_score': 0.3, 'interpretation': 'somewhat inconsistent'},
                'eco_justice': {'consistency_score': 0.9, 'interpretation': 'highly consistent'}
            },
            'cross_worldview_analysis': {'agreement_level': 'strong disagreement'}
        }
    }
    
    try:
        reasoner = LLMComparativeReasoner()
        results = reasoner.analyze_worldview_reasoning(mock_structured_data)
        print(f"✅ Analysis complete! Found {results['divergence_analysis']['total_divergences']} divergence points")
    except RuntimeError as e:
        print(f"⚠️  {e}")