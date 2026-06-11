import uuid
from fastapi import APIRouter, HTTPException
from api.schemas import QueryRequest, QueryResponse, ReviewResponse, ApproveRequest
from graph.graph import app_graph
from langchain_core.runnables import RunnableConfig

router = APIRouter()

@router.post("/query", response_model=QueryResponse)
async def submit_query(request: QueryRequest):
    thread_id = str(uuid.uuid4())
    config = {"configurable": {"thread_id": thread_id}}
    
    # We use stream or invoke to start it.
    # In a real app we might run this in a background task. For now, invoke runs until interrupt.
    try:
        app_graph.invoke({"query": request.query}, config=config)
    except Exception as e:
        pass # Ignore exceptions from interrupt or graph execution for this basic implementation

    return {"thread_id": thread_id, "status": "processing_or_paused"}

@router.get("/review/{thread_id}", response_model=ReviewResponse)
async def get_review(thread_id: str):
    config = {"configurable": {"thread_id": thread_id}}
    state = app_graph.get_state(config)
    
    if not state.values:
        raise HTTPException(status_code=404, detail="Thread not found")
        
    return {
        "thread_id": thread_id,
        "draft_report": state.values.get("draft_report", state.values.get("merged_context", "")),
        "eval_score": state.values.get("eval_score", 0.0)
    }

@router.post("/approve/{thread_id}")
async def approve_draft(thread_id: str, request: ApproveRequest):
    config = {"configurable": {"thread_id": thread_id}}
    
    command_payload = {
        "action": request.action,
        "edits": request.edits,
        "notes": request.notes
    }
    
    try:
        from langgraph.types import Command
        app_graph.invoke(Command(resume=command_payload), config=config)
    except Exception as e:
        pass

    return {"status": "Resumed graph execution", "action": request.action}
