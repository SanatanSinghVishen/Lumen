import uuid
from fastapi import APIRouter, HTTPException, BackgroundTasks, Request, UploadFile, File
from sse_starlette.sse import EventSourceResponse
import asyncio
import json
import magic
from threading import Lock as ThreadLock
from slowapi.util import get_remote_address
from slowapi import Limiter

from api.schemas import QueryRequest, QueryResponse, ReviewResponse, ApproveRequest
from cost_guard import check_query, check_upload

# Instantiate limiter here to avoid circular imports, main.py will import it and attach to app
limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["200/hour"],
)

router = APIRouter()

# ── Duplicate Request Prevention ──────────────────────────────────────────

_active_ips: set[str] = set()
_active_lock = ThreadLock()

def acquire_slot(ip: str) -> bool:
    with _active_lock:
        if ip in _active_ips:
            return False
        _active_ips.add(ip)
        return True

def release_slot(ip: str):
    with _active_lock:
        _active_ips.discard(ip)


# ── Routes ──────────────────────────────────────────────────────────────

# Changed endpoint from /query to /research based on instructions, but frontend might use /query.
# Let's map /research as requested by the user, and I will update LandingPage to use /research.
@router.post("/research", response_model=QueryResponse)
@limiter.limit("3/10minute")
async def run_research(request: Request, body: QueryRequest, background_tasks: BackgroundTasks):
    client_ip = get_remote_address(request)

    # Cost guard
    guard = check_query()
    if not guard["allowed"]:
        raise HTTPException(
            status_code=503,
            detail={
                "error":     guard["reason"],
                "message":   "LUMEN has reached its daily research limit. "
                             "This keeps the demo free for everyone. "
                             "Please try again tomorrow or run it locally.",
                "resets_at": guard.get("resets_at", "Midnight UTC"),
                "github":    "https://github.com/SanatanSinghVishen/Lumen",
            }
        )

    # Duplicate prevention
    if not acquire_slot(client_ip):
        raise HTTPException(
            status_code=429,
            detail={
                "error":   "query_in_flight",
                "message": "You already have a research query running. "
                           "Please wait for it to complete.",
            }
        )

    thread_id = str(uuid.uuid4())
    config    = {"configurable": {"thread_id": thread_id}}

    async def run_and_release():
        try:
            from main import app_graph
            # Write the query to the thread state without starting execution
            await app_graph.aupdate_state(config, {"query": body.query})
        finally:
            release_slot(client_ip)  # always release — even on crash

    background_tasks.add_task(run_and_release)
    return {"thread_id": thread_id, "status": "running"}


@router.get("/review/{thread_id}")
@limiter.limit("60/minute")
async def get_review(request: Request, thread_id: str):
    from main import app_graph
    config = {"configurable": {"thread_id": thread_id}}
    state = await app_graph.aget_state(config)
    
    if not state.values:
        return {
            "thread_id": thread_id,
            "status": "running"
        }
    
    next_node = state.next
    if next_node and "hitl" in next_node:
        status = "awaiting_review"
    elif not next_node and state.values:
        status = "complete"
    else:
        status = "running"
        
    return {
        "thread_id":         thread_id,
        "status":            status,
        "draft_report":      state.values.get("draft_report", state.values.get("merged_context", "")),
        "final_report":      state.values.get("final_report", state.values.get("draft_report", "")),
        "eval_score":        state.values.get("eval_score", 0.0),
        "retry_count":       state.values.get("retry_count", 0),
        "faithfulness":      state.values.get("faithfulness"),
        "answer_relevancy":  state.values.get("answer_relevancy"),
        "context_precision": state.values.get("context_precision"),
        "ragas_error":       state.values.get("ragas_error"),
        "web_results":       state.values.get("web_results", []),
    }


async def resume_graph(thread_id: str, command_payload: dict):
    from main import app_graph
    config = {"configurable": {"thread_id": thread_id}}
    try:
        from langgraph.types import Command
        await app_graph.ainvoke(Command(resume=command_payload), config=config)
    except Exception as e:
        import traceback
        traceback.print_exc()

@router.post("/approve/{thread_id}")
@limiter.limit("10/10minute")
async def approve(request: Request, thread_id: str, body: ApproveRequest, background_tasks: BackgroundTasks):
    command_payload = {
        "action": body.action,
        "edits": body.edits,
        "notes": body.notes
    }
    
    background_tasks.add_task(resume_graph, thread_id, command_payload)

    return {"status": "Resumed graph execution", "action": body.action}

