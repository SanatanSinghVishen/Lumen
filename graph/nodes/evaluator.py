import json
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import SystemMessage, HumanMessage
from graph.state import AgentState
from eval.judge_prompt import JUDGE_SYSTEM_PROMPT
from config import GEMINI_API_KEY

llm = ChatGoogleGenerativeAI(model="gemini-1.5-flash", google_api_key=GEMINI_API_KEY) if GEMINI_API_KEY else None

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
        score = 0.0
        feedback = f"Failed to parse evaluation: {str(e)}"
        
    return {
        "draft_report": draft,
        "eval_score": score,
        "eval_feedback": feedback,
        "retry_count": current_retry + 1
    }
