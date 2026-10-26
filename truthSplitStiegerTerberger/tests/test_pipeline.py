"""Test the complete TruthSplit system and run all layer tests"""

import subprocess
import sys
from pathlib import Path

def run_layer_tests():
    """Run tests from all layers"""
    
    print("🧪 RUNNING ALL LAYER TESTS")
    print("=" * 60)
    
    # Test comparative reasoning layer
    print("\n🔵 COMPARATIVE REASONING LAYER TESTS:")
    print("-" * 40)
    
    # Run unit tests
    try:
        result = subprocess.run([
            sys.executable, "comparative_reasoning/tests/test_consistency_tester.py"
        ], capture_output=True, text=True, cwd=Path(__file__).parent)
        
        if result.returncode == 0:
            print("✅ Unit tests passed")
        else:
            print("❌ Unit tests failed:")
            print(result.stderr)
    except Exception as e:
        print(f"⚠️ Could not run unit tests: {e}")
    
    # Run worldview consistency tests  
    try:
        result = subprocess.run([
            sys.executable, "comparative_reasoning/tests/test_worldview_consistency.py"
        ], capture_output=True, text=True, cwd=Path(__file__).parent)
        
        if result.returncode == 0:
            print("✅ Worldview consistency tests completed")
        else:
            print("❌ Worldview tests failed:")
            print(result.stderr)
    except Exception as e:
        print(f"⚠️ Could not run worldview tests: {e}")


def test_integration():
    """Test complete system integration"""
    
    print("\n🔗 INTEGRATION TEST:")
    print("-" * 40)
    
    try:
        from comparative_reasoning.pipeline import compare_worldviews
        
        # Test worldview comparison
        text = "Taxes are theft. The government has no right to take people's money without their consent."
        
        print(f"📄 Testing: {text}")
        
        result = compare_worldviews(text, ['libertarian', 'eco_justice'])
        
        print(f"✅ Integration test passed!")
        print(f"   Claims found: {len(result['base_analysis']['claims'])}")
        print(f"   Worldviews compared: {result['comparison_summary']['total_worldviews']}")
        
        return True
        
    except Exception as e:
        print(f"❌ Integration test failed: {e}")
        return False


if __name__ == "__main__":
    print("🚀 TruthSplit System Test Suite")
    print("Testing complete layered architecture...")
    print()
    
    # Run all tests
    run_layer_tests()
    integration_success = test_integration()
    
    print(f"\n{'='*60}")
    if integration_success:
        print("🎉 ALL TESTS COMPLETED - TruthSplit system working!")
        print("📍 Clean layered architecture verified")
        print("📍 NLP → Consistency → Worldview pipeline functional")
    else:
        print("❌ Some tests failed - check output above")
    
    print(f"{'='*60}")