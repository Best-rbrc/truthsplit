"""
NLI Consistency Tester

Tests logical consistency of claims:
1. Basic premise-claim logic (does premise support claim?)
2. Within worldview consistency (does claim fit worldview's principles?)
3. Across worldview consistency (how do different worldviews judge the same claim?)
"""

from typing import List, Dict, Any
from transformers import pipeline
import sys
from pathlib import Path

# Add parent for imports
sys.path.append(str(Path(__file__).parent.parent))


class ConsistencyTester:
    """Test logical consistency between claims and premises using NLI"""
    
    def __init__(self, profile_loader=None):
        # Use a pre-trained NLI model for consistency testing
        self.nli_pipeline = pipeline(
            "zero-shot-classification", 
            model="facebook/bart-large-mnli",
            device=-1  # CPU only for simplicity
        )
        
        # Load worldview profiles for consistency testing
        if profile_loader is None:
            from structured_knowledge_layer.profile_loader import ProfileLoader
            base_dir = Path(__file__).parent.parent
            profiles_dir = str(base_dir / "structured_knowledge_layer" / "profiles" / "json")
            profile_loader = ProfileLoader(profiles_dir)
        
        self.profile_loader = profile_loader
    
    def test_premise_supports_claim(self, premise: str, claim: str) -> float:
        """
        Test if a premise supports a claim using NLI.
        Returns confidence score (0-1) where 1 = strong support
        """
        try:
            # Use NLI to test if premise entails/supports the claim
            result = self.nli_pipeline(
                premise, 
                [claim, f"NOT {claim}"],
                hypothesis_template="This supports the claim: {}"
            )
            
            # Find the score for supporting the claim (not negating it)
            support_score = None
            for label, score in zip(result['labels'], result['scores']):
                if not label.startswith("NOT"):
                    support_score = score
                    break
            
            return support_score if support_score is not None else 0.0
            
        except Exception as e:
            print(f"NLI error: {e}")
            return 0.5  # Default neutral score on error
    
    def test_claim_consistency(self, claim_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Test consistency for a single claim and its premises.
        Returns updated claim data with consistency scores.
        """
        claim_text = claim_data.get('text', '')
        premises = claim_data.get('premises', [])
        
        # Test each premise against the claim
        for premise in premises:
            premise_text = premise.get('text', '')
            if premise_text and claim_text:
                consistency_score = self.test_premise_supports_claim(premise_text, claim_text)
                premise['consistency_score'] = consistency_score
        
        # Calculate overall consistency (average of premise scores)
        if premises:
            consistency_scores = [p.get('consistency_score', 0.5) for p in premises]
            claim_data['overall_consistency'] = sum(consistency_scores) / len(consistency_scores)
        else:
            claim_data['overall_consistency'] = 0.5  # No premises to test
        
        return claim_data
    
    def test_full_analysis(self, nlp_results: Dict[str, Any]) -> Dict[str, Any]:
        """
        Test consistency for complete NLP analysis results.
        Returns updated results with consistency scores.
        """
        claims = nlp_results.get('claims', [])
        
        for claim in claims:
            claim = self.test_claim_consistency(claim)
        
        # Update summary with consistency info
        if 'summary' not in nlp_results:
            nlp_results['summary'] = {}
        
        consistency_scores = [c.get('overall_consistency', 0.5) for c in claims]
        if consistency_scores:
            nlp_results['summary']['average_consistency'] = sum(consistency_scores) / len(consistency_scores)
            nlp_results['summary']['consistency_tested'] = True
        
        return nlp_results
    
    def test_worldview_internal_consistency(self, claim_text: str, worldview_profile: Dict[str, Any]) -> float:
        """
        Test if a claim is consistent with a worldview's own principles and definitions.
        Returns consistency score (0-1) where 1 = highly consistent with worldview
        """
        try:
            worldview_name = worldview_profile.get('display_name', 'Unknown')
            
            # Get worldview's core principles
            core_values = worldview_profile.get('core_values', [])
            key_definitions = worldview_profile.get('key_definitions', [])
            assumed_principles = worldview_profile.get('assumed_principles', [])
            
            # Create worldview context for testing
            worldview_context = f"From a {worldview_name} perspective, considering values like "
            top_values = [v.get('name', '') for v in core_values[:3]]
            worldview_context += ', '.join(top_values)
            
            # Test claim against worldview principles
            principle_texts = []
            for principle in assumed_principles[:3]:
                if principle.get('desc'):
                    principle_texts.append(principle['desc'])
            
            if not principle_texts:
                return 0.5  # Neutral if no principles to test against
            
            # Use NLI to test if claim aligns with worldview principles
            consistency_scores = []
            for principle in principle_texts:
                # Test if worldview principle supports the claim
                result = self.nli_pipeline(
                    f"{worldview_context}. {principle}",
                    [claim_text, f"NOT {claim_text}"],
                    hypothesis_template="This worldview would support: {}"
                )
                
                # Get score for supporting the claim
                support_score = None
                for label, score in zip(result['labels'], result['scores']):
                    if not label.startswith("NOT"):
                        support_score = score
                        break
                
                if support_score is not None:
                    consistency_scores.append(support_score)
            
            # Return average consistency across principles
            return sum(consistency_scores) / len(consistency_scores) if consistency_scores else 0.5
            
        except Exception as e:
            print(f" Worldview consistency error: {e}")
            return 0.5
    
    def test_cross_worldview_consistency(self, claim_text: str, worldview_ids: List[str] = None) -> Dict[str, Any]:
        """
        Compare how different worldviews judge the same claim's consistency.
        Returns consistency scores across worldviews + analysis of disagreement.
        """
        if worldview_ids is None:
            worldview_ids = self.profile_loader.list_profiles()
        
        worldview_consistencies = {}
        consistency_scores = []
        
        for worldview_id in worldview_ids:
            profile = self.profile_loader.get_profile(worldview_id)
            if profile:
                consistency = self.test_worldview_internal_consistency(claim_text, profile)
                worldview_name = profile.get('display_name', worldview_id)
                
                worldview_consistencies[worldview_id] = {
                    'name': worldview_name,
                    'consistency_score': consistency,
                    'interpretation': self._get_consistency_interpretation(consistency)
                }
                consistency_scores.append(consistency)
        
        # Calculate cross-worldview analysis
        if consistency_scores:
            avg_consistency = sum(consistency_scores) / len(consistency_scores)
            consistency_variance = self._calculate_variance(consistency_scores)
            agreement_level = self._get_agreement_level(consistency_variance)
        else:
            avg_consistency = 0.5
            consistency_variance = 0.0
            agreement_level = "unknown"
        
        return {
            'claim': claim_text,
            'worldview_consistencies': worldview_consistencies,
            'cross_worldview_analysis': {
                'average_consistency': avg_consistency,
                'consistency_variance': consistency_variance,
                'agreement_level': agreement_level,
                'total_worldviews': len(worldview_consistencies)
            }
        }
    
    def _get_consistency_interpretation(self, score: float) -> str:
        """Convert consistency score to interpretation"""
        if score >= 0.7:
            return "highly consistent"
        elif score >= 0.5:
            return "somewhat consistent" 
        elif score >= 0.3:
            return "somewhat inconsistent"
        else:
            return "highly inconsistent"
    
    def _calculate_variance(self, scores: List[float]) -> float:
        """Calculate variance in consistency scores"""
        if len(scores) <= 1:
            return 0.0
        
        mean = sum(scores) / len(scores)
        variance = sum((x - mean) ** 2 for x in scores) / len(scores)
        return variance
    
    def _get_agreement_level(self, variance: float) -> str:
        """Convert variance to agreement level description"""
        if variance <= 0.05:
            return "strong agreement"
        elif variance <= 0.15:
            return "moderate agreement"
        elif variance <= 0.25:
            return "moderate disagreement"
        else:
            return "strong disagreement"


def test_consistency(nlp_results: Dict[str, Any]) -> Dict[str, Any]:
    """
    Simple function to test NLP results for logical consistency.
    Usage: test_consistency(your_nlp_json_output)
    """
    tester = ConsistencyTester()
    return tester.test_full_analysis(nlp_results)


def test_worldview_consistency(claim_text: str, worldview_ids: List[str] = None) -> Dict[str, Any]:
    """
    Test how different worldviews judge a claim's consistency.
    Usage: test_worldview_consistency("Taxation is theft")
    """
    tester = ConsistencyTester()
    return tester.test_cross_worldview_consistency(claim_text, worldview_ids)


if __name__ == "__main__":
    print("🧠 Testing Enhanced Consistency Tester...")
    
    # Test 1: Basic premise-claim consistency
    print("\n1️⃣ Testing basic premise-claim logic:")
    test_data = {
        "claims": [{
            "text": "We should regulate AI technology",
            "premises": [
                {"text": "AI poses risks to society"},
                {"text": "Regulation can prevent harm"}
            ]
        }]
    }
    
    result = test_consistency(test_data)
    print(f"Basic consistency: {result['summary']['average_consistency']:.3f}")
    
    # Test 2: Cross-worldview consistency testing
    print("\n Testing cross-worldview consistency:")
    claim = "Taxation is theft"
    worldview_result = test_worldview_consistency(claim, ['libertarian', 'eco_justice'])
    
    print(f" Claim: {claim}")
    for wv_id, wv_data in worldview_result['worldview_consistencies'].items():
        score = wv_data['consistency_score']
        interpretation = wv_data['interpretation']
        print(f"  🌍 {wv_data['name']}: {score:.3f} ({interpretation})")
    
    analysis = worldview_result['cross_worldview_analysis']
    print(f"\nCross-worldview analysis:")
    print(f"  Average consistency: {analysis['average_consistency']:.3f}")
    print(f"  Agreement level: {analysis['agreement_level']}")
    print(f"  Variance: {analysis['consistency_variance']:.3f}")
    
    print(f"\nEnhanced consistency testing complete!")