from pydantic import BaseModel, Field, field_validator
from typing import Optional, Literal
import re

# Known prompt injection patterns — expand as needed
INJECTION_PATTERNS = [
    r"ignore\s+(previous|all|prior)\s+instructions",
    r"disregard\s+your\s+instructions",
    r"you\s+are\s+now\s+",
    r"act\s+as\s+(a\s+)?(?!researcher|assistant)",  # allows "act as a researcher"
    r"jailbreak",
    r"dan\s+mode",
    r"system\s+prompt",
    r"<\|im_start\|>",
    r"<\|im_end\|>",
    r"\[INST\]",
    r"<<SYS>>",
    r"</s>",
    r"\[system\]",
    r"###\s*instruction",
]

COMPILED_PATTERNS = [re.compile(p, re.IGNORECASE) for p in INJECTION_PATTERNS]


class QueryRequest(BaseModel):
    query: str = Field(
        ...,
        min_length=10,
        max_length=500,
    )

    @field_validator("query")
    @classmethod
    def validate_query(cls, v: str) -> str:
        v = v.strip()

        # Must contain at least one real word
        if not any(c.isalpha() for c in v):
            raise ValueError("Query must contain at least one word.")

        # Must not be all the same character repeated
        if len(set(v.replace(" ", ""))) < 3:
            raise ValueError("Query is too repetitive.")

        # Prompt injection check
        for pattern in COMPILED_PATTERNS:
            if pattern.search(v):
                raise ValueError(
                    "Query contains disallowed content. "
                    "Please enter a genuine research topic."
                )

        return v


class QueryResponse(BaseModel):
    thread_id: str
    status: str


class ReviewResponse(BaseModel):
    draft_report: str
    eval_score: float
    thread_id: str


class ApproveRequest(BaseModel):
    action: str = Field(..., pattern="^(approve|retry|edit|reject)$")
    edits: Optional[str] = None
    notes: str = Field(
        default="",
        max_length=1000,
    )

    @field_validator("notes")
    @classmethod
    def validate_notes(cls, v: str) -> str:
        if not v:
            return v
        v = v.strip()
        for pattern in COMPILED_PATTERNS:
            if pattern.search(v):
                raise ValueError("Notes contain disallowed content.")
        return v


class UploadRequest(BaseModel):
    # File size validated separately in the endpoint
    pass