@router.get("/stream/{thread_id}")
@limiter.limit("20/minute")
async def stream_thread(request: Request, thread_id: str):
    """
    Streams LangGraph node events for a given thread as SSE.
    """
    from main import app_graph
    import logging
    import json
    
    logger = logging.getLogger("lumen")
    config = {"configurable": {"thread_id": thread_id}}

    async def event_generator():
        try:
            async for event in app_graph.astream_events(
                None,
                config=config,
                version="v2",
            ):
                if await request.is_disconnected():
                    break

                kind  = event.get("event", "")
                name  = event.get("name", "")
                data  = event.get("data", {})

                if kind == "on_chain_start":
                    status_map = {
                        "orchestrator":  "Decomposing your query...",
                        "web_search":    "Searching the web...",
                        "rag_retrieval": "Retrieving from documents...",
                        "synthesis":     "Writing the report...",
                        "ragas_eval":    "Scoring with RAGAS...",
                        "evaluator":     "Evaluating quality...",
                        "hitl":          "Waiting for your approval...",
                    }
                    if name in status_map:
                        yield {
                            "event": "status",
                            "data": json.dumps({"node": name, "message": status_map[name]})
                        }

                elif kind == "on_chat_model_stream" and "synthesis_llm" in event.get("tags", []):
                    chunk = data.get("chunk")
                    if chunk and hasattr(chunk, "content") and chunk.content:
                        yield {
                            "event": "token",
                            "data": json.dumps({"token": chunk.content})
                        }

                elif kind == "on_chain_end" and name == "evaluator":
                    output = data.get("output", {})
                    if output:
                        yield {
                            "event": "scores",
                            "data": json.dumps({
                                "eval_score":       output.get("eval_score"),
                                "faithfulness":     output.get("faithfulness"),
                                "answer_relevancy": output.get("answer_relevancy"),
                                "context_precision":output.get("context_precision"),
                            })
                        }

                if kind == "on_chain_start" and name == "hitl":
                    yield {
                        "event": "hitl",
                        "data": json.dumps({"thread_id": thread_id})
                    }
                    break

            yield {"event": "done", "data": json.dumps({"thread_id": thread_id})}

        except Exception as e:
            yield {"event": "error", "data": json.dumps({"message": str(e)})}

    return EventSourceResponse(event_generator())


# ── RAG Document Management ─────────────────────────────────────────────────

ALLOWED_MIME_TYPES = {
    "application/pdf",
    "text/plain",
    "text/markdown",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
}

MAX_FILE_SIZE_MB  = 10     # 10MB per file
MAX_FILE_SIZE     = MAX_FILE_SIZE_MB * 1024 * 1024
MAX_FILES_PER_REQ = 3      # max 3 files per upload request

@router.post("/upload")
@limiter.limit("5/10minute")
async def upload_documents(
    request:  Request,
    file:    UploadFile = File(...), # Changed files to file to match existing frontend code, but still enforcing limits
):
    # Support both single `file` and multiple `files` if needed, but frontend sends single `file`.
    files = [file]
    
    # Cost guard
    guard = check_upload()
    if not guard["allowed"]:
        raise HTTPException(status_code=503, detail={"error": "daily_upload_limit_reached"})

    # File count limit
    if len(files) > MAX_FILES_PER_REQ:
        raise HTTPException(
            status_code=400,
            detail={
                "error":   "too_many_files",
                "message": f"Maximum {MAX_FILES_PER_REQ} files per upload.",
            }
        )

    validated_files = []
    for f in files:
        content = await f.read()

        if len(content) > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=400,
                detail={
                    "error":   "file_too_large",
                    "message": f"'{f.filename}' exceeds {MAX_FILE_SIZE_MB}MB limit.",
                }
            )

        detected_mime = magic.from_buffer(content, mime=True)
        if detected_mime not in ALLOWED_MIME_TYPES and not detected_mime.startswith("text/csv"):
            # Allow text/csv as well since previous code supported CSV
            if detected_mime != "text/csv":
                raise HTTPException(
                    status_code=400,
                    detail={
                        "error":   "invalid_file_type",
                        "message": f"'{f.filename}' is not a supported file type. "
                                   f"Supported: PDF, TXT, MD, DOCX, CSV.",
                    }
                )

        validated_files.append((f.filename, content))

    # Existing embedding/ChromaDB logic
    from tools.vector_retrieval import ingest_file
    
    filename, content_bytes = validated_files[0]
    if filename.lower().endswith(".pdf"):
        try:
            from pypdf import PdfReader
            import io
            reader = PdfReader(io.BytesIO(content_bytes))
            text = "\n\n".join(page.extract_text() or "" for page in reader.pages)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Failed to parse PDF: {str(e)}")
    else:
        text = content_bytes.decode("utf-8", errors="replace")

    if not text.strip():
        raise HTTPException(status_code=400, detail="File is empty or could not be parsed.")

    result = ingest_file(filename, text)
    return result


@router.get("/documents")
async def list_documents():
    from tools.vector_retrieval import list_documents as _list_docs
    return {"documents": _list_docs(), "total": len(_list_docs())}


@router.delete("/documents")
async def clear_documents():
    from tools.vector_retrieval import delete_collection
    delete_collection()
    return {"status": "cleared"}
