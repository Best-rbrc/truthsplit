"""LLM integration for NLP analysis - returns same format as local models."""

import json
import os
import sys
from pathlib import Path
from typing import Dict, Any, List
from dotenv import load_dotenv

# Add parent directory for llm imports
sys.path.insert(0, str(Path(__file__).parent.parent.parent))
from llm.provider_factory import create_provider
from llm.prompt_templates import PromptTemplates

# Load environment variables from .env file
load_dotenv()

class LLMExtractor:
    """Extract claims, premises, and assumptions using a configurable LLM provider."""
    
    def __init__(self, api_key: str = None, model: str = "gpt-4o", provider: str = "openai"):
        """Initialize LLM provider for extraction."""
        try:
            self.provider = create_provider(provider, model, api_key)
            self.provider_name = provider
            print(f"✓ NLP Extractor initialized: {provider} ({self.provider.get_model_name()})")
        except Exception as e:
            raise ValueError(f"Failed to initialize LLM provider '{provider}': {str(e)}")
    
    def extract(self, text: str) -> Dict[str, Any]:
        """Extract claims, premises, and assumptions using LLM provider."""
        
        messages = [
            {"role": "system", "content": PromptTemplates.claim_extraction_system_prompt()},
            {"role": "user", "content": PromptTemplates.claim_extraction_user_prompt(text)}
        ]
        
        schema = PromptTemplates.claim_extraction_schema()
        
        try:
            response = self.provider.chat_completion(
                messages=messages,
                schema=schema,
                temperature=0.1,
                max_tokens=4000
            )
            result = response.get('parsed')
            return self._format_result(result)
        except Exception as e:
            print(f"❌ LLM extraction failed: {e}")
            return self._empty_result()
    
    def _format_result(self, result: Dict[str, Any]) -> Dict[str, Any]:
        """Format LLM result to match local model format."""
        claims = result.get("claims", [])
        premises = result.get("premises", [])
        assumptions = result.get("assumptions", [])
        
        for claim in claims:
            claim_id = claim["id"]
            claim["premises"] = [p for p in premises if claim_id in p.get("claim_ids", [])]
            claim["assumptions"] = [a for a in assumptions if a.get("claim_id") == claim_id]
        
        return {
            "claims": claims,
            "premises": premises,
            "assumptions": assumptions,
            "summary": result.get("summary", {
                "total_claims": len(claims),
                "total_premises": len(premises), 
                "total_assumptions": len(assumptions)
            })
        }
    
    def _empty_result(self) -> Dict[str, Any]:
        """Return empty result on error."""
        return {
            "claims": [],
            "premises": [],
            "assumptions": [],
            "summary": {"total_claims": 0, "total_premises": 0, "total_assumptions": 0}
        }


def create_llm_extractor(provider: str = "openai", model: str = None):
    """Create LLM extractor if API key is available."""
    try:
        return LLMExtractor(provider=provider, model=model)
    except ValueError:
        return None

# Legacy alias for backward compatibility
openai_extractor = None  # Lazy initialization
