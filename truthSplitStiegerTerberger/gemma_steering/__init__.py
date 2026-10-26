"""
Gemma Steering Module

This module provides all Gemma-2B steering functionality for worldview analysis.
It is kept separate from the main pipeline logic for easy adjustment and maintenance.

Key components:
- GemmaSteeringManager: Manages model loading, SAE, and steering hooks
- Dynamic feature discovery: Finds steering features per claim/worldview combination
- Improved prompting: Uses gemmaLoad.py style prompts for better outputs
"""

from .steering_manager import GemmaSteeringManager, get_steering_manager
from .analyzer import GemmaWorldviewAnalyzer

__all__ = [
    'GemmaSteeringManager',
    'get_steering_manager',
    'GemmaWorldviewAnalyzer',
]

