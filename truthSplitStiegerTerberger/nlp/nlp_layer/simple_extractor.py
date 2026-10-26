"""Simple NLP Extractor - Lean Version."""

import logging
import re
from typing import Any, Dict, List

logger = logging.getLogger(__name__)


class SimpleExtractor:
    """Minimal extractor that relies on the primary ML models."""

    def __init__(self, claim_classifier=None, assumption_retriever=None):
        if claim_classifier is None:
            from .simple_classifier import claim_classifier as default_claim_classifier

            claim_classifier = default_claim_classifier
        if assumption_retriever is None:
            from .simple_assumptions import assumption_retriever as default_assumption_retriever

            assumption_retriever = default_assumption_retriever

        self.claim_classifier = claim_classifier
        self.assumption_retriever = assumption_retriever
        self.claim_confidence_threshold = 0.5
        self.modal_boost_pattern = re.compile(
            r"\b(should|must|ought to|need to|have to|required to)\b", re.IGNORECASE
        )
        self.urgency_pattern = re.compile(r"\b(critical|essential|cannot|must)\b", re.IGNORECASE)
        self.conclusion_pattern = re.compile(
            r"^(therefore|thus|hence|overall|in conclusion|as a result|accordingly)\b", re.IGNORECASE
        )
        self.bridge_pattern = re.compile(
            r"^(nevertheless|nonetheless|furthermore|moreover|additionally|however|meanwhile|in addition)\b",
            re.IGNORECASE,
        )
        self.max_premise_window = 3
        self.min_premise_tokens = 8

        self.premise_marker_pattern = re.compile(
            r"\b(because|since|due to|owing to|because of|as a result|therefore|thus|for example|for instance|"
            r"research (?:shows|indicates)|studies (?:show|suggest)|data (?:shows|indicates)|evidence|according to)\b",
            re.IGNORECASE,
        )
        self.numeric_pattern = re.compile(r"\b\d+(\.\d+)?%|\b\d{2,}\b")
        self.citation_pattern = re.compile(r"\b(report|survey|study|analysis|according to)\b", re.IGNORECASE)

    def extract(self, text: str) -> Dict[str, Any]:
        """Extract claims, premises, and assumptions from the input text."""
        sentences = self._split_sentences(text)
        if not sentences:
            return self._empty_result()

        logger.info("Processing %d sentences", len(sentences))
        sentence_data = self._classify_sentences(sentences)

        claims = self._collect_claims(sentence_data)
        premises = self._collect_premises(sentence_data, claims)
        assumptions = self._collect_assumptions(claims)

        summary = {
            "total_claims": len(claims),
            "total_premises": len(premises),
            "total_assumptions": len(assumptions),
        }

        logger.info(
            "Extraction complete: %d claims, %d premises, %d assumptions",
            summary["total_claims"],
            summary["total_premises"],
            summary["total_assumptions"],
        )

        return {
            "claims": claims,
            "premises": premises,
            "assumptions": assumptions,
            "summary": summary,
        }

    def _classify_sentences(self, sentences: List[str]) -> List[Dict[str, Any]]:
        """Run the claim classifier on each sentence."""
        sentence_data: List[Dict[str, Any]] = []
        for index, sentence in enumerate(sentences):
            is_claim, confidence = self.claim_classifier.classify_claim(sentence)
            boosted_confidence = self._boost_confidence(sentence, float(confidence))
            sentence_data.append(
                {
                    "index": index,
                    "text": sentence,
                    "raw_confidence": float(confidence),
                    "boosted_confidence": boosted_confidence,
                    "is_claim": self._decide_is_claim(sentence, bool(is_claim), boosted_confidence),
                }
            )
        return sentence_data

    def _collect_claims(self, sentence_data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Return claim records from classified sentences."""
        claims: List[Dict[str, Any]] = []
        for idx, item in enumerate(sentence_data, start=1):
            if not item["is_claim"]:
                continue
            claims.append(
                {
                    "id": f"C{idx}",
                    "text": item["text"],
                    "confidence": round(item["boosted_confidence"], 3),
                    "type": "claim",
                    "position": item["index"],
                    "premises": [],
                    "assumptions": [],
                }
            )
        return claims

    def _collect_premises(
        self, sentence_data: List[Dict[str, Any]], claims: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """Gather premises adjacent to claims."""
        if not claims:
            return []

        premises: List[Dict[str, Any]] = []
        used_indices: Dict[int, Dict[str, Any]] = {}

        for claim in claims:
            claim_idx = claim["position"]
            for neighbor_idx in self._neighbor_indices(claim_idx, len(sentence_data)):
                candidate = sentence_data[neighbor_idx]
                if candidate["is_claim"]:
                    continue
                if len(candidate["text"].split()) < self.min_premise_tokens:
                    continue

                confidence = self._premise_confidence(candidate["text"])
                premise = used_indices.get(neighbor_idx)
                if premise is None:
                    premise = {
                        "id": f"P{len(premises) + 1}",
                        "text": candidate["text"],
                        "confidence": round(confidence, 3),
                        "type": "premise",
                        "position": neighbor_idx,
                        "claim_ids": [claim["id"]],
                    }
                    premises.append(premise)
                    used_indices[neighbor_idx] = premise
                else:
                    if claim["id"] not in premise["claim_ids"]:
                        premise["claim_ids"].append(claim["id"])

                if premise not in claim["premises"]:
                    claim["premises"].append(premise)

        premises.sort(key=lambda item: item["position"])
        return premises

    def _collect_assumptions(self, claims: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Retrieve assumptions for each claim."""
        if not claims:
            return []

        assumption_records: List[Dict[str, Any]] = []
        counter = 1

        for claim in claims:
            retrieved = self.assumption_retriever.get_assumptions(
                [claim["text"]],
                top_k=2,
                include_scores=True,
            )
            for record in retrieved:
                assumption = {
                    "id": f"A{counter}",
                    "text": record["text"],
                    "type": "assumption",
                    "confidence": float(record.get("score", 0.0)),
                    "claim_id": claim["id"],
                    "category": record.get("category", "general"),
                    "domain": record.get("domain", "general"),
                }
                claim["assumptions"].append(assumption)
                assumption_records.append(assumption)
                counter += 1

        return assumption_records

    def _neighbor_indices(self, center: int, total: int) -> List[int]:
        """Return neighbouring sentence indices within the configured window."""
        indices: List[int] = []
        for offset in range(1, self.max_premise_window + 1):
            before = center - offset
            if before >= 0:
                indices.append(before)
        for offset in range(1, self.max_premise_window + 1):
            after = center + offset
            if after < total:
                indices.append(after)
        return indices

    def _boost_confidence(self, sentence: str, confidence: float) -> float:
        """Apply lightweight boosts for modal or urgent language."""
        boosted = confidence
        if self.modal_boost_pattern.search(sentence):
            boosted += 0.06
        if self.urgency_pattern.search(sentence):
            boosted += 0.03
        if self.conclusion_pattern.match(sentence):
            boosted += 0.04
        return min(1.0, boosted)

    def _decide_is_claim(self, sentence: str, model_is_claim: bool, boosted_confidence: float) -> bool:
        """Determine whether a sentence should be treated as a claim."""
        stripped = sentence.strip()
        if not stripped:
            return False
        word_count = len(stripped.split())
        if word_count < 6:
            return False

        modal = bool(self.modal_boost_pattern.search(stripped))
        conclusion = bool(self.conclusion_pattern.match(stripped))
        bridge = bool(self.bridge_pattern.match(stripped))

        if bridge and not modal and not conclusion:
            return False

        if conclusion and boosted_confidence >= (self.claim_confidence_threshold - 0.05):
            return True

        if modal and boosted_confidence >= (self.claim_confidence_threshold - 0.03):
            return True

        if not modal and not conclusion:
            return model_is_claim and boosted_confidence >= self.claim_confidence_threshold

        if model_is_claim and boosted_confidence >= (self.claim_confidence_threshold - 0.01):
            return True

        return False

    def _premise_confidence(self, sentence: str) -> float:
        """Estimate a simple confidence score for premises."""
        score = 0.35
        if self.premise_marker_pattern.search(sentence):
            score += 0.25
        if self.numeric_pattern.search(sentence):
            score += 0.15
        if self.citation_pattern.search(sentence):
            score += 0.1
        return max(0.3, min(score, 0.95))

    def _split_sentences(self, text: str) -> List[str]:
        """Split text on sentence and line boundaries."""
        raw_parts = re.split(r"(?<=[.!?])\s+|\n+|;", text)
        sentences: List[str] = []
        for part in raw_parts:
            cleaned = re.sub(r"^[\-•\d\)\(]+\s*", "", part).strip()
            if cleaned:
                sentences.append(cleaned)
        return sentences

    def _empty_result(self) -> Dict[str, Any]:
        """Return an empty result structure."""
        return {
            "claims": [],
            "premises": [],
            "assumptions": [],
            "summary": {"total_claims": 0, "total_premises": 0, "total_assumptions": 0},
        }


extractor = SimpleExtractor()
