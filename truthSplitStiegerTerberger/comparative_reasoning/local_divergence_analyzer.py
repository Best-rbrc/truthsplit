"""
Local Divergence Analyzer

Uses NLI models and semantic similarity to identify divergence points between worldviews
without requiring OpenAI API calls. Leverages existing consistency_tester infrastructure.

Architecture:
1. Use NLI to detect contradictions between worldview positions
2. Calculate semantic distance using embeddings
3. Extract value conflicts from worldview profiles
4. Determine severity based on contradiction strength + semantic distance
"""

import sys
from pathlib import Path
from typing import Dict, Any, List, Tuple
import numpy as np

# Add parent directory for imports
sys.path.append(str(Path(__file__).parent.parent))

from transformers import pipeline
from structured_knowledge_layer.profile_loader import ProfileLoader

# Load sentence embeddings for semantic similarity
try:
    from sentence_transformers import SentenceTransformer
    EMBEDDINGS_AVAILABLE = True
except ImportError:
    EMBEDDINGS_AVAILABLE = False
    print("⚠️  sentence-transformers not available")


class LocalDivergenceAnalyzer:
    """
    Analyzes divergence between worldview positions using local NLI models
    and semantic similarity, without requiring LLM API calls.
    """
    
    def __init__(self, profiles_dir: str = None):
        if profiles_dir is None:
            base_dir = Path(__file__).parent.parent
            profiles_dir = str(base_dir / "structured_knowledge_layer" / "profiles" / "json")
        
        self.profile_loader = ProfileLoader(profiles_dir)
        
        # Initialize NLI model for contradiction detection
        self.nli_model = pipeline(
            "zero-shot-classification",
            model="facebook/bart-large-mnli",
            device=-1  # CPU
        )
        print("✅ Loaded NLI model for divergence analysis")
        
        # Load embedding model for semantic similarity
        if EMBEDDINGS_AVAILABLE:
            self.embedder = SentenceTransformer('all-MiniLM-L6-v2')
            print("✅ Loaded embedding model for semantic similarity")
        else:
            self.embedder = None
            print("⚠️  No embedding model available - using NLI only")
    
    def analyze_divergence(self, worldview_analyses: Dict[str, Any], 
                          comparison_analysis: Dict[str, Any]) -> Dict[str, Any]:
        """
        Analyze divergence points between worldviews using NLI and semantic similarity.
        
        Args:
            worldview_analyses: Dict of worldview_id -> analysis results
            comparison_analysis: Cross-worldview comparison data
            
        Returns:
            Divergence analysis with severity, explanations, and conflict details
        """
        print("🔍 Running local divergence analysis (NLI-based)...")
        
        claim_comparisons = comparison_analysis.get('claim_comparisons', [])
        divergence_points = []
        
        for comparison in claim_comparisons:
            disagreement_type = comparison.get('disagreement_type', '')
            
            # Analyze all comparisons - let NLI determine if there's real divergence
            # We'll filter out low-divergence cases based on NLI scores
            divergence_point = self._analyze_divergence_local(
                comparison, 
                worldview_analyses
            )
            
            # Only include if there's actual divergence (contradiction > 0.3 or distance > 0.3)
            max_contradiction = max(divergence_point.get('nli_scores', {}).values(), default=0.0)
            max_distance = max(divergence_point.get('semantic_distances', {}).values(), default=0.0)
            
            if max_contradiction > 0.3 or max_distance > 0.3:
                divergence_points.append(divergence_point)
        
        # Extract patterns
        fundamental_divides = [
            dp.get('disagreement_type', '') 
            for dp in divergence_points 
            if dp.get('severity') == 'high'
        ]
        
        print(f"✅ Found {len(divergence_points)} divergence points ({len(fundamental_divides)} high severity)")
        
        return {
            'total_divergences': len(divergence_points),
            'divergence_details': divergence_points,
            'fundamental_divides': fundamental_divides,
        }
    
    def _analyze_divergence_local(self, comparison: Dict[str, Any], 
                                   worldview_analyses: Dict[str, Any]) -> Dict[str, Any]:
        """
        Analyze a single divergence point using NLI and semantic similarity.
        """
        worldview_positions = comparison.get('worldview_positions', {})
        disagreement_type = comparison.get('disagreement_type', 'Unknown')
        claim_index = comparison.get('claim_index', 0)
        
        # Extract positions and reasoning
        positions_data = []
        for wv_id, data in worldview_positions.items():
            position = data.get('position', 'unknown')
            reasoning = data.get('reasoning', '')
            concerns = data.get('concerns', '')
            
            positions_data.append({
                'worldview': wv_id,
                'position': position,
                'reasoning': reasoning,
                'concerns': concerns,
                'full_text': f"{reasoning} {concerns}".strip()
            })
        
        # Calculate contradiction scores between positions
        contradiction_scores = self._calculate_contradiction_scores(positions_data)
        
        # Calculate semantic distances
        semantic_distances = self._calculate_semantic_distances(positions_data)
        
        # Determine severity based on contradiction + semantic distance
        severity = self._determine_severity(contradiction_scores, semantic_distances)
        
        # Generate explanation based on NLI results
        explanation = self._generate_explanation(
            positions_data, 
            contradiction_scores, 
            semantic_distances
        )
        
        # Extract value conflicts from worldview profiles
        value_conflicts = self._extract_value_conflicts(positions_data)
        
        # Extract assumption conflicts from reasoning
        assumption_conflicts = self._extract_assumption_conflicts(positions_data)
        
        return {
            'claim_index': claim_index,
            'disagreement_type': disagreement_type,
            'severity': severity,
            'explanation': explanation,
            'value_conflicts': value_conflicts,
            'assumption_conflicts': assumption_conflicts,
            'nli_scores': contradiction_scores,  # Include for transparency
            'semantic_distances': semantic_distances,  # Include for transparency
        }
    
    def _calculate_contradiction_scores(self, positions_data: List[Dict]) -> Dict[str, float]:
        """
        Use NLI model to calculate contradiction scores between positions.
        """
        if not self.nli_model or len(positions_data) < 2:
            return {}
        
        contradiction_scores = {}
        
        # Compare each pair of positions
        for i in range(len(positions_data)):
            for j in range(i + 1, len(positions_data)):
                pos1 = positions_data[i]
                pos2 = positions_data[j]
                
                # Skip if no reasoning text
                if not pos1['full_text'] or not pos2['full_text']:
                    continue
                
                # Run NLI in both directions to check for contradiction
                # Test if pos1 contradicts pos2
                result1 = self.nli_model(
                    pos1['full_text'][:512],  # Truncate for model limits
                    ["agrees with", "contradicts", "is neutral to"],
                    hypothesis_template="This {} the statement: " + pos2['full_text'][:512]
                )
                
                # Test if pos2 contradicts pos1
                result2 = self.nli_model(
                    pos2['full_text'][:512],
                    ["agrees with", "contradicts", "is neutral to"],
                    hypothesis_template="This {} the statement: " + pos1['full_text'][:512]
                )
                
                # Extract contradiction scores
                scores1 = {label: score for label, score in zip(result1['labels'], result1['scores'])}
                scores2 = {label: score for label, score in zip(result2['labels'], result2['scores'])}
                
                # Average contradiction score in both directions
                contradiction_score = (
                    scores1.get('contradicts', 0.0) + 
                    scores2.get('contradicts', 0.0)
                ) / 2.0
                
                pair_key = f"{pos1['worldview']}___{pos2['worldview']}"
                contradiction_scores[pair_key] = contradiction_score
        
        return contradiction_scores
    
    def _calculate_semantic_distances(self, positions_data: List[Dict]) -> Dict[str, float]:
        """
        Calculate semantic distances using sentence embeddings.
        """
        if not self.embedder or len(positions_data) < 2:
            return {}
        
        # Get embeddings for all positions
        embeddings = []
        for pos in positions_data:
            if pos['full_text']:
                emb = self.embedder.encode(pos['full_text'][:512])
                embeddings.append(emb)
            else:
                embeddings.append(None)
        
        # Calculate cosine distances (1 - similarity)
        distances = {}
        for i in range(len(positions_data)):
            for j in range(i + 1, len(positions_data)):
                if embeddings[i] is not None and embeddings[j] is not None:
                    # Cosine similarity
                    similarity = np.dot(embeddings[i], embeddings[j]) / (
                        np.linalg.norm(embeddings[i]) * np.linalg.norm(embeddings[j])
                    )
                    distance = 1.0 - similarity
                    
                    pair_key = f"{positions_data[i]['worldview']}___{positions_data[j]['worldview']}"
                    distances[pair_key] = float(distance)
        
        return distances
    
    def _determine_severity(self, contradiction_scores: Dict[str, float], 
                           semantic_distances: Dict[str, float]) -> str:
        """
        Determine severity based on contradiction scores and semantic distance.
        
        High severity: Strong contradiction (> 0.7) OR large semantic distance (> 0.8)
        Medium severity: Moderate contradiction (> 0.4) OR moderate distance (> 0.5)
        Low severity: Otherwise
        """
        if not contradiction_scores and not semantic_distances:
            return 'medium'
        
        # Get maximum contradiction score
        max_contradiction = max(contradiction_scores.values()) if contradiction_scores else 0.0
        
        # Get maximum semantic distance
        max_distance = max(semantic_distances.values()) if semantic_distances else 0.0
        
        # Determine severity
        if max_contradiction > 0.7 or max_distance > 0.8:
            return 'high'
        elif max_contradiction > 0.4 or max_distance > 0.5:
            return 'medium'
        else:
            return 'low'
    
    def _generate_explanation(self, positions_data: List[Dict], 
                             contradiction_scores: Dict[str, float],
                             semantic_distances: Dict[str, float]) -> str:
        """
        Generate a rule-based explanation of the divergence.
        """
        if len(positions_data) < 2:
            return "Insufficient position data to analyze divergence."
        
        # Find the pair with highest contradiction
        max_pair = None
        max_score = 0.0
        
        for pair, score in contradiction_scores.items():
            if score > max_score:
                max_score = score
                max_pair = pair
        
        if not max_pair:
            # Fallback to semantic distance
            for pair, dist in semantic_distances.items():
                if dist > max_score:
                    max_score = dist
                    max_pair = pair
        
        if max_pair:
            wv1, wv2 = max_pair.split('___')
            wv1_name = wv1.replace('_', ' ').replace('-', ' ').title()
            wv2_name = wv2.replace('_', ' ').replace('-', ' ').title()
            
            # Find their positions
            wv1_pos = next((p for p in positions_data if p['worldview'] == wv1), None)
            wv2_pos = next((p for p in positions_data if p['worldview'] == wv2), None)
            
            if wv1_pos and wv2_pos:
                if max_score > 0.7:
                    return (f"{wv1_name} and {wv2_name} hold fundamentally contradictory positions. "
                           f"{wv1_name} {wv1_pos['position']}s while {wv2_name} {wv2_pos['position']}s, "
                           f"reflecting deep philosophical differences in their core values and assumptions.")
                elif max_score > 0.4:
                    return (f"{wv1_name} and {wv2_name} have moderately divergent views. "
                           f"While both consider multiple factors, they prioritize different values "
                           f"and reach different conclusions about the appropriate course of action.")
                else:
                    return (f"{wv1_name} and {wv2_name} have somewhat different emphases "
                           f"but their positions are not fundamentally incompatible.")
        
        return "The worldviews show varying degrees of agreement and disagreement on this claim."
    
    def _extract_value_conflicts(self, positions_data: List[Dict]) -> List[Dict[str, Any]]:
        """
        Extract value conflicts from worldview profiles.
        Returns pairs of conflicting values between worldviews.
        """
        value_conflicts = []
        
        # Get core values for each worldview
        worldview_values = {}
        for pos_data in positions_data:
            worldview_id = pos_data['worldview']
            
            # Get worldview profile
            profile = self.profile_loader.get_profile(worldview_id)
            if not profile:
                continue
            
            # Extract core values from profile
            core_values_raw = profile.get('core_values', [])
            
            # Convert core values to strings (they might be objects with {name, weight, desc})
            core_values = []
            if isinstance(core_values_raw, list):
                for val in core_values_raw:
                    if isinstance(val, str):
                        core_values.append(val)
                    elif isinstance(val, dict):
                        # Extract name or desc field
                        core_values.append(val.get('name') or val.get('desc') or str(val))
                    else:
                        core_values.append(str(val))
            
            # If no structured values, try to extract from description
            if not core_values:
                description = profile.get('description', '')
                # Simple keyword extraction (could be improved)
                value_keywords = ['freedom', 'equality', 'justice', 'security', 
                                'innovation', 'tradition', 'community', 'individual']
                core_values = [kw for kw in value_keywords if kw.lower() in description.lower()]
            
            worldview_values[worldview_id] = core_values[:3]
        
        # Create pairwise value conflicts
        worldview_ids = list(worldview_values.keys())
        for i in range(len(worldview_ids)):
            for j in range(i + 1, len(worldview_ids)):
                wv1_id = worldview_ids[i]
                wv2_id = worldview_ids[j]
                
                wv1_values = worldview_values.get(wv1_id, [])
                wv2_values = worldview_values.get(wv2_id, [])
                
                if wv1_values and wv2_values:
                    # Take primary values from each
                    value_conflicts.append({
                        'worldview1': wv1_id,
                        'worldview2': wv2_id,
                        'conflicting_value1': wv1_values[0] if len(wv1_values) > 0 else "core principles",
                        'conflicting_value2': wv2_values[0] if len(wv2_values) > 0 else "core principles"
                    })
        
        return value_conflicts
    
    def _extract_assumption_conflicts(self, positions_data: List[Dict]) -> List[str]:
        """
        Extract key assumption conflicts using NLI to detect contradictions
        and keyword matching to find divergence points.
        """
        assumption_conflicts = []
        
        # Keywords that indicate important reasoning points
        key_concepts = {
            'economic': ['economy', 'economic', 'jobs', 'growth', 'market', 'business', 'wealth', 'prosperity'],
            'government': ['government', 'state', 'regulation', 'control', 'authority', 'intervention'],
            'freedom': ['freedom', 'liberty', 'individual', 'choice', 'autonomy', 'rights'],
            'collective': ['collective', 'community', 'society', 'common good', 'public'],
            'tradition': ['tradition', 'values', 'cultural', 'heritage', 'identity'],
            'environment': ['environment', 'climate', 'ecological', 'sustainability', 'green', 'planet'],
            'nation': ['nation', 'national', 'sovereignty', 'borders', 'citizens'],
            'justice': ['justice', 'equality', 'fairness', 'equity', 'rights']
        }
        
        # Extract reasoning sentences from each worldview
        worldview_data = {}
        for pos_data in positions_data:
            worldview_id = pos_data['worldview']
            reasoning = pos_data.get('reasoning', '')
            
            # Split into sentences
            sentences = [s.strip() + '.' for s in reasoning.split('.') if s.strip() and len(s.strip()) > 20]
            
            worldview_data[worldview_id] = {
                'position': pos_data['position'],
                'sentences': sentences,
                'reasoning': reasoning
            }
        
        # Compare worldviews pairwise
        worldview_ids = list(worldview_data.keys())
        for i in range(len(worldview_ids)):
            for j in range(i + 1, len(worldview_ids)):
                wv1_id = worldview_ids[i]
                wv2_id = worldview_ids[j]
                
                wv1_data = worldview_data[wv1_id]
                wv2_data = worldview_data[wv2_id]
                
                wv1_name = wv1_id.replace('_', ' ').replace('-', ' ').title()
                wv2_name = wv2_id.replace('_', ' ').replace('-', ' ').title()
                
                # Method 1: Check for contradictions using NLI
                contradictions_found = []
                for sent1 in wv1_data['sentences'][:3]:  # Check first 3 sentences
                    for sent2 in wv2_data['sentences'][:3]:
                        # Use NLI to check if sentences contradict
                        result = self.nli_model(sent1, sent2)
                        label = result['labels'][0]
                        score = result['scores'][0]
                        
                        if label == 'contradiction' and score > 0.6:
                            # Found a contradiction - extract key concepts
                            concepts1 = self._extract_key_concepts(sent1, key_concepts)
                            concepts2 = self._extract_key_concepts(sent2, key_concepts)
                            
                            if concepts1 and concepts2:
                                conflict = f"{wv1_name} prioritizes {', '.join(concepts1)}, while {wv2_name} prioritizes {', '.join(concepts2)}"
                                if conflict not in contradictions_found:
                                    contradictions_found.append(conflict)
                                    break
                    if contradictions_found:
                        break
                
                # Method 2: Keyword-based divergence detection
                wv1_concepts = self._extract_key_concepts(wv1_data['reasoning'], key_concepts)
                wv2_concepts = self._extract_key_concepts(wv2_data['reasoning'], key_concepts)
                
                # Find non-overlapping concepts (what each emphasizes uniquely)
                unique_wv1 = [c for c in wv1_concepts if c not in wv2_concepts]
                unique_wv2 = [c for c in wv2_concepts if c not in wv1_concepts]
                
                if unique_wv1 and unique_wv2 and len(unique_wv1) <= 2 and len(unique_wv2) <= 2:
                    emphasis_conflict = f"{wv1_name} emphasizes {' and '.join(unique_wv1)}, {wv2_name} emphasizes {' and '.join(unique_wv2)}"
                    if emphasis_conflict not in contradictions_found:
                        contradictions_found.append(emphasis_conflict)
                
                # Add found conflicts
                assumption_conflicts.extend(contradictions_found)
        
        return assumption_conflicts
    
    def _extract_key_concepts(self, text: str, key_concepts: Dict[str, List[str]]) -> List[str]:
        """Extract key concept categories mentioned in text."""
        text_lower = text.lower()
        found_concepts = []
        
        for concept_category, keywords in key_concepts.items():
            if any(keyword in text_lower for keyword in keywords):
                found_concepts.append(concept_category)
        
        return found_concepts


# Singleton instance
_divergence_analyzer = None

def get_divergence_analyzer(profiles_dir: str = None) -> LocalDivergenceAnalyzer:
    """Get or create singleton divergence analyzer instance."""
    global _divergence_analyzer
    if _divergence_analyzer is None:
        _divergence_analyzer = LocalDivergenceAnalyzer(profiles_dir)
    return _divergence_analyzer


def analyze_divergence_local(worldview_analyses: Dict[str, Any], 
                             comparison_analysis: Dict[str, Any]) -> Dict[str, Any]:
    """
    Convenience function to analyze divergence using local models.
    """
    analyzer = get_divergence_analyzer()
    return analyzer.analyze_divergence(worldview_analyses, comparison_analysis)
