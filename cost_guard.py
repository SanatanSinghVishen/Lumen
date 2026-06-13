"""
cost_guard.py
─────────────
Hard daily ceiling on LLM-triggering requests.

At Gemini 2.5 Flash pricing via OpenRouter (~$0.003/query),
100 queries/day = ~$0.30/day maximum exposure.
Even under sustained attack, worst case is $0.30 before
this guard kicks in and returns 503 for the rest of the day.

Resets at midnight UTC automatically.
"""

import logging
from datetime import datetime, timezone
from threading import Lock

logger = logging.getLogger("lumen.cost_guard")

# ── Configuration ─────────────────────────────────────────────────────
DAILY_QUERY_LIMIT    = 100   # max LLM queries per day total
DAILY_UPLOAD_LIMIT   = 50    # max file uploads per day total

_state = {
    "queries":  0,
    "uploads":  0,
    "date":     datetime.now(timezone.utc).date(),
    "lock":     Lock(),
}


def _reset_if_new_day():
    today = datetime.now(timezone.utc).date()
    if today != _state["date"]:
        logger.info(
            "Cost guard daily reset — queries: %d, uploads: %d",
            _state["queries"], _state["uploads"]
        )
        _state["queries"] = 0
        _state["uploads"] = 0
        _state["date"]    = today


def check_query() -> dict:
    with _state["lock"]:
        _reset_if_new_day()
        if _state["queries"] >= DAILY_QUERY_LIMIT:
            logger.warning(
                "Cost guard: query limit reached (%d/%d)",
                _state["queries"], DAILY_QUERY_LIMIT
            )
            return {
                "allowed":   False,
                "reason":    "daily_limit_reached",
                "resets_at": "Midnight UTC",
            }
        _state["queries"] += 1
        logger.info("Cost guard: query %d/%d", _state["queries"], DAILY_QUERY_LIMIT)
        return {"allowed": True}


def check_upload() -> dict:
    with _state["lock"]:
        _reset_if_new_day()
        if _state["uploads"] >= DAILY_UPLOAD_LIMIT:
            return {
                "allowed": False,
                "reason":  "daily_upload_limit_reached",
            }
        _state["uploads"] += 1
        return {"allowed": True}


def get_status() -> dict:
    with _state["lock"]:
        _reset_if_new_day()
        return {
            "queries_today":    _state["queries"],
            "query_limit":      DAILY_QUERY_LIMIT,
            "queries_remaining": max(0, DAILY_QUERY_LIMIT - _state["queries"]),
            "uploads_today":    _state["uploads"],
            "upload_limit":     DAILY_UPLOAD_LIMIT,
        }
