"""
TruthSplit Pipeline - Clean Integration Bridge

Connects NLP layer → Consistency Testing → Worldview Analysis
Simple, unbloated code with clear responsibilities.
"""

import sys
from pathlib import Path
from typing import Dict, Any, List

# Add parent directory for imports
sys.path.append(str(Path(__file__).parent.parent))

from nlp.nlp_layer import extract
from comparative_reasoning.consistency_tester import test_consistency
from comparative_reasoning.claim_linker import link_claims_to_worldviews
from comparative_reasoning.llm_reasoning_engine import LLMComparativeReasoner
from structured_knowledge_layer.profile_loader import ProfileLoader


class TruthSplitPipeline:
    """Clean pipeline that processes text through all layers"""
    
    def __init__(self, profiles_dir: str = None):
        if profiles_dir is None:
            # Default path to profiles
            base_dir = Path(__file__).parent.parent
            profiles_dir = str(base_dir / "structured_knowledge_layer" / "profiles" / "json")
        
        self.profile_loader = ProfileLoader(profiles_dir)
        print(f"✓ Loaded {len(self.profile_loader.list_profiles())} worldview profiles")
    
    def analyze_text(self, text: str, use_openai: bool = False, llm_model: str = "gpt-4o-mini", llm_provider: str = "openai") -> Dict[str, Any]:
        """
        Complete analysis pipeline:
        1. Extract claims/premises/assumptions (NLP)
        2. Test all 3 types of consistency (NLI)
        3. Link claims to worldview definitions and principles 
        4. Ready for LLM worldview analysis
        """
        # Step 1: NLP extraction
        print("🔍 Extracting arguments...")
        nlp_results = extract(text, use_openai=use_openai, llm_model=llm_model, llm_provider=llm_provider)
        
        # Step 2: Consistency testing (all 3 types)
        print("🧠 Testing logical consistency...")
        consistent_results = test_consistency(nlp_results)
        
        # Step 2b: Add cross-worldview consistency for each claim
        print("🔄 Testing cross-worldview consistency...")
        from comparative_reasoning.consistency_tester import test_worldview_consistency
        claims = consistent_results.get('claims', [])
        for claim in claims:
            claim_text = claim.get('text', '')
            if claim_text:
                cross_consistency = test_worldview_consistency(claim_text)
                consistent_results['cross_worldview_consistency'] = cross_consistency
        
        # Step 3: Link to worldview concepts
        print("🔗 Linking claims to worldview definitions...")
        linked_results = link_claims_to_worldviews(consistent_results)
        
        # Step 4: Prepare for LLM analysis
        print("🌍 Preparing for LLM worldview analysis...")
        final_results = self._prepare_worldview_analysis(linked_results)
        
        return final_results
    
    def _prepare_worldview_analysis(self, results: Dict[str, Any]) -> Dict[str, Any]:
        """Prepare results for worldview-specific interpretation"""
        # Add available profiles to results
        results['available_worldviews'] = self.profile_loader.list_profiles()
        
        # Add profile summaries for each worldview
        results['worldview_summaries'] = {}
        for worldview_id in self.profile_loader.list_profiles():
            profile = self.profile_loader.get_profile(worldview_id)
            results['worldview_summaries'][worldview_id] = {
                'name': profile.get('display_name', worldview_id),
                'summary': self.profile_loader.get_profile_summary(worldview_id)
            }
        
        return results
    
    def compare_worldviews(self, text: str, worldview_ids: List[str] = None) -> Dict[str, Any]:
        """
        Compare how different worldviews would interpret the same text using LLM reasoning
        that leverages structured data from claim_linker and consistency_tester.
        """
        if worldview_ids is None:
            worldview_ids = self.profile_loader.list_profiles()
        
        # Cap the number of comparable positions to 3
        original_count = len(worldview_ids)
        worldview_ids = worldview_ids[:3]
        if original_count > 3:
            print(f"⚠️  Limiting comparison to first 3 worldviews: {worldview_ids}")
        elif len(worldview_ids) > 0:
            print(f"✓ Comparing {len(worldview_ids)} worldview(s): {worldview_ids}")
        
        # Get structured analysis (consistency + linked concepts)
        base_results = self.analyze_text(text)
        
        # Use LLM-enhanced reasoning with structured input
        print("🧠 Running LLM-enhanced comparative reasoning...")
        llm_reasoner = LLMComparativeReasoner()
        comparison_results = llm_reasoner.analyze_worldview_reasoning(base_results, worldview_ids)
        
        return {
            'base_analysis': base_results,
            'llm_analysis': comparison_results,
            'summary': self._create_llm_summary(comparison_results)
        }
    
    def _create_llm_summary(self, llm_results: Dict[str, Any]) -> Dict[str, Any]:
        """Create summary from LLM-enhanced analysis results"""
        divergence_analysis = llm_results.get('divergence_analysis', {})
        worldview_analyses = llm_results.get('worldview_analyses', {})
        comparison_analysis = llm_results.get('comparison_analysis', {})
        
        summary_data = comparison_analysis.get('summary', {})
        
        return {
            'total_worldviews': len(worldview_analyses),
            'total_divergences': divergence_analysis.get('total_divergences', 0),
            'disagreement_rate': summary_data.get('disagreement_rate', 0),
            'consensus_rate': 1 - summary_data.get('disagreement_rate', 0),
            'primary_divide': summary_data.get('most_common_disagreement_type', 'Unknown'),
            'fundamental_divides': divergence_analysis.get('fundamental_divides', []),
            'common_patterns': divergence_analysis.get('common_divergence_patterns', []),
            'worldviews_analyzed': list(worldview_analyses.keys()),
            'analysis_method': 'LLM-enhanced with structured input'
        }


def quick_analyze(text: str, use_openai: bool = False, llm_model: str = "gpt-4o-mini", llm_provider: str = "openai") -> Dict[str, Any]:
    """Quick function for simple analysis"""
    pipeline = TruthSplitPipeline()
    return pipeline.analyze_text(text, use_openai=use_openai, llm_model=llm_model, llm_provider=llm_provider)


def compare_worldviews(text: str, worldviews: List[str] = None) -> Dict[str, Any]:
    """Quick function for worldview comparison"""
    pipeline = TruthSplitPipeline()
    return pipeline.compare_worldviews(text, worldviews)


if __name__ == "__main__":
    # Simple test
    test_text = "Governments should establish comprehensive AI regulation frameworks to ensure responsible development."
    
    print("🚀 Testing TruthSplit Pipeline...")
    result = quick_analyze(test_text)
    
    print(f"\n✅ Analysis complete!")
    print(f"Claims found: {result['summary']['total_claims']}")
    print(f"Average consistency: {result['summary']['average_consistency']:.3f}")
    print(f"Available worldviews: {len(result['available_worldviews'])}")