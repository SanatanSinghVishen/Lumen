"""
fast_eval.py
───────────────
Computes FastEval metrics for a completed research draft.
Designed to fail gracefully — if FastEval errors for any reason,
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

logger = logging.getLogger("lumen.fasteval")


def compute_eval_scores(
    query: str,
    answer: str,
    contexts: list[str],
) -> dict:
    """
    Returns a dict with keys:
        faithfulness, answer_relevancy, context_precision, error
    All float fields are between 0.0 and 1.0.
    Any field can be None if scoring failed.

    This uses a lightweight, single-pass LLM-as-a-judge implementation to bypass
    the massive dependency overhead and 3-minute latency of the official library.
    """
    result = {
        "faithfulness":      None,
        "answer_relevancy":  None,
        "context_precision": None,
        "error":             None,
    }

    try:
        from llm import get_evaluator_llm
        from langchain_core.prompts import ChatPromptTemplate
        import json

        # Use only top 3 contexts to minimise prompt length
        trimmed_contexts = contexts[:3]
        context_str = "\n\n".join(trimmed_contexts)

        system_prompt = """You are an expert evaluator of Retrieval-Augmented Generation (RAG) systems.
Please evaluate the generated answer based on the provided context and original query.
Compute three specific metrics on a scale of 0.0 to 1.0:

1. Faithfulness: Is the answer entirely supported by the provided context? (1.0 = fully supported, 0.0 = completely hallucinated/unsupported)
2. Answer Relevancy: How directly and concisely does the answer address the original query? (1.0 = perfectly addresses the query, 0.0 = completely irrelevant)
3. Context Precision: How relevant and useful are the provided context chunks to the query? (1.0 = highly relevant, 0.0 = completely useless)

Output a raw JSON object (and nothing else) exactly in this format:
{{
  "faithfulness": 0.95,
  "answer_relevancy": 0.85,
  "context_precision": 0.90,
  "reasoning": "Brief explanation of your scores..."
}}"""

        user_prompt = """Context:
{context}

Query:
{query}

Answer:
{answer}"""

        prompt = ChatPromptTemplate.from_messages([
            ("system", system_prompt),
            ("user", user_prompt)
        ])

        llm = get_evaluator_llm()
        # Bind json object to ensure strict JSON output
        if hasattr(llm, "bind"):
            try:
                llm = llm.bind(response_format={"type": "json_object"})
            except Exception:
                pass # Not all LLMs support this natively

        chain = prompt | llm
        
        # This is synchronous but fast since it's a single LLM call
        response = chain.invoke({
            "context": context_str,
            "query": query,
            "answer": answer
        })
        content = response.content.strip()
        
        # Clean up markdown code blocks if present
        if content.startswith("```json"):
            content = content[7:]
        if content.startswith("```"):
            content = content[3:]
        if content.endswith("```"):
            content = content[:-3]
            
        scores = json.loads(content.strip())

        def safe_float(val) -> Optional[float]:
            try:
                return round(float(val), 3)
            except Exception:
                return None

        result["faithfulness"]      = safe_float(scores.get("faithfulness"))
        result["answer_relevancy"]  = safe_float(scores.get("answer_relevancy"))
        result["context_precision"] = safe_float(scores.get("context_precision"))

        logger.info(
            "FastEval scores — faithfulness: %s | relevancy: %s | precision: %s",
            result["faithfulness"],
            result["answer_relevancy"],
            result["context_precision"],
        )

    except Exception as e:
        logger.warning("FastEval scoring failed — %s", str(e))
        result["error"] = str(e)

    return result
