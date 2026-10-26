"""Test claim linking with proper argumentative text"""

import sys
from pathlib import Path

# Add parent directory for imports
sys.path.append(str(Path(__file__).parent.parent))

from comparative_reasoning.pipeline import TruthSplitPipeline

def test_with_proper_arguments():
    """Test with text that contains proper argumentative structure"""
    
    pipeline = TruthSplitPipeline()
    
    # Use text with clear argumentative structure that NLP will detect
    test_text = """
    The government should establish comprehensive taxation policies to fund essential public services. 
    This is necessary because public goods like healthcare, education, and infrastructure require 
    collective funding that private markets cannot efficiently provide. Studies show that societies 
    with strong public institutions have better outcomes for citizens. Therefore, taxation is not 
    theft but rather a social contract that enables collective prosperity.
    """
    
    print("🔗 Testing Claim Linking with Proper Argumentative Text")
    print("=" * 70)
    print(f"📄 Text: {test_text.strip()}")
    print("-" * 70)
    
    # Analyze with full pipeline
    result = pipeline.analyze_text(test_text)
    
    print(f"\n🎯 ANALYSIS RESULTS:")
    print(f"Claims found: {len(result.get('claims', []))}")
    
    # Show detailed linking for each claim
    claims = result.get('claims', [])
    for i, claim_data in enumerate(claims, 1):
        claim_text = claim_data.get('text', '')
        print(f"\n📋 CLAIM {i}: {claim_text}")
        
        # Show consistency score
        consistency = claim_data.get('overall_consistency', 0)
        print(f"   🧠 Logical consistency: {consistency:.3f}")
        
        # Show worldview links
        worldview_links = claim_data.get('worldview_links', {})
        if worldview_links:
            print(f"   🔗 Worldview Links:")
            for wv_id, wv_data in worldview_links.items():
                name = wv_data.get('worldview_name', wv_id)
                concepts = wv_data.get('total_concepts_found', 0)
                relevance = wv_data.get('strongest_relevance', 0)
                
                # Color code relevance
                if relevance > 0.6:
                    icon = "🔴"  # Strong
                elif relevance > 0.3:
                    icon = "🟡"  # Moderate  
                else:
                    icon = "⚪"  # Weak
                
                print(f"     {icon} {name:25} {concepts} concepts (max: {relevance:.3f})")
                
                # Show top concepts
                relevant_concepts = wv_data.get('relevant_concepts', [])
                for concept in relevant_concepts[:2]:
                    concept_info = concept['concept']
                    concept_name = concept_info.get('name', concept_info.get('term', 'Unknown'))
                    concept_type = concept_info.get('type', 'unknown')
                    score = concept['relevance_score']
                    print(f"        └─ {concept_name} ({concept_type}) [{score:.3f}]")
        else:
            print(f"   ❌ No worldview links found")
    
    # Show summary
    summary = result.get('summary', {})
    print(f"\n📊 PIPELINE SUMMARY:")
    print(f"   Claims extracted: {summary.get('total_claims', 0)}")
    print(f"   Premises found: {summary.get('total_premises', 0)}")
    print(f"   Assumptions found: {summary.get('total_assumptions', 0)}")
    print(f"   Average consistency: {summary.get('average_consistency', 0):.3f}")
    
    if summary.get('worldview_linking_completed'):
        linking_strength = summary.get('average_linking_strength', 0)
        worldviews_linked = summary.get('worldviews_linked', 0)
        print(f"   Worldview linking: ✅ Complete ({worldviews_linked} worldviews)")
        print(f"   Average linking strength: {linking_strength:.3f}")
        
        if linking_strength > 0.5:
            print(f"   🎯 Strong worldview connections - ready for comparative analysis!")
        elif linking_strength > 0.3:
            print(f"   ⚠️  Moderate connections - some worldview relevance detected")
        else:
            print(f"   ❌ Weak connections - claims may not strongly engage worldview frameworks")
    
    print(f"\n✅ This demonstrates the complete NLP → Consistency → Linking → Analysis pipeline!")
    return result


if __name__ == "__main__":
    test_with_proper_arguments()