"""
Claim-to-Worldview Linker

Links extracted claims to worldview definitions and principles,
preparing them for TruthSplit's comparative reasoning.

This bridges raw NLP extraction with worldview-specific interpretation.
"""

from typing import Dict, List, Any
import re
import sys
from pathlib import Path

# Add parent for imports
sys.path.append(str(Path(__file__).parent.parent))


class ClaimLinker:
    """Links claims to relevant worldview concepts and definitions"""
    
    def __init__(self, profile_loader=None):
        if profile_loader is None:
            from structured_knowledge_layer.profile_loader import ProfileLoader
            base_dir = Path(__file__).parent.parent
            profiles_dir = str(base_dir / "structured_knowledge_layer" / "profiles" / "json")
            profile_loader = ProfileLoader(profiles_dir)
        
        self.profile_loader = profile_loader
        
        # Cache worldview concepts for faster linking
        self._concept_cache = {}
        self._build_concept_cache()
    
    def _build_concept_cache(self):
        """Build a cache of key concepts from all worldviews for fast lookup"""
        for worldview_id in self.profile_loader.list_profiles():
            profile = self.profile_loader.get_profile(worldview_id)
            if profile:
                concepts = {}
                
                # Extract key definitions
                definitions = profile.get('key_definitions', [])
                for defn in definitions:
                    term = defn.get('term', '').lower()
                    definition = defn.get('definition', '')
                    concepts[term] = {
                        'type': 'definition',
                        'content': definition,
                        'term': defn.get('term', term)
                    }
                
                # Extract core values
                values = profile.get('core_values', [])
                for value in values:
                    name = value.get('name', '').lower()
                    desc = value.get('desc', '')
                    concepts[name] = {
                        'type': 'core_value',
                        'content': desc,
                        'weight': value.get('weight', 0),
                        'name': value.get('name', name)
                    }
                
                # Extract principles
                principles = profile.get('assumed_principles', [])
                for principle in principles:
                    name = principle.get('name', '').lower()
                    desc = principle.get('desc', '')
                    concepts[name] = {
                        'type': 'principle',
                        'content': desc,
                        'priority': principle.get('priority', 0),
                        'name': principle.get('name', name)
                    }
                
                self._concept_cache[worldview_id] = concepts
    
    def find_relevant_concepts(self, claim_text: str, worldview_id: str, threshold: float = 0.3) -> List[Dict[str, Any]]:
        """
        Find worldview concepts relevant to a claim using keyword matching and semantic similarity.
        Returns list of relevant concepts with their relevance scores.
        """
        if worldview_id not in self._concept_cache:
            return []
        
        claim_lower = claim_text.lower()
        concepts = self._concept_cache[worldview_id]
        relevant_concepts = []
        
        for concept_key, concept_data in concepts.items():
            relevance_score = self._calculate_relevance(claim_lower, concept_key, concept_data)
            
            if relevance_score >= threshold:
                relevant_concepts.append({
                    'concept': concept_data,
                    'relevance_score': relevance_score,
                    'worldview_id': worldview_id
                })
        
        # Sort by relevance score (highest first)
        relevant_concepts.sort(key=lambda x: x['relevance_score'], reverse=True)
        
        return relevant_concepts
    
    def _calculate_relevance(self, claim_text: str, concept_key: str, concept_data: Dict[str, Any]) -> float:
        """Calculate how relevant a concept is to a claim (0-1 score)"""
        relevance = 0.0
        
        # Direct keyword match in claim
        if concept_key in claim_text:
            relevance += 0.8
        
        # Check for related terms based on concept type
        concept_content = concept_data.get('content', '').lower()
        
        # Look for related terms in the concept definition
        if concept_data.get('type') == 'definition':
            # For definitions, check if the term or its definition relates to claim
            term = concept_data.get('term', '').lower()
            if any(word in claim_text for word in term.split()):
                relevance += 0.6
            if any(word in claim_text for word in concept_content.split()[:5]):  # First 5 words of definition
                relevance += 0.4
        
        elif concept_data.get('type') == 'core_value':
            # For values, check thematic overlap
            value_keywords = concept_key.replace('_', ' ').split()
            if any(keyword in claim_text for keyword in value_keywords):
                relevance += 0.5
        
        elif concept_data.get('type') == 'principle':
            # For principles, check for principle-related keywords
            principle_keywords = concept_key.replace('_', ' ').split()
            if any(keyword in claim_text for keyword in principle_keywords):
                relevance += 0.5
        
        # Boost relevance for high-weight/priority concepts
        if 'weight' in concept_data and concept_data['weight'] > 0.8:
            relevance += 0.1
        if 'priority' in concept_data and concept_data['priority'] > 0.8:
            relevance += 0.1
        
        return min(relevance, 1.0)  # Cap at 1.0
    
    def link_claims_to_worldviews(self, nlp_results: Dict[str, Any], worldview_ids: List[str] = None) -> Dict[str, Any]:
        """
        Link all claims in NLP results to relevant worldview concepts.
        Returns enhanced results with worldview linkages.
        """
        if worldview_ids is None:
            worldview_ids = self.profile_loader.list_profiles()
        
        claims = nlp_results.get('claims', [])
        
        for claim in claims:
            claim_text = claim.get('text', '')
            if not claim_text:
                continue
            
            # Link to each worldview
            claim['worldview_links'] = {}
            
            for worldview_id in worldview_ids:
                relevant_concepts = self.find_relevant_concepts(claim_text, worldview_id)
                
                # Get worldview profile for context
                profile = self.profile_loader.get_profile(worldview_id)
                worldview_name = profile.get('display_name', worldview_id) if profile else worldview_id
                
                claim['worldview_links'][worldview_id] = {
                    'worldview_name': worldview_name,
                    'relevant_concepts': relevant_concepts[:5],  # Top 5 most relevant
                    'total_concepts_found': len(relevant_concepts),
                    'strongest_relevance': relevant_concepts[0]['relevance_score'] if relevant_concepts else 0.0
                }
        
        # Add linking summary to results
        if 'summary' not in nlp_results:
            nlp_results['summary'] = {}
        
        nlp_results['summary']['worldview_linking_completed'] = True
        nlp_results['summary']['worldviews_linked'] = len(worldview_ids)
        
        # Calculate average linking strength
        all_relevances = []
        for claim in claims:
            for wv_id, wv_data in claim.get('worldview_links', {}).items():
                all_relevances.append(wv_data.get('strongest_relevance', 0))
        
        if all_relevances:
            nlp_results['summary']['average_linking_strength'] = sum(all_relevances) / len(all_relevances)
        
        return nlp_results
    
    def get_worldview_interpretation(self, claim_text: str, worldview_id: str) -> Dict[str, Any]:
        """
        Get a detailed worldview-specific interpretation of a claim.
        Shows how the worldview would understand/frame the claim.
        """
        profile = self.profile_loader.get_profile(worldview_id)
        if not profile:
            return {}
        
        relevant_concepts = self.find_relevant_concepts(claim_text, worldview_id)
        
        # Build interpretation based on linked concepts
        interpretation = {
            'original_claim': claim_text,
            'worldview': profile.get('display_name', worldview_id),
            'relevant_concepts': relevant_concepts,
            'reframed_claim': self._reframe_claim(claim_text, relevant_concepts, profile),
            'potential_conflicts': self._identify_conflicts(claim_text, relevant_concepts),
            'supporting_elements': self._identify_support(claim_text, relevant_concepts)
        }
        
        return interpretation
    
    def _reframe_claim(self, claim_text: str, concepts: List[Dict[str, Any]], profile: Dict[str, Any]) -> str:
        """Reframe claim from worldview perspective"""
        if not concepts:
            return f"From {profile.get('display_name', 'this')} perspective: {claim_text}"
        
        # Use the most relevant concept to reframe
        top_concept = concepts[0]['concept']
        worldview_name = profile.get('display_name', 'this worldview')
        
        if top_concept.get('type') == 'definition':
            return f"From {worldview_name} perspective (defining {top_concept.get('term', 'key terms')}): {claim_text}"
        elif top_concept.get('type') == 'core_value':
            return f"From {worldview_name} perspective (valuing {top_concept.get('name', 'this principle')}): {claim_text}"
        else:
            return f"From {worldview_name} perspective: {claim_text}"
    
    def _identify_conflicts(self, claim_text: str, concepts: List[Dict[str, Any]]) -> List[str]:
        """Identify potential conflicts between claim and worldview"""
        conflicts = []
        
        # Look for high-relevance concepts that might conflict
        for concept_data in concepts[:3]:  # Top 3 concepts
            concept = concept_data['concept']
            if concept_data['relevance_score'] > 0.6:
                if concept.get('type') == 'definition':
                    conflicts.append(f"Conflicts with definition of {concept.get('term', 'key term')}")
                elif concept.get('type') == 'core_value':
                    conflicts.append(f"May conflict with core value: {concept.get('name', 'this value')}")
        
        return conflicts
    
    def _identify_support(self, claim_text: str, concepts: List[Dict[str, Any]]) -> List[str]:
        """Identify elements that support the claim within worldview"""
        supports = []
        
        for concept_data in concepts[:3]:
            concept = concept_data['concept']
            if concept_data['relevance_score'] > 0.5:
                if concept.get('type') == 'principle':
                    supports.append(f"Supported by principle: {concept.get('name', 'this principle')}")
                elif concept.get('type') == 'core_value':
                    supports.append(f"Aligns with value: {concept.get('name', 'this value')}")
        
        return supports


