import textwrap

from nlp_layer.simple_extractor import SimpleExtractor


class DummyClassifier:
    def __init__(self, outputs):
        self.outputs = outputs

    def classify_claim(self, text):
        try:
            return self.outputs[text]
        except KeyError as exc:
            raise AssertionError(f"Unexpected sentence for classifier stub: {text}") from exc


class DummyAssumptionRetriever:
    def get_assumptions(self, claims, top_k=2, include_scores=False):
        if include_scores:
            return []
        return []


def build_extractor(mapping):
    classifier = DummyClassifier(mapping)
    assumptions = DummyAssumptionRetriever()
    return SimpleExtractor(claim_classifier=classifier, assumption_retriever=assumptions)


def test_modal_sentences_receive_confidence_boost():
    text = textwrap.dedent(
        """
        AI systems are becoming increasingly powerful and widespread in society.
        Policymakers should prioritize public safety over innovation speed.
        """
    ).strip()

    mapping = {
        "AI systems are becoming increasingly powerful and widespread in society.": (False, 0.2),
        "Policymakers should prioritize public safety over innovation speed.": (False, 0.43),
    }

    extractor = build_extractor(mapping)
    result = extractor.extract(text)

    assert result["summary"]["total_claims"] == 1
    claim_texts = [claim["text"] for claim in result["claims"]]
    assert "Policymakers should prioritize public safety over innovation speed." in claim_texts


def test_premise_window_reaches_distant_support_sentence():
    text = textwrap.dedent(
        """
        Indeed.
        Because of repeated outages, regulators recorded 120 safety incidents last year.
        Warnings persist.
        Implementation delays continue.
        Therefore, regulators should impose strict compliance audits across the sector.
        """
    ).strip()

    mapping = {
        "Indeed.": (False, 0.1),
        "Because of repeated outages, regulators recorded 120 safety incidents last year.": (False, 0.2),
        "Warnings persist.": (False, 0.15),
        "Implementation delays continue.": (False, 0.15),
        "Therefore, regulators should impose strict compliance audits across the sector.": (True, 0.5),
    }

    extractor = build_extractor(mapping)
    result = extractor.extract(text)

    assert result["summary"]["total_claims"] == 1
    assert result["summary"]["total_premises"] == 1

    premise_texts = [premise["text"] for premise in result["premises"]]
    expected_premise = "Because of repeated outages, regulators recorded 120 safety incidents last year."
    assert expected_premise in premise_texts

    claim = result["claims"][0]
    claim_premise_texts = [premise["text"] for premise in claim["premises"]]
    assert expected_premise in claim_premise_texts
    assert "Warnings persist." not in premise_texts


def test_conclusion_sentence_promoted_to_claim():
    text = textwrap.dedent(
        """
        Various audits highlight persistent safety gaps.
        Therefore, swift intervention is essential.
        """
    ).strip()

    mapping = {
        "Various audits highlight persistent safety gaps.": (False, 0.25),
        "Therefore, swift intervention is essential.": (False, 0.42),
    }

    extractor = build_extractor(mapping)
    result = extractor.extract(text)

    assert result["summary"]["total_claims"] == 1
    claim_texts = [claim["text"] for claim in result["claims"]]
    assert "Therefore, swift intervention is essential." in claim_texts
