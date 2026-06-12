import uuid
from fastapi import APIRouter, HTTPException, BackgroundTasks
from api.schemas import QueryRequest, QueryResponse, ReviewResponse, ApproveRequest
from graph.graph import app_graph

router = APIRouter()

def run_graph(thread_id: str, query: str):
    config = {"configurable": {"thread_id": thread_id}}
    try:
        app_graph.invoke({"query": query}, config=config)
    except Exception as e:
        import traceback
        traceback.print_exc()

@router.post("/query", response_model=QueryResponse)
async def submit_query(request: QueryRequest, background_tasks: BackgroundTasks):
    thread_id = str(uuid.uuid4())
    background_tasks.add_task(run_graph, thread_id, request.query)
    return {"thread_id": thread_id, "status": "running"}

@router.get("/review/{thread_id}")
async def get_review(thread_id: str):
    config = {"configurable": {"thread_id": thread_id}}
    state = app_graph.get_state(config)
    
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
        return {
            "thread_id": thread_id,
            "status": "awaiting_review",
            "draft_report": state.values.get("draft_report", state.values.get("merged_context", "")),
            "eval_score": state.values.get("eval_score", 0.0),
            "retry_count": state.values.get("retry_count", 0)
        }
    
    # If there are no next nodes and it has values, it's completed
    if not next_node and state.values:
        return {
            "thread_id": thread_id,
            "status": "complete",
            "final_report": state.values.get("final_report", state.values.get("draft_report", "")),
            "draft_report": state.values.get("draft_report", ""),
            "eval_score": state.values.get("eval_score", 0.0)
        }
        
    return {
        "thread_id": thread_id,
        "status": "running"
    }

def resume_graph(thread_id: str, command_payload: dict):
    config = {"configurable": {"thread_id": thread_id}}
    try:
        from langgraph.types import Command
        app_graph.invoke(Command(resume=command_payload), config=config)
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
