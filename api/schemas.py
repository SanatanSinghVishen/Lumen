from pydantic import BaseModel
from typing import Optional, Literal

class QueryRequest(BaseModel):
    query: str

class QueryResponse(BaseModel):
    thread_id: str
    status: str

class ReviewResponse(BaseModel):
    draft_report: str
    eval_score: float
    thread_id: str

class ApproveRequest(BaseModel):
    action: Literal["approve", "edit", "reject"]
    edits: Optional[str] = None
    notes: Optional[str] = None
