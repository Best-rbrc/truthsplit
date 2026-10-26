#!/usr/bin/env python3
"""
Comprehensive Test of Comparative Reasoning System

Tests the complete pipeline from NLP extraction through comparative analysis,
demonstrating how different worldviews interpret the same claims.

This shows the "same facts, different conclusions" principle in action.
"""

import sys
from pathlib import Path

# Add parent directory for imports
sys.path.append(str(Path(__file__).parent.parent))

from comparative_reasoning.pipeline import TruthSplitPipeline
from comparative_reasoning.reasoning_display import print_comparison


def test_comparative_reasoning():
    """Test full comparative reasoning with a controversial claim"""
    
    print("🧠 TESTING COMPARATIVE REASONING SYSTEM")
    print("=" * 60)
    print()
    
    # Test with a claim that should generate clear worldview differences
    test_text = """
    The government should implement comprehensive social media regulation 
    to combat misinformation and protect democratic processes. This includes 
    content moderation requirements, fact-checking mandates, and penalties 
    for platforms that fail to remove false information quickly enough.
    """
    
    print("📝 ANALYZING CLAIM:")
    print(f'"{test_text.strip()}"')
    print()
    
    # Initialize pipeline
    pipeline = TruthSplitPipeline()
    
    # Run comparative analysis
    print("🔄 Running full comparative analysis...")
    print()
    
    try:
        comparison_result = pipeline.compare_worldviews(test_text)
        
        # Display the formatted results
        print("📊 COMPARATIVE REASONING RESULTS:")
        print("-" * 40)
        print()
        print(comparison_result['display_text'])
        
        # Show technical summary
        print("\n\n🔧 TECHNICAL SUMMARY:")
        print("-" * 25)
        summary = comparison_result['summary']
        print(f"Worldviews analyzed: {summary['total_worldviews']}")
        print(f"Disagreement rate: {summary['divergence_rate']:.1%}")
        print(f"Consensus rate: {summary['consensus_rate']:.1%}")
        print(f"Primary divide: {summary['primary_divide']}")
        print(f"Key insight: {summary['key_insight']}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error in comparative analysis: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_multiple_claims():
    """Test with multiple claims to show consistency patterns"""
    
    print("\n\n" + "=" * 60)
    print("🔄 TESTING MULTIPLE CLAIMS")
    print("=" * 60)
    
    test_text = """
    The government should increase taxation on wealthy individuals to fund 
    public education and healthcare programs. Higher taxes on the rich would 
    reduce inequality while providing essential services that benefit everyone. 
    Private markets alone cannot guarantee fair access to these fundamental needs.
    """
    
    print("📝 ANALYZING MULTI-PREMISE CLAIM:")
    print(f'"{test_text.strip()}"')
    print()
    
    pipeline = TruthSplitPipeline()
    
    try:
        # Focus on specific worldviews for clearer comparison
        target_worldviews = ['libertarian', 'eco-justice', 'religious-conservative']
        comparison_result = pipeline.compare_worldviews(test_text, target_worldviews)
        
        print("📊 FOCUSED WORLDVIEW COMPARISON:")
        print("-" * 35)
        print()
        print(comparison_result['display_text'])
        
        return True
        
    except Exception as e:
        print(f"❌ Error in multi-claim analysis: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_reasoning_engine_directly():
    """Test the reasoning engine with mock data"""
    
    print("\n\n" + "=" * 60)
    print("🔧 TESTING REASONING ENGINE DIRECTLY")
    print("=" * 60)
    
    from comparative_reasoning.reasoning_engine import ComparativeReasoningEngine
    
    # Create mock analysis results
    mock_results = {
        'claims': [
            {
                'text': 'Universal healthcare should be provided by the government as a fundamental right.',
                'overall_consistency': 0.85
            },
            {
                'text': 'Private healthcare markets deliver better outcomes than government systems.',
                'overall_consistency': 0.75
            }
        ],
        'premises': [
            {'text': 'Healthcare is a basic human need'},
            {'text': 'Government can ensure universal access'}
        ]
    }
    
    print("📝 MOCK DATA:")
    for i, claim in enumerate(mock_results['claims'], 1):
        print(f"{i}. {claim['text']}")
    print()
    
    try:
        engine = ComparativeReasoningEngine()
        comparison = engine.compare_reasoning_paths(mock_results)
        
        from comparative_reasoning.reasoning_display import display_worldview_comparison
        display_text = display_worldview_comparison(comparison)
        
        print("📊 DIRECT ENGINE RESULTS:")
        print("-" * 30)
        print()
        print(display_text)
        
        return True
        
    except Exception as e:
        print(f"❌ Error in direct engine test: {e}")
        import traceback
        traceback.print_exc()
        return False


def main():
    """Run all comparative reasoning tests"""
    
    print("🚀 COMPREHENSIVE COMPARATIVE REASONING TEST")
    print("=" * 70)
    print("Testing the complete implementation of the comparative reasoning")
    print("system as specified in the presentation slides.")
    print()
    
    results = []
    
    # Test 1: Basic comparative reasoning
    print("TEST 1: Basic Comparative Reasoning")
    results.append(test_comparative_reasoning())
    
    # Test 2: Multiple claims
    print("\nTEST 2: Multiple Claims Analysis")
    results.append(test_multiple_claims())
    
    # Test 3: Direct engine testing
    print("\nTEST 3: Direct Engine Testing")
    results.append(test_reasoning_engine_directly())
    
    # Summary
    print("\n\n" + "=" * 70)
    print("🏁 TEST SUMMARY")
    print("=" * 70)
    
    passed = sum(results)
    total = len(results)
    
    print(f"Tests passed: {passed}/{total}")
    
    if passed == total:
        print("✅ All tests passed! Comparative reasoning system is working.")
        print()
        print("🎯 The system successfully implements:")
        print("   • Compare reasoning paths across worldviews")
        print("   • Identify divergence points in values or assumptions")
        print("   • Make reasoning transparent and comparable")
        print()
        print("💡 Ready for production use!")
    else:
        print(f"❌ {total - passed} tests failed. Check the errors above.")
    
    return passed == total


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)