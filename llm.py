"""
llm.py
──────
Single source of truth for all LLM instances in LUMEN.
All agent nodes import from here — never instantiate LLMs inline.

Model: google/gemini-2.5-flash
  - 1,000,000 token context window
  - Paid tier (virtually unlimited RPM/TPM)
  - Frontier-level reasoning
"""

import os
import logging

logger = logging.getLogger("lumen.llm")

MODEL = "google/gemini-2.5-flash"
BASE_URL = "https://openrouter.ai/api/v1"


def _get_api_key() -> str:
    key = os.getenv("OPENROUTER_API_KEY", "").strip()
    if not key:
        raise RuntimeError(
            "OPENROUTER_API_KEY is not set. "
            "Get a free key at openrouter.ai/keys and add it to your .env file."
        )
    return key


def get_llm(
    max_tokens:  int   = 8192,
    timeout:     int   = 60,
    streaming:   bool  = False,
):
    """
    Returns a ChatOpenAI instance pointed at OpenRouter.
    Uses provider defaults for temperature/top_p to avoid repetition loops.
    """
    from langchain_openai import ChatOpenAI

    llm = ChatOpenAI(
        model=MODEL,
        api_key=_get_api_key(),
        base_url=BASE_URL,
        max_tokens=max_tokens,
        timeout=timeout,
        streaming=streaming,
        max_retries=3,
        default_headers={
            "HTTP-Referer": "http://localhost:3000",
            "X-Title": "Lumen AI",
        }
    )
    logger.info("LLM initialised: %s (streaming=%s)", MODEL, streaming)
    return llm


def get_streaming_llm():
    """
    Returns an LLM instance configured for token streaming.
    Used exclusively by the synthesis node for SSE token emission.
    """
    from langchain_openai import ChatOpenAI

    llm = ChatOpenAI(
        model=MODEL,
        api_key=_get_api_key(),
        base_url=BASE_URL,
        max_tokens=8192,
        timeout=90,
        streaming=True,
        max_retries=0,  # CRITICAL: Do not retry streaming, otherwise it restarts the text output!
        default_headers={
            "HTTP-Referer": "http://localhost:3000",
            "X-Title": "Lumen AI",
        }
    )
    logger.info("LLM initialised: %s (streaming=True)", MODEL)
    return llm


def get_evaluator_llm():
    """
    Returns an LLM instance configured for the evaluator/judge node.
    """
    return get_llm(
        max_tokens=8192, # Increased from 1024 to prevent RAGAS LLMDidNotFinishException
        timeout=60,
        streaming=False,
    )


def get_orchestrator_llm():
    """
    Returns an LLM instance for the orchestrator node.
    Needs reliable JSON output for task decomposition.
    """
    return get_llm(
        max_tokens=4096,
        timeout=60,
        streaming=False,
    )
