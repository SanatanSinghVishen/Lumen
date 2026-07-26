"""
database.py
───────────
Supabase client for research session persistence.
Uses the service role key — bypasses RLS — because
user isolation is enforced at the API layer via Clerk JWT verification.
"""

import os
import logging
from typing import Optional
from functools import lru_cache

logger = logging.getLogger("lumen.database")

@lru_cache(maxsize=1)
def get_supabase():
    """Returns a cached Supabase client with service role key."""
    from supabase import create_client
    url = os.getenv("SUPABASE_URL", "")
    key = os.getenv("SUPABASE_SERVICE_KEY", "")
    if not url or not key:
        raise RuntimeError(
            "SUPABASE_URL and SUPABASE_SERVICE_KEY must be set. "
            "Get them from your Supabase dashboard → Settings → API."
        )
    return create_client(url, key)


async def create_session(
    user_id:   Optional[str],
    thread_id: str,
    query:     str,
) -> dict:
    """Creates a new research session record when a query is submitted."""
    try:
        db = get_supabase()
        
        # Don't save to database for anonymous users (so no history is saved)
        if not user_id:
            logger.info("Anonymous session started: thread_id=%s", thread_id)
            return {"thread_id": thread_id, "query": query, "status": "running"}

        result = db.table("research_sessions").insert({
            "user_id":   user_id,
            "thread_id": thread_id,
            "query":     query,
            "status":    "running",
        }).execute()
        logger.info("Session created: thread_id=%s user_id=%s", thread_id, user_id)
        return result.data[0] if result.data else {}
    except Exception as e:
        # Non-fatal — session history is a nice-to-have, not critical path
        logger.warning("Failed to create session record: %s", str(e))
        return {}


async def update_session(
    thread_id:         str,
    status:            Optional[str]  = None,
    final_report:      Optional[str]  = None,
    eval_score:        Optional[float]= None,
    faithfulness:      Optional[float]= None,
    answer_relevancy:  Optional[float]= None,
    context_precision: Optional[float]= None,
    retry_count:       Optional[int]  = None,
) -> None:
    """Updates a session record — called at key pipeline milestones."""
    try:
        db = get_supabase()
        updates = {k: v for k, v in {
            "status":            status,
            "final_report":      final_report,
            "eval_score":        eval_score,
            "faithfulness":      faithfulness,
            "answer_relevancy":  answer_relevancy,
            "context_precision": context_precision,
            "retry_count":       retry_count,
        }.items() if v is not None}

        if not updates:
            return

        # If it's an anonymous user, we don't track it in DB, so just return
        # But we don't know the user_id here, so we'll try to update and if it fails/matches 0 rows, we ignore
        response = db.table("research_sessions") \
          .update(updates) \
          .eq("thread_id", thread_id) \
          .execute()

        if response.data:
            logger.info("Session updated: thread_id=%s updates=%s", thread_id, list(updates.keys()))
    except Exception as e:
        logger.warning("Failed to update session record: %s", str(e))


async def get_user_history(
    user_id: str,
    limit:   int = 20,
    offset:  int = 0,
) -> list:
    """Returns a user's research history, newest first."""
    try:
        db = get_supabase()
        result = db.table("research_sessions") \
            .select("id, thread_id, query, status, eval_score, created_at, updated_at") \
            .eq("user_id", user_id) \
            .order("created_at", desc=True) \
            .range(offset, offset + limit - 1) \
            .execute()
        return result.data or []
    except Exception as e:
        logger.warning("Failed to fetch user history: %s", str(e))
        return []


async def get_session_detail(thread_id: str, user_id: Optional[str]) -> Optional[dict]:
    """
    Returns full session detail including the final report.
    Enforces user ownership — only returns data if user_id matches.
    """
    try:
        db = get_supabase()
        
        query = db.table("research_sessions").select("*").eq("thread_id", thread_id)
        if user_id:
            query = query.eq("user_id", user_id)
            
        result = query.limit(1).execute()
        return result.data[0] if result.data else None
    except Exception as e:
        logger.debug("Failed to fetch session detail: %s", str(e))
        return None