def link_claims_to_worldviews(nlp_results: Dict[str, Any], worldview_ids: List[str] = None) -> Dict[str, Any]:
    """
    Simple function to link NLP results to worldview concepts.
    Usage: link_claims_to_worldviews(your_nlp_output)
    """
    linker = ClaimLinker()
    return linker.link_claims_to_worldviews(nlp_results, worldview_ids)


if __name__ == "__main__":
    print("🔗 Testing Claim-to-Worldview Linker...")
    
    # Test linking
    linker = ClaimLinker()
    
    # Test 1: Simple claim linking
    test_claim = "Taxation is theft"
    print(f"\nTesting claim: {test_claim}")
    
    interpretation = linker.get_worldview_interpretation(test_claim, 'libertarian')
    
    print(f"Libertarian interpretation:")
    print(f"  Reframed: {interpretation.get('reframed_claim', 'N/A')}")
    print(f"  Conflicts: {interpretation.get('potential_conflicts', [])}")
    print(f"  Support: {interpretation.get('supporting_elements', [])}")
    print(f"  Relevant concepts: {len(interpretation.get('relevant_concepts', []))}")
    
    # Test 2: Full NLP results linking
    test_nlp_results = {
        "claims": [
            {"text": "Government should minimize its role in the economy"},
            {"text": "Environmental protection requires collective action"}
        ],
        "summary": {"total_claims": 2}
    }
    
    print(f"\nTesting full NLP results linking...")
    linked_results = linker.link_claims_to_worldviews(test_nlp_results, ['libertarian', 'eco_justice'])
    
    for i, claim in enumerate(linked_results['claims']):
        print(f"\n  Claim {i+1}: {claim['text'][:50]}...")
        for wv_id, wv_data in claim.get('worldview_links', {}).items():
            relevance = wv_data.get('strongest_relevance', 0)
            concepts_found = wv_data.get('total_concepts_found', 0)
            print(f"    {wv_data['worldview_name']}: {concepts_found} concepts (max relevance: {relevance:.3f})")
    
    summary = linked_results['summary']
    print(f"\nSummary:")
    print(f"  Worldviews linked: {summary.get('worldviews_linked', 0)}")
    print(f"  Average linking strength: {summary.get('average_linking_strength', 0):.3f}")
    
    print(f"\nClaim linking complete!")