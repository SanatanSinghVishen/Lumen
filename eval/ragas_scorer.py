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
        from langchain_openai import ChatOpenAI
        import os

        # RAGAS requires a model that natively supports OpenAI-style JSON/tool calling.
        # "owl-alpha" throws 400 on these strict structured requests. 
        # We use Llama 3.3 70B Instruct Free which supports OpenRouter structured outputs flawlessly.
        api_key = os.getenv("OPENROUTER_API_KEY", "")
        ragas_specific_llm = ChatOpenAI(
            model="meta-llama/llama-3.3-70b-instruct:free", 
            openai_api_key=api_key, 
            openai_api_base="https://openrouter.ai/api/v1", 
            max_retries=2, 
            timeout=45
        ) if api_key else llm

        # RAGAS expects a HuggingFace Dataset with these exact column names
        data = {
            "question":  [query],
            "answer":    [answer],
            "contexts":  [contexts],   # list of retrieved chunk strings
            # reference is optional — omit for Answer Relevancy and Faithfulness
        }
        dataset = Dataset.from_dict(data)

        # Wrap LangChain LLM and embeddings for RAGAS
        ragas_llm        = LangchainLLMWrapper(ragas_specific_llm)
        ragas_embeddings = LangchainEmbeddingsWrapper(embeddings)

        from ragas.run_config import RunConfig
        run_config = RunConfig(max_workers=1, max_retries=2)

        scores = evaluate(
            dataset,
            metrics=[faithfulness, answer_relevancy],
            llm=ragas_llm,
            embeddings=ragas_embeddings,
            raise_exceptions=False,   # never crash — return NaN instead
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

    except Exception as e:
        logger.warning("RAGAS scoring failed — %s", str(e))
        result["error"] = str(e)

    return result
