"""
Base LLM Provider Interface

All LLM providers (OpenAI, Claude, Gemini, Grok) implement this interface.
Prompts are defined once in prompt_templates.py and adapted per provider.
"""

from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional
import json


class LLMProvider(ABC):
    """Abstract base class for all LLM providers"""
    
    def __init__(self, api_key: str, model_name: str):
        self.api_key = api_key
        self.model_name = model_name
    
    @abstractmethod
    def chat_completion(
        self, 
        messages: List[Dict[str, str]], 
        schema: Optional[Dict[str, Any]] = None,
        temperature: float = 0.3,
        max_tokens: int = 1000
    ) -> Dict[str, Any]:
        """
        Send a chat completion request with optional JSON schema enforcement.
        
        Args:
            messages: List of message dicts with 'role' and 'content'
            schema: Optional JSON schema for structured output
            temperature: Sampling temperature
            max_tokens: Maximum tokens in response
            
        Returns:
            Dict containing 'content' (str) and 'parsed' (dict) if schema provided
            
        Raises:
            Exception: If API call fails with clear error message
        """
        pass
    
    @abstractmethod
    def validate_response(self, response: str, schema: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Validate and parse response against schema.
        
        Args:
            response: Raw string response from LLM
            schema: Optional JSON schema to validate against
            
        Returns:
            Dict with 'content' (str) and 'parsed' (dict if schema provided)
            
        Raises:
            ValueError: If response doesn't match schema
        """
        pass
    
    def format_messages(self, messages: List[Dict[str, str]]) -> Any:
        """
        Format messages for provider-specific API format.
        Override if provider needs special message formatting.
        """
        return messages
    
    def get_model_name(self) -> str:
        """Get the model name being used"""
        return self.model_name
    
    def supports_native_schema(self) -> bool:
        """
        Return True if provider natively supports JSON schema enforcement.
        OpenAI and Grok support it, Claude and Gemini need prompt-based enforcement.
        """
        return False
    
    def schema_to_prompt_instructions(self, schema: Dict[str, Any]) -> str:
        """
        Convert JSON schema to natural language instructions for prompt.
        Used by providers that don't support native schema enforcement.
        """
        instructions = "\n\nYou must respond with valid JSON matching this exact structure:\n"
        instructions += json.dumps(schema, indent=2)
        instructions += "\n\nRequirements:"
        instructions += "\n- All required fields must be present"
        instructions += "\n- Use exact field names and types"
        instructions += "\n- Follow enum constraints where specified"
        instructions += "\n- Do not add additional fields beyond those specified"
        instructions += "\n- Ensure valid JSON syntax (proper quotes, commas, brackets)"
        
        return instructions
