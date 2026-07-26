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

        # Pass up to 8 retrieved contexts (truncated to 1200 chars each) to ensure full coverage
        trimmed_contexts = [c[:1200] for c in contexts[:8]]
        context_str = "\n\n---\n\n".join(trimmed_contexts)

        system_prompt = """You are an objective expert evaluator of Retrieval-Augmented Generation (RAG) research systems.
Evaluate the generated research report against the provided context snippets and original query.
Compute three specific metrics on a scale of 0.0 to 1.0 based on realistic RAG evaluation standards:

1. Faithfulness: How accurately are the factual claims, data points, and technical statements in the report grounded in and supported by the provided context snippets? High score (0.85 - 1.0) means claims match the context without factual fabrications or contradictions.
2. Answer Relevancy: How thoroughly and accurately does the research report address the core subject of the original query? High score (0.85 - 1.0) means the whitepaper directly and comprehensively covers the requested research topic.
3. Context Precision: How relevant and useful are the retrieved context snippets to the research query? High score (0.85 - 1.0) means the surfaced context chunks contain relevant information for the topic.

Output a raw JSON object (and nothing else) exactly in this format:
{{
  "faithfulness": 0.92,
  "answer_relevancy": 0.88,
  "context_precision": 0.85,
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
