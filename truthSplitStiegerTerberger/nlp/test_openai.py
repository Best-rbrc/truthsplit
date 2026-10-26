#!/usr/bin/env python3
"""
OpenAI Integration Test and Usage Example
"""

import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Example usage
print("🤖 OpenAI Integration for NLP Analysis")
print("=" * 50)

print("\n📝 Usage:")
print("1. Set your OpenAI API key:")
print("   export OPENAI_API_KEY='your-key-here'")
print("\n2. Run with OpenAI:")
print("   python main.py --openai --example ai")
print("   python main.py --openai --save --example ai")
print("   python main.py --openai your_file.txt")

print("\n🔧 Environment check:")
api_key = os.getenv("OPENAI_API_KEY")
if api_key:
    print(f"✅ OpenAI API key configured (starts with: {api_key[:10]}...)")
else:
    print("❌ OpenAI API key not set")
    print("   Set it with: export OPENAI_API_KEY='your-key-here'")

print("\n📚 Features:")
print("- Same output format as local models")
print("- Automatic fallback to local models if OpenAI fails")
print("- Uses gpt-4o-mini for cost efficiency")
print("- Structured JSON prompt for consistent results")

# Test if OpenAI integration works
if api_key:
    print("\n🧪 Testing OpenAI integration...")
    try:
        from nlp_layer import extract
        
        test_text = "AI regulation is necessary. Current systems lack oversight."
        result = extract(test_text, use_openai=True)
        
        print(f"✅ OpenAI test successful!")
        print(f"   Found: {result['summary']['total_claims']} claims, "
              f"{result['summary']['total_premises']} premises, "
              f"{result['summary']['total_assumptions']} assumptions")
        
    except Exception as e:
        print(f"❌ OpenAI test failed: {e}")
else:
    print("\n⚠️  Skipping test - no API key configured")