"""Simple Assumption Retriever - Fresh Start."""

import json
import logging
from pathlib import Path
from typing import Dict, List

from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity

logger = logging.getLogger(__name__)


class SimpleAssumptionRetriever:
    """Sentence transformer-based assumption retriever."""

    def __init__(self):
        """Load the sentence transformer and the assumption bank."""
        self.assumption_store = self._load_assumption_bank()
        if not self.assumption_store:
            raise RuntimeError("Assumption bank is empty.")

        self.assumptions = [item["text"] for item in self.assumption_store]
        self.model = SentenceTransformer("all-MiniLM-L6-v2")
        self.assumption_embeddings = self.model.encode(self.assumptions)
        logger.info("✅ Assumption retriever loaded with %d items", len(self.assumptions))
        print("🔎 Assumption retriever mode: sentence-transformer embeddings")

    def _load_assumption_bank(self) -> List[Dict[str, str]]:
        data_path = Path(__file__).resolve().parent / "data" / "assumption_bank.json"
        if not data_path.exists():
            logger.warning("⚠️ assumption_bank.json not found at %s", data_path)
            return []

        with open(data_path, "r", encoding="utf-8") as handle:
            data = json.load(handle)

        records: List[Dict[str, str]] = []
        for item in data:
            text = item.get("text")
            if not text:
                continue
            records.append(
                {
                    "text": text,
                    "category": item.get("category", "general"),
                    "domain": item.get("domain", "general"),
                    "description": item.get("description", ""),
                }
            )
        return records

    def get_assumptions(self, claims: List[str], top_k: int = 3, include_scores: bool = False):
        """Retrieve assumptions most relevant to the given claims."""
        if not claims:
            return []

        claim_embeddings = self.model.encode(claims)
        similarities = cosine_similarity(claim_embeddings, self.assumption_embeddings)

        candidate_scores = []
        for idx in range(len(self.assumptions)):
            column = similarities[:, idx]
            max_score = float(column.max())
            mean_score = float(column.mean())
            candidate_scores.append((idx, max_score, mean_score))

        candidate_scores.sort(key=lambda item: (item[1], item[2]), reverse=True)

        results: List[Dict[str, str]] = []
        for idx, max_score, mean_score in candidate_scores:
            if max_score < 0.18:
                break
            record = dict(self.assumption_store[idx])
            record["score"] = round(max_score, 3)
            record["mean_score"] = round(mean_score, 3)
            results.append(record)
            if len(results) >= top_k:
                break

        if include_scores:
            return results
        return [item["text"] for item in results]


# Global instance
assumption_retriever = SimpleAssumptionRetriever()
