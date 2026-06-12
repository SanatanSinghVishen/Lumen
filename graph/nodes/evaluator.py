import json
import os
from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage, HumanMessage
from graph.state import AgentState
from eval.judge_prompt import JUDGE_SYSTEM_PROMPT
from config import OPENROUTER_API_KEY, EVAL_THRESHOLD

# Read from the environment variable set by main.py
LANGSMITH_ENABLED = os.environ.get("LANGCHAIN_TRACING_V2", "false").lower() == "true"

def safe_traceable(**kwargs):
    """
    Applies @traceable only when LangSmith is enabled.
    Falls back to a no-op wrapper when it's not.
    Never raises.
    """
    def decorator(fn):
        if not LANGSMITH_ENABLED:
            return fn  # no-op — return the function unchanged
        try:
            from langsmith import traceable
            return traceable(**kwargs)(fn)
        except Exception:
            return fn  # if traceable itself fails, still return the function
    return decorator

llm = ChatOpenAI(model="openrouter/owl-alpha", openai_api_key=OPENROUTER_API_KEY, openai_api_base="https://openrouter.ai/api/v1", max_retries=1) if OPENROUTER_API_KEY else None

@safe_traceable(name="evaluator-judge", run_type="llm")
def evaluator_node(state: AgentState) -> dict:
    draft = state.get("merged_context", "")
    query = state.get("query", "")
    current_retry = state.get("retry_count", 0)
    
    if not llm:
        return {
            "draft_report": draft, 
            "eval_score": 1.0, 
            "eval_feedback": "Skipped evaluation.",
            "retry_count": current_retry
        }
        
    content = f"ORIGINAL QUERY: {query}\n\nDRAFT ANSWER:\n{draft}"
    
    messages = [
        SystemMessage(content=JUDGE_SYSTEM_PROMPT),
        HumanMessage(content=content)
    ]
    
    try:
        response = llm.invoke(messages)
        text = response.content.strip()
        if text.startswith("```json"):
            text = text[7:-3]
        elif text.startswith("```"):
            text = text[3:-3]
        result = json.loads(text.strip())
        
        score = result.get("overall_score", 0.0)
        feedback = result.get("feedback", "No feedback provided.")
    except Exception as e:
        # If the API key is invalid, don't trigger the 3x retry loop which wastes 3 minutes
        score = 1.0
        feedback = f"Failed to parse evaluation because your OpenRouter API key is likely invalid or unauthorized. Error: {str(e)}"
        
    return {
        "draft_report": draft,
        "eval_score": score,
        "eval_feedback": feedback,
        "retry_count": current_retry + 1
    }
