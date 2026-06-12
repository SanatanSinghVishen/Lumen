from langgraph.types import interrupt
from graph.state import AgentState

async def hitl_node(state: AgentState) -> dict:
    draft = state.get("draft_report", state.get("merged_context", ""))
    score = state.get("eval_score", 0.0)
    
    # Pause the graph and wait for human review
    # The return value of interrupt() is what the human provides upon resume
    human_response = interrupt({
        "draft": draft,
        "score": score
    })
    
    # Process human response
    action = human_response.get("action")
    if action == "approve":
        return {"hitl_status": "approved", "final_report": draft}
    elif action == "edit":
        edits = human_response.get("edits", draft)
        return {"hitl_status": "edited", "final_report": edits, "human_edits": edits}
    elif action == "reject":
        notes = human_response.get("notes", "")
        return {"hitl_status": "rejected", "eval_feedback": notes, "retry_count": state.get("retry_count", 0) + 1}
    
    return {"hitl_status": "pending"}
