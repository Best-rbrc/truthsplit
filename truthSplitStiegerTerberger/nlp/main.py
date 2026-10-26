#!/usr/bin/env python3
"""Truth Split NLP CLI."""

import argparse
import os
import sys

from nlp_layer import extract, extract_and_save

def main():
    """Main function for NLP argument mining."""
    parser = argparse.ArgumentParser(description='Fresh NLP Argument Mining System')
    parser.add_argument('file', nargs='?', help='Input text file')
    parser.add_argument('--interactive', '-i', action='store_true', help='Interactive mode')
    parser.add_argument(
        '--example',
        '-e',
        choices=['ai', 'debate'],
        help='Quickly load a bundled example (ai or debate)',
    )
    parser.add_argument(
        '--save',
        '-s',
        action='store_true',
        help='Save results to JSON file in results folder'
    )
    parser.add_argument(
        '--openai',
        action='store_true',
        help='Use OpenAI API instead of local models (requires OPENAI_API_KEY env var, auto-fallback if fails)'
    )
    
    args = parser.parse_args()
    
    # Get text input
    base_dir = os.path.dirname(os.path.abspath(__file__))

    if args.example:
        example_rel = {
            'ai': os.path.join('examples', 'ai_regulation_example.txt'),
            'debate': os.path.join('examples', 'complex_ai_debate.txt'),
        }[args.example]
        example_path = os.path.join(base_dir, example_rel)

        with open(example_path, 'r', encoding='utf-8') as f:
            text = f.read().strip()
        print(f"📄 Processing example: {args.example} ({example_rel})")

    elif args.file:
        # File input
        if not os.path.exists(args.file):
            print(f"❌ File not found: {args.file}")
            return 1
        
        with open(args.file, 'r', encoding='utf-8') as f:
            text = f.read().strip()
        
        print(f"📄 Processing file: {args.file}")
        
    elif args.interactive:
        # Interactive input
        print("🎯 Fresh NLP Argument Mining System")
        print("=" * 50)
        print("\n📝 Enter your text (press Ctrl+D when finished):")
        print("-" * 40)
        
        try:
            lines = []
            while True:
                try:
                    line = input()
                    lines.append(line)
                except EOFError:
                    break
            text = "\n".join(lines).strip()
        except KeyboardInterrupt:
            print("\n👋 Goodbye!")
            return 0
            
        if not text:
            print("❌ No text provided.")
            return 1
            
    else:
        # Default example
        text = (
            "AI systems are becoming increasingly powerful and widespread in society.\n"
            "Therefore, we must implement comprehensive regulation to ensure AI safety.\n"
            "Current approaches to AI governance are insufficient for emerging risks.\n"
            "Policymakers should prioritize public safety over innovation speed.\n"
            "The rapid development of AI poses existential risks to humanity."
        )
        print("🔬 Using default example text")
    
    # Determine source file name for output
    if args.file:
        source_file = args.file
    elif args.example:
        source_file = f"example_{args.example}"
    else:
        source_file = "interactive_input"
    
    # Process the text
    if args.openai:
        print("\n🤖 Processing text with OpenAI...")
    else:
        print("\n🔍 Processing text...")
    print("-" * 40)
    
    try:
        if args.save:
            result, output_path = extract_and_save(text, source_file, use_openai=args.openai)
            print(f"💾 Results saved to: {output_path}")
        else:
            result = extract(text, use_openai=args.openai)
        
        # Display results
        print("\n🎯 RESULTS:")
        print("=" * 50)

        print(f"\n✅ Claims found: {result['summary']['total_claims']}")
        for i, claim in enumerate(result['claims'], 1):
            print(f"   {i}. {claim['text']} (confidence: {claim['confidence']:.3f})")
        
        for claim in result['claims']:
            print(f"\n--- Claim: {claim['text']}")
            print(f"    Confidence: {claim['confidence']:.3f}")
            if claim.get('premises'):
                print("    Premises:")
                for premise in claim['premises']:
                    print(f"      - {premise['text']} (confidence: {premise['confidence']:.3f})")
            else:
                print("    Premises: none linked")

            if claim.get('assumptions'):
                print("    Assumptions:")
                for assumption in claim['assumptions']:
                    print(f"      - {assumption['text']} (score: {assumption['confidence']:.3f})")
            else:
                print("    Assumptions: none linked")

        print(f"\n📋 All premises: {result['summary']['total_premises']}")
        for i, premise in enumerate(result['premises'], 1):
            print(f"   {i}. {premise['text']} (confidence: {premise['confidence']:.3f}) "
                  f"[claims: {', '.join(premise.get('claim_ids', []))}]")

        print(f"\n💭 All assumptions: {result['summary']['total_assumptions']}")
        for i, assumption in enumerate(result['assumptions'], 1):
            print(f"   {i}. {assumption['text']} (score: {assumption['confidence']:.3f}) "
                  f"[claim: {assumption.get('claim_id', 'none')}]")

        print("\n" + "=" * 50)
        print("🎉 Analysis complete!")
        
        return 0
        
    except Exception as e:
        print(f"❌ Error during processing: {e}")
        return 1

if __name__ == "__main__":
    sys.exit(main())
