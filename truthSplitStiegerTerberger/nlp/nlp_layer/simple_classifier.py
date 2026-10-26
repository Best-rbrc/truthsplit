"""Simple BART Claim Classifier - Fresh Start."""

import logging
import os
from typing import List, Tuple

from transformers import pipeline


logger = logging.getLogger(__name__)


class SimpleClaimClassifier:
    """Zero-shot claim classifier backed by BART."""

    def __init__(self):
        """Initialize the transformers pipeline."""
        os.environ["TOKENIZERS_PARALLELISM"] = "false"

        self.classifier = pipeline(
            "zero-shot-classification",
            model="facebook/bart-large-mnli",
            device=-1,
        )

        self.candidate_labels: List[str] = [
            "argumentative claim",
            "policy claim",
            "value judgment",
            "prediction",
            "call to action",
            "factual statement",
            "background information",
        ]
        self.claim_like_labels = {
            "argumentative claim",
            "policy claim",
            "value judgment",
            "prediction",
            "call to action",
        }
        self.claim_threshold = 0.45
        self.secondary_threshold = 0.35

    def classify_claim(self, text: str) -> Tuple[bool, float]:
        """Check if text is an argumentative claim."""
        cleaned = text.strip()
        if len(cleaned) < 8:
            return False, 0.0

        result = self.classifier(cleaned, self.candidate_labels)
        label_scores = dict(zip(result["labels"], result["scores"]))

        claim_score = max(
            (label_scores.get(label, 0.0) for label in self.claim_like_labels), default=0.0
        )

        top_label = result["labels"][0]
        top_score = float(result["scores"][0])

        is_claim = top_label in self.claim_like_labels or claim_score >= self.claim_threshold

        if not is_claim and top_label == "factual statement" and claim_score >= self.secondary_threshold:
            is_claim = True

        confidence = claim_score if is_claim else top_score
        return bool(is_claim), float(confidence)

    def batch_classify(self, texts: List[str]) -> List[Tuple[bool, float]]:
        """Classify multiple texts."""
        return [self.classify_claim(text) for text in texts]


# Global instance
claim_classifier = SimpleClaimClassifier()
