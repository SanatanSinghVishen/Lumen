import os

# ── AGGRESSIVE MEMORY OPTIMIZATION FOR 512MB RENDER LIMIT ────────────────
os.environ["OMP_NUM_THREADS"] = "1"
os.environ["OPENBLAS_NUM_THREADS"] = "1"
os.environ["MKL_NUM_THREADS"] = "1"
os.environ["VECLIB_MAXIMUM_THREADS"] = "1"
os.environ["NUMEXPR_NUM_THREADS"] = "1"
os.environ["TOKENIZERS_PARALLELISM"] = "false"
# Force PyArrow (used by datasets/ragas) to use system allocator instead of hoarding a memory pool
os.environ["ARROW_DEFAULT_MEMORY_POOL"] = "system"

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
            # AsyncPostgresSaver.from_conn_string returns an async context manager
            async with AsyncPostgresSaver.from_conn_string(postgres_url) as cp:
                checkpointer = cp
                await checkpointer.setup()   # creates the checkpoint tables if they don't exist
                logger.info("Checkpointer: AsyncPostgresSaver connected to Supabase")
                
                app_graph = build_graph(checkpointer)
                logger.info("LangGraph: graph compiled with %s", type(checkpointer).__name__)
                
                yield  # app runs here
                
                logger.info("Checkpointer: Postgres connection closed")
            return  # Lifespan completed successfully with Postgres
        except Exception as e:
            logger.warning("Checkpointer: Postgres failed (%s) — falling back to MemorySaver", e)
            
    # Fallback path if no Postgres URL or if connection failed
    logger.info("Checkpointer: Using MemorySaver")
    from langgraph.checkpoint.memory import MemorySaver
    checkpointer = MemorySaver()
    app_graph = build_graph(checkpointer)
    logger.info("LangGraph: graph compiled with %s", type(checkpointer).__name__)

    yield  # app runs here

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from starlette.middleware.base import BaseHTTPMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from api.routes import router
from cost_guard import get_status as get_cost_status

# ── API Abuse Protection Setup ───────────────────────────────────────────

limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["200/hour"],
)

app = FastAPI(title="LUMEN Multi-Agent AI", description="Autonomous Research Agent with HITL", lifespan=lifespan)
app.state.limiter = limiter

@app.exception_handler(RateLimitExceeded)
async def rate_limit_handler(request: Request, exc: RateLimitExceeded):
    return JSONResponse(
        status_code=429,
        content={
            "error":   "rate_limit_exceeded",
            "message": "You're going too fast. Please wait a moment and try again.",
            "retry_after_seconds": 60,
        }
    )

@app.exception_handler(RequestValidationError)
async def validation_error_handler(request: Request, exc: RequestValidationError):
    errors = exc.errors()
    first_error = errors[0] if errors else {}
    return JSONResponse(
        status_code=422,
        content={
            "error":   "invalid_input",
            "message": first_error.get("msg", "Invalid input."),
            "field":   ".".join(str(x) for x in first_error.get("loc", [])),
        }
    )

# ── Security Headers ─────────────────────────────────────────────────────

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"]  = "nosniff"
        response.headers["X-Frame-Options"]         = "DENY"
        response.headers["X-XSS-Protection"]        = "1; mode=block"
        response.headers["Referrer-Policy"]         = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"]      = "geolocation=(), microphone=(), camera=()"
        return response

app.add_middleware(SecurityHeadersMiddleware)

# ── CORS Lockdown ────────────────────────────────────────────────────────

ALLOWED_ORIGINS = [
    "http://localhost:5173",   # Vite dev
    "http://localhost:3000",   # Docker dev
    os.getenv("FRONTEND_URL", ""),  # production Vercel URL
]

# Remove empty strings from the list
ALLOWED_ORIGINS = [o for o in ALLOWED_ORIGINS if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Accept"],
)

app.include_router(router)

@app.get("/health")
@limiter.limit("30/minute")
async def health(request: Request):
    cost = get_cost_status()
    return {
        "status":          "ok",
        "llm_provider":    "openrouter",
        "llm_model":       "google/gemini-2.5-flash",
        "checkpointer":    type(checkpointer).__name__,
        "langsmith_tracing": LANGSMITH_ENABLED,
        "cors_origins":    ALLOWED_ORIGINS,
        "cost_guard": {
            "queries_today":     cost["queries_today"],
            "query_limit":       cost["query_limit"],
            "queries_remaining": cost["queries_remaining"],
            "uploads_today":     cost["uploads_today"],
            "upload_limit":      cost["upload_limit"],
        },
        "version": "1.0.0"
    }

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
