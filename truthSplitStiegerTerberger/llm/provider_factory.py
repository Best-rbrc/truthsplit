"""
Provider Factory

Factory function to create LLM provider instances based on provider name.
Uses only OpenRouter as the unified LLM provider.
"""

import os
from typing import Optional
from .base_provider import LLMProvider
from .openrouter_provider import OpenRouterProvider


# Default models for OpenRouter
# Format: provider_name/model_id (e.g., anthropic/claude-opus-4-5-20251101, openai/gpt-4o)
DEFAULT_MODELS = {
    "openrouter": "anthropic/claude-opus-4.5"
}

# Environment variable names for API keys
API_KEY_ENV_VARS = {
    "openrouter": "OPENROUTER_API_KEY"
}

def create_provider(
    provider_name: str,
    model_name: Optional[str] = None,
    api_key: Optional[str] = None
) -> LLMProvider:
    """
    Create an LLM provider instance using OpenRouter.
    
    Args:
        provider_name: Provider name. "openai" and "claude" are automatically routed to OpenRouter.
        model_name: Model name. Can be in two formats:
                   - Short format (auto-converted): "gpt-4o", "claude-opus-4-5-20251101"
                   - OpenRouter format (used as-is): "openai/gpt-4o", "anthropic/claude-opus-4-5-20251101"
        api_key: Optional API key. If not provided, reads from OPENROUTER_API_KEY environment variable.
        
    Returns:
        OpenRouterProvider instance
        
    Raises:
        ValueError: If provider name is not supported
        Exception: If OPENROUTER_API_KEY is missing
        
    Examples:
        # Using short model names (auto-converted to OpenRouter format)
        provider = create_provider("openai", "gpt-4o")  # -> openai/gpt-4o
        provider = create_provider("claude", "claude-opus-4-5-20251101")  # -> anthropic/claude-opus-4-5-20251101
        
        # Using OpenRouter model IDs directly
        provider = create_provider("openrouter", "openai/gpt-4o")
        provider = create_provider("openrouter", "anthropic/claude-opus-4-5-20251101")
    """
    
    provider_name = provider_name.lower()
    
    # Map old provider names to OpenRouter format
    model_id_map = {
        "openai": {
            "gpt-5": "openai/gpt-4o",
            "gpt-5-mini": "openai/gpt-4o-mini",
            "gpt-5-nano": "openai/gpt-4o-mini"
        },
        "claude": {
            "claude-haiku-4-5-20251001": "anthropic/claude-opus-4.5",
            "claude-sonnet-4-5-20250929": "anthropic/claude-sonnet-4.5",
            "claude-opus-4-5-20251101": "anthropic/claude-opus-4.5"
        },
        "gemini": {
            "gemini-2.5-pro": "google/gemini-2.5-pro",
            "gemini-2.5-flash": "google/gemini-2.5-flash",
            "gemini-2.5-flash-lite": "google/gemini-2.5-flash-lite"
        },
        "grok": {
            "grok-4": "x-ai/grok-4",
            "grok-3": "x-ai/grok-3",
            "grok-3-mini": "x-ai/grok-3-mini"
        },
        "deepseek": {
            "deepseek-v3": "deepseek/deepseek-chat-v3-0324"
        }
    }
    
    # Convert short model names to OpenRouter format
    if provider_name in model_id_map:
        if not model_name:
            # Use default for this provider
            if provider_name == "openai":
                model_name = DEFAULT_MODELS["openrouter"]  # Default is Claude
            else:
                model_name = DEFAULT_MODELS["openrouter"]
        elif model_name in model_id_map[provider_name]:
            # Convert short name to OpenRouter format
            model_name = model_id_map[provider_name][model_name]
        # else: model_name is already in full format, use as-is
        provider_name = "openrouter"
    elif provider_name != "openrouter":
        raise ValueError(
            f"Unsupported provider: {provider_name}. "
            f"Supported: 'openai', 'claude', 'gemini', 'grok', 'deepseek', 'openrouter'"
        )
    
    # Get API key from parameter or environment
    if not api_key:
        api_key = os.getenv("OPENROUTER_API_KEY")
        if not api_key:
            raise Exception(
                "OpenRouter API key not found. "
                "Please set OPENROUTER_API_KEY in your .env file."
            )
    
    # Use default model if not specified
    if not model_name:
        model_name = DEFAULT_MODELS["openrouter"]
    
    # Create and return OpenRouter provider
    return OpenRouterProvider(api_key, model_name)



def get_available_providers() -> list:
    """
    Get list of available providers (only OpenRouter if OPENROUTER_API_KEY is set).
    
    Returns:
        List containing "openrouter" if API key is available, empty list otherwise.
    """
    if os.getenv("OPENROUTER_API_KEY"):
        return ["openrouter"]
    return []
