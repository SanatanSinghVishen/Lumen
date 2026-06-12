import os
import logging

logger = logging.getLogger("lumen")

def init_langsmith() -> bool:
    """
    Attempts to enable LangSmith tracing.
    Returns True if successfully enabled, False if disabled or failed.
    Never raises — always degrades silently.
    """
    try:
        api_key = os.getenv("LANGCHAIN_API_KEY", "").strip()
        tracing = os.getenv("LANGCHAIN_TRACING_V2", "false").lower()

        if not api_key or tracing != "true":
            logger.info("LangSmith: disabled (no API key or tracing off)")
            os.environ["LANGCHAIN_TRACING_V2"] = "false"
            return False

        # Validate the key is reachable before committing
        from langsmith import Client
        client = Client(api_key=api_key)
        client.list_projects(limit=1)  # lightweight auth check

        os.environ["LANGCHAIN_TRACING_V2"] = "true"
        os.environ["LANGCHAIN_API_KEY"]     = api_key
        os.environ["LANGCHAIN_PROJECT"]     = os.getenv("LANGCHAIN_PROJECT", "lumen-research-agent")
        logger.info("LangSmith: tracing enabled → project '%s'", os.getenv("LANGCHAIN_PROJECT"))
        return True

    except Exception as e:
        # Covers: 401 Unauthorized, 403 Forbidden, network errors,
        # rate limits, import errors, any LangSmith SDK exception
        logger.warning("LangSmith: disabled due to error — %s", str(e))
        os.environ["LANGCHAIN_TRACING_V2"] = "false"
        return False

# Call once at startup — before any LangGraph imports
LANGSMITH_ENABLED = init_langsmith()

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from api.routes import router

limiter = Limiter(key_func=get_remote_address)
app = FastAPI(title="LUMEN Multi-Agent AI", description="Autonomous Research Agent with HITL")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.include_router(router)

@app.get("/health")
async def health():
    return {
        "status": "ok",
        "langsmith_tracing": LANGSMITH_ENABLED,
        "checkpointer": "MemorySaver",
        "version": "1.0.0"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
