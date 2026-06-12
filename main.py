import os
import logging
from contextlib import asynccontextmanager
from graph.graph import build_graph

logger = logging.getLogger("lumen")

# Enforce LangSmith Tracing
LANGSMITH_ENABLED = os.environ.get("LANGCHAIN_TRACING_V2", "false").lower() == "true"
os.environ["LANGCHAIN_TRACING_V2"] = "true" if LANGSMITH_ENABLED else "false"
os.environ["LANGCHAIN_API_KEY"] = os.getenv("LANGCHAIN_API_KEY", "")
os.environ["LANGCHAIN_PROJECT"] = os.getenv("LANGCHAIN_PROJECT", "lumen-research-agent")

# ── Checkpointer ──────────────────────────────────────────────────────────
checkpointer = None  # set during lifespan
app_graph = None

@asynccontextmanager
async def lifespan(app):
    """
    Initialises the AsyncPostgresSaver on startup.
    Falls back to MemorySaver if POSTGRES_URL is missing or
    the connection fails — so local dev still works without a DB.
    """
    global checkpointer, app_graph
    postgres_url = os.getenv("POSTGRES_URL", "").strip()
    
    if postgres_url:
        try:
            from langgraph.checkpoint.postgres.aio import AsyncPostgresSaver
            checkpointer = AsyncPostgresSaver.from_conn_string(postgres_url)
            await checkpointer.setup()   # creates the checkpoint tables if they don't exist
            logger.info("Checkpointer: AsyncPostgresSaver connected to Supabase")
        except Exception as e:
            logger.warning("Checkpointer: Postgres failed (%s) — falling back to MemorySaver", e)
            from langgraph.checkpoint.memory import MemorySaver
            checkpointer = MemorySaver()
    else:
        logger.info("Checkpointer: FORCED MemorySaver for debugging")
        from langgraph.checkpoint.memory import MemorySaver
        checkpointer = MemorySaver()

    # Recompile the graph with the chosen checkpointer
    app_graph = build_graph(checkpointer)
    logger.info("LangGraph: graph compiled with %s", type(checkpointer).__name__)

    yield  # app runs here

    # Cleanup on shutdown
    if hasattr(checkpointer, "conn") and checkpointer.conn:
        await checkpointer.conn.close()
        logger.info("Checkpointer: Postgres connection closed")

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from api.routes import router

limiter = Limiter(key_func=get_remote_address)
app = FastAPI(title="LUMEN Multi-Agent AI", description="Autonomous Research Agent with HITL", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",        # Vite dev server
        os.getenv("FRONTEND_URL", "").rstrip("/"),  # injected at runtime from Render env vars
    ],
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
        "checkpointer": type(checkpointer).__name__,
        "langsmith_tracing": LANGSMITH_ENABLED,
        "cors_origin": os.getenv("FRONTEND_URL", "not set"),
        "version": "1.0.0"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
