"""
ragas_scorer.py
───────────────
Computes three RAGAS metrics for a completed research draft.
Designed to fail gracefully — if RAGAS errors for any reason,
it returns None scores and logs the error. It must never crash
the agent pipeline.

Metrics:
  - Faithfulness:      are the report's claims supported by retrieved context?
  - Answer Relevancy:  does the report actually answer the original query?
  - Context Precision: did the retriever surface the most relevant chunks first?
"""

import logging
from typing import Optional

logger = logging.getLogger("lumen.ragas")


def compute_ragas_scores(
    query: str,
    answer: str,
    contexts: list[str],
    llm,            # pass your existing ChatGoogleGenerativeAI instance
    embeddings,     # pass your existing embeddings instance
) -> dict:
    """
    Returns a dict with keys:
        faithfulness, answer_relevancy, context_precision, error
    All float fields are between 0.0 and 1.0.
    Any field can be None if scoring failed.
    """
    result = {
        "faithfulness":      None,
        "answer_relevancy":  None,
        "context_precision": None,
        "error":             None,
    }

    try:
        from ragas import evaluate
        from ragas.metrics import faithfulness, answer_relevancy, context_precision
        from ragas.llms import LangchainLLMWrapper
        from ragas.embeddings import LangchainEmbeddingsWrapper
        from datasets import Dataset

        # RAGAS expects a HuggingFace Dataset with these exact column names
        data = {
            "question":  [query],
            "answer":    [answer],
            "contexts":  [contexts],   # list of retrieved chunk strings
            # ground_truth is optional — omit for Answer Relevancy and Faithfulness
        }
        dataset = Dataset.from_dict(data)

        # Wrap LangChain LLM and embeddings for RAGAS
        ragas_llm        = LangchainLLMWrapper(llm)
        ragas_embeddings = LangchainEmbeddingsWrapper(embeddings)

        scores = evaluate(
            dataset,
            metrics=[faithfulness, answer_relevancy, context_precision],
            llm=ragas_llm,
            embeddings=ragas_embeddings,
            raise_exceptions=False,   # never crash — return NaN instead
        )

        df = scores.to_pandas()
        row = df.iloc[0]

        def safe_float(val) -> Optional[float]:
            try:
                f = float(val)
                return round(f, 3) if f == f else None  # NaN check
            except Exception:
                return None

        result["faithfulness"]      = safe_float(row.get("faithfulness"))
        result["answer_relevancy"]  = safe_float(row.get("answer_relevancy"))
        result["context_precision"] = safe_float(row.get("context_precision"))

        logger.info(
            "RAGAS scores — faithfulness: %s | relevancy: %s | precision: %s",
            result["faithfulness"],
            result["answer_relevancy"],
            result["context_precision"],
        )

    except Exception as e:
        logger.warning("RAGAS scoring failed — %s", str(e))
        result["error"] = str(e)

    return result
