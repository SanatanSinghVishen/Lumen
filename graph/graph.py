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

from eval.fast_eval import compute_eval_scores
import logging

logger = logging.getLogger("lumen.fasteval")

async def fast_eval_node(state: AgentState) -> AgentState:
    """
    Computes FastEval metrics for the current draft.
    Never blocks the pipeline — if FastEval fails, scores are None
    and the pipeline continues to the LLM judge as normal.
    """
    try:
        # Tavily results use "content" or "snippet" depending on version/mode
        # RAG results always use "content"
        raw_contexts = [
            r.get("content", r.get("snippet", ""))
            for r in state.get("rag_results", [])
        ] + [
            r.get("content", r.get("snippet", ""))
            for r in state.get("web_results", [])
        ]
        contexts = [c for c in raw_contexts if c and c.strip()]

        if not contexts:
            logger.warning("FastEval node: no contexts available — skipping")
            return {
                **state,
                "faithfulness":      None,
                "answer_relevancy":  None,
                "context_precision": None,
                "eval_error":       "no_contexts",
            }

        import asyncio
        scores = await asyncio.to_thread(
            compute_eval_scores,
            query=state["query"],
            answer=state.get("draft_report") or state.get("merged_context", ""),
            contexts=contexts,
        )

        return {
            **state,
            "faithfulness":      scores["faithfulness"],
            "answer_relevancy":  scores["answer_relevancy"],
            "context_precision": scores["context_precision"],
            "eval_error":       scores["error"],
        }

    except Exception as e:
        logger.warning("FastEval node crashed — %s", str(e))
        return {
            **state,
            "faithfulness":      None,
            "answer_relevancy":  None,
            "context_precision": None,
            "eval_error":       str(e),
        }

workflow.add_node("fast_eval", fast_eval_node)
workflow.add_edge("synthesis", "fast_eval")
workflow.add_edge("fast_eval", "evaluator")

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

def build_graph(checkpointer):
    from langgraph.graph import StateGraph
    return workflow.compile(checkpointer=checkpointer)
