import json
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import SystemMessage, HumanMessage
from graph.state import AgentState
from config import GEMINI_API_KEY

llm = ChatGoogleGenerativeAI(model="gemini-1.5-flash", google_api_key=GEMINI_API_KEY) if GEMINI_API_KEY else None

SYSTEM_PROMPT = """You are a research task planner. Given a query and optional retry feedback, decompose the query into 2–4 specific sub-tasks for: (1) web search, (2) document retrieval, (3) synthesis. If retry feedback is provided, adjust the sub-tasks to address the gaps identified.
Output MUST be a raw JSON array of strings, e.g., ["task 1", "task 2"]. Do not wrap in markdown code blocks."""

def orchestrator_node(state: AgentState) -> dict:
    if not llm:
        return {"sub_tasks": [state.get("query", "")]}
        
    query = state.get("query", "")
    feedback = state.get("eval_feedback", "")
    
    content = f"QUERY: {query}\n"
    if feedback:
        content += f"FEEDBACK FROM PREVIOUS ATTEMPT: {feedback}\n"
        
    messages = [
        SystemMessage(content=SYSTEM_PROMPT),
        HumanMessage(content=content)
    ]
    
    try:
        response = llm.invoke(messages)
        # Parse JSON
        text = response.content.strip()
        if text.startswith("```json"):
            text = text[7:-3]
        elif text.startswith("```"):
            text = text[3:-3]
        sub_tasks = json.loads(text.strip())
        if not isinstance(sub_tasks, list):
            sub_tasks = [query]
    except Exception as e:
        sub_tasks = [query]
        
    return {"sub_tasks": sub_tasks}
