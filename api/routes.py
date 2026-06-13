import uuid
from fastapi import APIRouter, HTTPException, BackgroundTasks, Request, UploadFile, File
from sse_starlette.sse import EventSourceResponse
import asyncio
import json
from api.schemas import QueryRequest, QueryResponse, ReviewResponse, ApproveRequest

router = APIRouter()

@router.post("/query", response_model=QueryResponse)
async def submit_query(request: QueryRequest):
    thread_id = str(uuid.uuid4())
    from main import app_graph
    config = {"configurable": {"thread_id": thread_id}}
    
    # Write the query to the thread state without starting execution
    await app_graph.aupdate_state(config, {"query": request.query})
    
    return {"thread_id": thread_id, "status": "running"}

@router.get("/review/{thread_id}")
async def get_review(thread_id: str):
    from main import app_graph
    config = {"configurable": {"thread_id": thread_id}}
    state = await app_graph.aget_state(config)
    
    # Check if thread exists in checkpointer
    if not state.values:
        # If it doesn't exist, it might still be initializing or running without saving first checkpoint
        # However, ainvoke might take time to hit the first checkpoint.
        # But per requirements, return "running" if thread exists but no HITL interrupt.
        # If state.values is empty, we assume it's running.
        return {
            "thread_id": thread_id,
            "status": "running"
        }
    
    # Check if we have hit the HITL interrupt
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
async def approve_draft(thread_id: str, request: ApproveRequest, background_tasks: BackgroundTasks):
    command_payload = {
        "action": request.action,
        "edits": request.edits,
        "notes": request.notes
    }
    
    background_tasks.add_task(resume_graph, thread_id, command_payload)

    return {"status": "Resumed graph execution", "action": request.action}

@router.get("/stream/{thread_id}")
async def stream_thread(thread_id: str, request: Request):
    """
    Streams LangGraph node events for a given thread as SSE.
    """
    from main import app_graph
    import logging
    import json
    
    logger = logging.getLogger("lumen")
    diag_logger = logging.getLogger("lumen.stream_diag")
    diag_logger.setLevel(logging.DEBUG)
    sse_logger = logging.getLogger("lumen.sse_wire")
    sse_logger.setLevel(logging.DEBUG)
    
    config = {"configurable": {"thread_id": thread_id}}

    async def event_generator():
        event_count = 0
        _chunk_inspection_count = 0
        
        try:
            async for event in app_graph.astream_events(
                None,           # input is None because graph is already running
                config=config,
                version="v2",   # use v2 event schema
            ):
                event_count += 1
                if await request.is_disconnected():
                    break

                kind  = event.get("event", "")
                name  = event.get("name", "")
                data  = event.get("data", {})

                # ── DIAGNOSTIC: Chunk Inspection ───────────────────────────
                if kind == "on_chat_model_stream":
                    chunk = data.get("chunk")
                    if chunk:
                        content = getattr(chunk, "content", None)
                        
                        # Log raw event lengths
                        diag_logger.debug(
                            "EVENT #%d | kind=%s | name=%s | content_type=%s | content_len=%s | content_repr=%r",
                            event_count, kind, name, type(content).__name__,
                            len(content) if isinstance(content, str) else "N/A",
                            content[:80] if isinstance(content, str) else content,
                        )
                        
                        # Deep inspect first 3 chunks
                        if _chunk_inspection_count < 3:
                            _chunk_inspection_count += 1
                            diag_logger.debug(
                                "CHUNK INSPECTION #%d:\n"
                                "  type(chunk)         = %s\n"
                                "  chunk.__dict__      = %s\n"
                                "  chunk.content       = %r\n"
                                "  type(chunk.content) = %s\n"
                                "  chunk.content is list? %s\n"
                                "  full event keys     = %s",
                                _chunk_inspection_count,
                                type(chunk).__name__,
                                getattr(chunk, "__dict__", "no __dict__"),
                                getattr(chunk, "content", "NO CONTENT ATTR"),
                                type(getattr(chunk, "content", None)).__name__,
                                isinstance(getattr(chunk, "content", None), list),
                                list(event.keys()),
                            )

                # ── Node started — emit status update ──────────────────
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
                            "data": json.dumps({
                                "node":    name,
                                "message": status_map[name]
                            })
                        }

                # ── LLM token from synthesis node ──────────────────────
                elif kind == "on_chat_model_stream" and "synthesis_llm" in event.get("tags", []):
                    chunk = data.get("chunk")
                    if chunk and hasattr(chunk, "content") and chunk.content:
                        token_payload = json.dumps({"token": chunk.content})
                        sse_logger.debug(
                            "SSE YIELD | event=token | payload_len=%d | payload=%r",
                            len(token_payload),
                            token_payload[:120],
                        )
                        yield {
                            "event": "token",
                            "data": token_payload
                        }

                # ── Evaluator node finished — emit all scores ──────────
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

                # ── HITL node reached — graph paused ───────────────────
                if kind == "on_chain_start" and name == "hitl":
                    yield {
                        "event": "hitl",
                        "data": json.dumps({"thread_id": thread_id})
                    }
                    break   # stop streaming — user must now review

            diag_logger.debug("Stream complete — total events processed: %d", event_count)
            yield {"event": "done", "data": json.dumps({"thread_id": thread_id})}

        except Exception as e:
            logger.error("Stream error for thread %s: %s", thread_id, str(e))
            yield {
                "event": "error",
                "data": json.dumps({"message": str(e)})
            }

    return EventSourceResponse(event_generator())


# ── RAG Document Management ─────────────────────────────────────────────────

@router.post("/upload")
async def upload_document(file: UploadFile = File(...)):
    """
    Upload a document (PDF, TXT, MD, CSV) to the RAG vector store.
    The file is chunked, embedded, and stored in ChromaDB.
    Re-uploading the same filename replaces the old chunks.
    """
    from tools.vector_retrieval import ingest_file

    filename = file.filename
    content_bytes = await file.read()

    # Parse based on file type
    if filename.lower().endswith(".pdf"):
        try:
            from pypdf import PdfReader
            import io
            reader = PdfReader(io.BytesIO(content_bytes))
            text = "\n\n".join(page.extract_text() or "" for page in reader.pages)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Failed to parse PDF: {str(e)}")
    elif filename.lower().endswith((".txt", ".md", ".csv")):
        text = content_bytes.decode("utf-8", errors="replace")
    else:
        raise HTTPException(
            status_code=400,
            detail="Unsupported file type. Upload .txt, .md, .csv, or .pdf files."
        )

    if not text.strip():
        raise HTTPException(status_code=400, detail="File is empty or could not be parsed.")

    result = ingest_file(filename, text)
    return result


@router.get("/documents")
async def list_documents():
    """List all documents currently stored in the RAG vector store."""
    from tools.vector_retrieval import list_documents as _list_docs
    return {"documents": _list_docs(), "total": len(_list_docs())}


@router.delete("/documents")
async def clear_documents():
    """Delete all documents from the RAG vector store."""
    from tools.vector_retrieval import delete_collection
    delete_collection()
    return {"status": "cleared"}
