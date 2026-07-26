"""
upload_tasks.py
───────────────
In-memory tracker for background upload/embedding jobs.

Task lifecycle:  "processing"  →  "ready" | "failed"

This is intentionally simple (a Python dict with a threading lock)
because Render free tier runs a single instance, and upload state
is ephemeral — if the server restarts, users simply re-upload.
"""

import logging
from datetime import datetime, timezone
from threading import Lock

logger = logging.getLogger("lumen.upload_tasks")

_tasks: dict[str, dict] = {}
_lock = Lock()

# Auto-prune tasks older than this (seconds)
_MAX_AGE_SECONDS = 3600  # 1 hour


def create_task(task_id: str, filename: str) -> dict:
    """Register a new upload task as 'processing'."""
    task = {
        "task_id": task_id,
        "filename": filename,
        "status": "processing",
        "chunks": 0,
        "error": None,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    with _lock:
        _cleanup_old_tasks()
        _tasks[task_id] = task
    logger.info("Upload task created: %s (%s)", task_id, filename)
    return task


def complete_task(task_id: str, chunks: int) -> None:
    """Mark a task as 'ready' with the number of chunks indexed."""
    with _lock:
        if task_id in _tasks:
            _tasks[task_id]["status"] = "ready"
            _tasks[task_id]["chunks"] = chunks
    logger.info("Upload task completed: %s (%d chunks)", task_id, chunks)


def fail_task(task_id: str, error: str) -> None:
    """Mark a task as 'failed' with an error message."""
    with _lock:
        if task_id in _tasks:
            _tasks[task_id]["status"] = "failed"
            _tasks[task_id]["error"] = error
    logger.warning("Upload task failed: %s — %s", task_id, error)


def get_task(task_id: str) -> dict | None:
    """Get the current status of a task, or None if not found."""
    with _lock:
        return _tasks.get(task_id)


def get_active_tasks() -> list[dict]:
    """Return all tasks currently in 'processing' state."""
    with _lock:
        return [
            t for t in _tasks.values()
            if t["status"] == "processing"
        ]


def _cleanup_old_tasks() -> None:
    """Remove tasks older than _MAX_AGE_SECONDS. Called under lock."""
    now = datetime.now(timezone.utc)
    expired = []
    for task_id, task in _tasks.items():
        created = datetime.fromisoformat(task["created_at"])
        if (now - created).total_seconds() > _MAX_AGE_SECONDS:
            expired.append(task_id)
    for task_id in expired:
        del _tasks[task_id]
    if expired:
        logger.info("Cleaned up %d expired upload tasks", len(expired))
