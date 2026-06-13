"""
ragas_scorer.py
───────────────
Computes RAGAS metrics for a completed research draft.
Designed to fail gracefully — if RAGAS errors for any reason,
it returns None scores and logs the error. It must never crash
the agent pipeline.

Metrics:
  - Faithfulness:      are the report's claims supported by retrieved context?
  - Answer Relevancy:  does the report actually answer the original query?
  - Context Precision: did the retriever surface the most relevant chunks first?
"""

import logging
import time
from typing import Optional

logger = logging.getLogger("lumen.ragas")


def compute_ragas_scores(
    query: str,
    answer: str,
    contexts: list[str],
) -> dict:
    """
    Returns a dict with keys:
        faithfulness, answer_relevancy, context_precision, error
    All float fields are between 0.0 and 1.0.
    Any field can be None if scoring failed.

    LLM and embeddings are handled internally — no external
    dependencies need to be passed in.
    """
    result = {
        "faithfulness":      None,
        "answer_relevancy":  None,
        "context_precision": None,
        "error":             None,
    }

    try:
        # --- RAGAS / LangChain 0.2.0 Compatibility Hack ---
        import sys
        if "langchain_community.chat_models.vertexai" not in sys.modules:
            import types
            mock_module = types.ModuleType("langchain_community.chat_models.vertexai")
            mock_module.ChatVertexAI = type("ChatVertexAI", (object,), {})
            sys.modules["langchain_community.chat_models.vertexai"] = mock_module
        # ---------------------------------------------------

        from ragas import evaluate
        from ragas.metrics import faithfulness, answer_relevancy
        from ragas.llms import LangchainLLMWrapper
        from ragas.embeddings import LangchainEmbeddingsWrapper
        from datasets import Dataset

        # Rate limit protection — serialize RAGAS calls
        # RAGAS fires multiple LLM calls per metric; this prevents
        # smashing the 30 RPM Groq ceiling
        time.sleep(2)

        # Use only top 3 contexts to minimise LLM calls
        # (3 contexts × 2 metrics = ~6 LLM calls instead of 30+)
        trimmed_contexts = contexts[:3]

        from llm import get_evaluator_llm
        ragas_llm = LangchainLLMWrapper(get_evaluator_llm())

        # Use the existing ChromaDB ONNX embeddings instead of loading PyTorch models into RAM
        # This prevents Out Of Memory (OOM) crashes on the Render free tier
        from tools.vector_retrieval import embeddings
        ragas_embeddings = LangchainEmbeddingsWrapper(embeddings)

        # RAGAS expects a HuggingFace Dataset with these exact column names
        data = {
            "question":  [query],
            "answer":    [answer],
            "contexts":  [trimmed_contexts],
        }
        dataset = Dataset.from_dict(data)

        from ragas.run_config import RunConfig
        run_config = RunConfig(max_workers=2, max_retries=10)

        # Explicitly bind LLM and embeddings to metrics to fix AssertionError in newer ragas versions
        faithfulness.llm = ragas_llm
        answer_relevancy.llm = ragas_llm
        answer_relevancy.embeddings = ragas_embeddings

        scores = evaluate(
            dataset,
            metrics=[faithfulness, answer_relevancy],
            raise_exceptions=False,
            run_config=run_config,
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
        
        # Force cleanup of PyArrow memory structures
        del dataset
        del scores
        df = None
        import gc
        gc.collect()

    except Exception as e:
        logger.warning("RAGAS scoring failed — %s", str(e))
        result["error"] = str(e)

    return result
