"""
LLM Provider Abstraction Layer

Unified interface for multiple LLM providers (OpenAI, Claude, Gemini, Grok).
Prompts are defined once in prompt_templates.py and adapted per provider.
"""

from .provider_factory import create_provider

__all__ = ['create_provider']
