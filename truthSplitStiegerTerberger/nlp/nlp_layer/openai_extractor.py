"""Deprecated shim: use nlp_layer/llm_extractor.py instead."""

from .llm_extractor import LLMExtractor, create_llm_extractor

__all__ = ["LLMExtractor", "create_llm_extractor"]