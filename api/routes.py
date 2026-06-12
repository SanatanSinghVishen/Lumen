import uuid
from fastapi import APIRouter, HTTPException, BackgroundTasks, Request
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

    Event types emitted:
      - "status"   : pipeline stage updates (e.g. "Searching the web...")
      - "token"    : individual LLM tokens from the synthesis node
      - "scores"   : eval scores once the evaluator node completes
      - "hitl"     : signals the graph has paused for human review
      - "error"    : any pipeline error
      - "done"     : graph has reached END
    """
    from main import app_graph
    import logging
    logger = logging.getLogger("lumen")
    
    config = {"configurable": {"thread_id": thread_id}}

    async def event_generator():
        try:
            async for event in app_graph.astream_events(
                None,           # input is None because graph is already running
                config=config,
                version="v2",   # use v2 event schema
            ):
                # Check client disconnected
                if await request.is_disconnected():
                    break

                kind  = event.get("event")
                name  = event.get("name", "")
                data  = event.get("data", {})

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
                elif kind == "on_chat_model_stream" and "synthesis" in name.lower():
                    chunk = data.get("chunk")
                    if chunk and hasattr(chunk, "content") and chunk.content:
                        yield {
                            "event": "token",
                            "data": json.dumps({"token": chunk.content})
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

            yield {"event": "done", "data": json.dumps({"thread_id": thread_id})}

        except Exception as e:
            logger.error("Stream error for thread %s: %s", thread_id, str(e))
            yield {
                "event": "error",
                "data": json.dumps({"message": str(e)})
            }

    return EventSourceResponse(event_generator())
