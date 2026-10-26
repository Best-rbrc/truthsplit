"""
Data schemas for the enhanced NLP layer.
Clean, type-safe data models for claims, premises, assumptions, and results.
"""

from dataclasses import dataclass, field
from typing import List, Dict, Any, Optional, Union
from datetime import datetime
import uuid

@dataclass
class Premise:
    """A premise that supports a claim."""
    text: str
    confidence: float = 0.0
    position: Optional[int] = None
    paragraph_id: Optional[int] = None
    premise_type: Optional[str] = None
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    metadata: Dict[str, Any] = field(default_factory=dict)

@dataclass  
class Assumption:
    """An underlying assumption."""
    text: str
    category: str = "general"
    confidence: float = 0.0
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    metadata: Dict[str, Any] = field(default_factory=dict)

@dataclass
class Claim:
    """A main argumentative claim."""
    text: str
    confidence: float = 0.0
    position: Optional[int] = None
    paragraph_id: Optional[int] = None
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    metadata: Dict[str, Any] = field(default_factory=dict)
    # Maintain compatibility with existing code
    premises: List['Premise'] = field(default_factory=list)
    assumptions: List['Assumption'] = field(default_factory=list)

@dataclass
class ProcessingMetadata:
    """Metadata about the processing operation."""
    processing_time: float = 0.0
    total_sentences: int = 0
    error_message: Optional[str] = None
    extraction_stats: Dict[str, Any] = None
    config_used: Optional[Dict[str, Any]] = None
    
    def __post_init__(self):
        if self.extraction_stats is None:
            self.extraction_stats = {}
        if self.config_used is None:
            self.config_used = {}

@dataclass
class ExtractionConfig:
    """Configuration for argument extraction."""
    min_claim_confidence: float = 0.5
    min_premise_confidence: float = 0.4
    max_assumptions: int = 5
    nli_threshold: float = 0.7
    extract_assumptions: bool = True
    use_nli_filtering: bool = False
    context_window_size: int = 2
    
    def __post_init__(self):
        # Validate configuration values
        self.min_claim_confidence = max(0.0, min(1.0, self.min_claim_confidence))
        self.min_premise_confidence = max(0.0, min(1.0, self.min_premise_confidence))
        self.max_assumptions = max(1, self.max_assumptions)
        self.nli_threshold = max(0.0, min(1.0, self.nli_threshold))

@dataclass
class NLPLayerResult:
    """Complete result from NLP layer processing."""
    claims: List[Claim]
    premises: List[Premise] 
    assumptions: List[Assumption]
    metadata: Optional[ProcessingMetadata] = None