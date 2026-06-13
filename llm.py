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

def get_llm(temperature=0.1, max_tokens=4096, timeout=45, streaming=False):
    from langchain_openai import ChatOpenAI  # OpenRouter uses OpenAI-compatible API
    
    llm = ChatOpenAI(
        model=MODEL,
        openai_api_key=_get_api_key(),
        openai_api_base=BASE_URL,
        temperature=temperature,
        max_tokens=max_tokens,
        timeout=timeout,
        max_retries=1 if not streaming else 0, # DO NOT retry streaming
        streaming=streaming,
        default_headers={
            "HTTP-Referer":  "https://lumen-frontend-one.vercel.app",
            "X-Title":       "LUMEN Research Agent",
        }
    )
    logger.info("LLM initialised: %s (streaming=%s, timeout=%s)", MODEL, streaming, timeout)
    return llm

def get_orchestrator_llm():
    return get_llm(temperature=0.0, max_tokens=1024, timeout=20)
    # Short timeout — orchestrator only outputs JSON task lists

def get_streaming_llm():
    return get_llm(temperature=0.2, max_tokens=6000, timeout=90, streaming=True)
    # Longer timeout for synthesis — streaming long reports takes time
    # But still bounded — prevents infinite hang

def get_evaluator_llm():
    return get_llm(temperature=0.0, max_tokens=8192, timeout=90)
    # RAGAS context windows are large and generation can take 30-60s.
