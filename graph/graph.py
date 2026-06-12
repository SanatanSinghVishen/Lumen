import os
from langgraph.graph import StateGraph, START, END
from graph.state import AgentState

from graph.nodes.orchestrator import orchestrator_node
from graph.nodes.web_search import web_search_node
from graph.nodes.rag_agent import rag_agent_node
from graph.nodes.synthesis import synthesis_node
from graph.nodes.evaluator import evaluator_node
from graph.nodes.hitl import hitl_node
from config import EVAL_THRESHOLD, MAX_RETRIES

def should_retry(state: AgentState) -> str:
    score = state.get("eval_score", 0.0)
    retry_count = state.get("retry_count", 0)
    
    if score >= EVAL_THRESHOLD:
        return "hitl"
    elif retry_count < MAX_RETRIES:
        return "orchestrator"
    else:
        return "hitl"

def after_hitl(state: AgentState) -> str:
    status = state.get("hitl_status")
    if status == "rejected":
        return "orchestrator"
    return "output"

workflow = StateGraph(AgentState)

workflow.add_node("orchestrator", orchestrator_node)
workflow.add_node("web_search", web_search_node)
workflow.add_node("rag_agent", rag_agent_node)
workflow.add_node("synthesis", synthesis_node)
workflow.add_node("evaluator", evaluator_node)
workflow.add_node("hitl", hitl_node)

workflow.add_node("output", lambda x: {"final_report": x.get("final_report", x.get("draft_report"))})

workflow.add_edge(START, "orchestrator")
# Fan-out
workflow.add_edge("orchestrator", "web_search")
workflow.add_edge("orchestrator", "rag_agent")

# Fan-in
workflow.add_edge("web_search", "synthesis")
workflow.add_edge("rag_agent", "synthesis")

workflow.add_edge("synthesis", "evaluator")

# Conditional Edge for Evaluator
workflow.add_conditional_edges(
    "evaluator",
    should_retry,
    {
        "orchestrator": "orchestrator",
        "hitl": "hitl"
    }
)

workflow.add_conditional_edges(
    "hitl",
    after_hitl,
    {
        "orchestrator": "orchestrator",
        "output": "output"
    }
)

workflow.add_edge("output", END)

import sys
from langgraph.checkpoint.redis import RedisSaver
import redis

REDIS_URL = os.getenv("REDIS_URL", "redis://redis:6379")

try:
    # Test connection before initializing
    client = redis.Redis.from_url(REDIS_URL)
    client.ping()
    checkpointer = RedisSaver(redis_client=client)
    checkpointer.setup()
except Exception as e:
    print(f"FATAL: Cannot connect to Redis at {REDIS_URL}. Error: {e}", file=sys.stderr)
    sys.exit(1)

app_graph = workflow.compile(checkpointer=checkpointer)
