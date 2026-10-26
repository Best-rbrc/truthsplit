"""
OpenRouter Provider

This provider uses OpenRouter's unified API to access multiple LLM providers:
- Claude (Anthropic): anthropic/claude-*
- GPT (OpenAI): openai/gpt-*
- Gemini (Google): google/gemini-*
- Llama (Meta): meta-llama/llama-*
- Mistral: mistralai/mistral-*
- And many more...

OpenRouter automatically routes requests to the appropriate provider based on the model ID prefix.
See: https://openrouter.ai/docs for available models and pricing.
"""

import json
from typing import Optional, Any, List, Dict
from openai import OpenAI
from .base_provider import LLMProvider


class OpenRouterProvider(LLMProvider):
    """
    LLM provider using OpenRouter's unified API.
    
    OpenRouter is a unified API that routes to multiple LLM providers based on model ID.
    This eliminates the need for separate API keys for Claude, GPT, Gemini, etc.
    
    Supported model ID formats:
    - Claude: anthropic/claude-opus-4-5-20251101, anthropic/claude-sonnet-4-5-20250929, etc.
    - GPT: openai/gpt-4o, openai/gpt-4-turbo, openai/gpt-4o-mini, etc.
    - Gemini: google/gemini-pro-1.5, google/gemini-pro, etc.
    - Llama: meta-llama/llama-2-70b, meta-llama/llama-2-13b, etc.
    - Mistral: mistralai/mistral-7b, mistralai/mistral-large, etc.
    """
    
    def __init__(self, api_key: str, model_name: str = "anthropic/claude-opus-4.5"):
        """
        Initialize OpenRouter provider.
        
        Args:
            api_key: OpenRouter API key
            model_name: Model ID with provider prefix (e.g., "anthropic/claude-opus-4-5-20251101")
        """
        self.model_name = model_name
        self.client = OpenAI(api_key=api_key, base_url="https://openrouter.ai/api/v1")
    
    def chat_completion(
        self,
        messages: List[Dict[str, str]],
        schema: Optional[Dict[str, Any]] = None,
        temperature: float = 0.7,
        max_tokens: int = 2000,
        response_format: Optional[Dict[str, Any]] = None,
        **kwargs
    ) -> Dict[str, Any]:
        """
        Get a chat completion from OpenRouter.
        
        Args:
            messages: List of message dicts with 'role' and 'content'
            temperature: Sampling temperature (0-2)
            max_tokens: Maximum tokens in response
            response_format: Optional JSON schema for structured output
            **kwargs: Additional parameters passed to OpenRouter API
            
        Returns:
            The assistant's response text
            
        Raises:
            Exception: If the API call fails
        """
        try:
            # Prepare kwargs
            request_kwargs = {
                "model": self.model_name,
                "messages": messages,
                "temperature": temperature,
                "max_tokens": max_tokens,
                **kwargs
            }

            is_gemini = self.model_name.startswith("google/gemini")

            # Add JSON schema if provided
            if schema:
                if is_gemini:
                    # Gemini: use json_schema but with strict: false
                    request_kwargs["response_format"] = {
                        "type": "json_schema",
                        "json_schema": {
                            "name": schema.get("title", "response"),
                            "schema": schema,
                            "strict": False,  # Gemini needs relaxed validation
                        },
                    }
                else:
                    # Other models: strict schema validation
                    request_kwargs["response_format"] = {
                        "type": "json_schema",
                        "json_schema": {
                            "name": schema.get("title", "response"),
                            "schema": schema,
                            "strict": True,
                        },
                    }
            elif response_format:
                request_kwargs["response_format"] = response_format
            
            # Make the API call
            response = self.client.chat.completions.create(**request_kwargs)

            # Extract the response text
            if not response or not response.choices or len(response.choices) == 0:
                raise Exception("OpenRouter API returned empty response")
            
            content = response.choices[0].message.content
            
            # Handle case where content might be None
            if content is None:
                raise Exception("OpenRouter API returned None content in response")

            # If schema was used, attempt to parse JSON; if parsing fails, return raw content
            if schema:
                try:
                    parsed = json.loads(content)
                    return {"content": content, "parsed": parsed}
                except Exception:
                    # Return raw content so caller can decide how to handle
                    return {"content": content, "parsed": None}

            # Otherwise return only raw content
            return {"content": content}
            
        except Exception as e:
            raise Exception(f"OpenRouter API error with model {self.model_name}: {str(e)}")
    
    def json_completion(
        self,
        messages: List[Dict[str, str]],
        schema: Dict[str, Any],
        temperature: float = 0.7,
        max_tokens: int = 2000,
        **kwargs
    ) -> Dict[str, Any]:
        """
        Get a JSON-formatted completion from OpenRouter using structured output.
        
        Args:
            messages: List of message dicts with 'role' and 'content'
            schema: JSON schema for the response structure
            temperature: Sampling temperature (0-2)
            max_tokens: Maximum tokens in response
            **kwargs: Additional parameters passed to OpenRouter API
            
        Returns:
            Parsed JSON response as dict
            
        Raises:
            Exception: If the API call fails or response isn't valid JSON
        """
        try:
            # Prepare the response format for structured output
            response_format = {
                "type": "json_schema",
                "json_schema": {
                    "name": schema.get("title", "response"),
                    "schema": schema,
                    "strict": True
                }
            }
            
            # Make the API call with JSON mode
            response = self.client.chat.completions.create(
                model=self.model_name,
                messages=messages,
                temperature=temperature,
                max_tokens=max_tokens,
                response_format=response_format,
                **kwargs
            )
            
            # Extract the response text
            response_text = response.choices[0].message.content
            
            # Parse and return as JSON
            return json.loads(response_text)
            
        except json.JSONDecodeError as e:
            raise Exception(f"Failed to parse JSON response from OpenRouter: {str(e)}")
        except Exception as e:
            raise Exception(f"OpenRouter JSON API error with model {self.model_name}: {str(e)}")
    
    def get_model_name(self) -> str:
        """Get the model name/ID."""
        return self.model_name
    
    def validate_response(
        self,
        response: str,
        schema: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
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
        result = {"content": response}
        
        if schema:
            try:
                # Try to parse as JSON
                parsed = json.loads(response)
                result["parsed"] = parsed
            except json.JSONDecodeError:
                raise ValueError(f"Response is not valid JSON: {response}")
        
        return result
