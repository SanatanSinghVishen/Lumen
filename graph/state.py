from typing import List, Dict, Any, Literal, Optional
from typing_extensions import TypedDict

class AgentState(TypedDict):
    query: str
    sub_tasks: List[str]
    web_results: List[Dict[str, Any]]
    rag_results: List[Dict[str, Any]]
    merged_context: str
    draft_report: str
    eval_score: float
    eval_feedback: str
    retry_count: int
    hitl_status: Literal["pending", "approved", "edited", "rejected"]
    human_edits: str
    final_report: str
    thread_id: str
    
    # RAGAS fields
    faithfulness: Optional[float]
    answer_relevancy: Optional[float]
    context_precision: Optional[float]
    ragas_error: Optional[str]
