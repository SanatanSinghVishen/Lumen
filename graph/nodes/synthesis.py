from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import SystemMessage, HumanMessage
from graph.state import AgentState
from config import GEMINI_API_KEY

llm = ChatGoogleGenerativeAI(model="gemini-1.5-flash", google_api_key=GEMINI_API_KEY) if GEMINI_API_KEY else None

SYSTEM_PROMPT = """You are a research synthesiser. Given web search results and document retrieval results, produce a unified context block. 
You must: 
(1) merge overlapping information
(2) explicitly flag any contradictions between sources with a [CONFLICT] marker
(3) note any topic gaps with a [GAP] marker
(4) cite each claim with its source (url or filename+page). 
Output as structured Markdown."""

def synthesis_node(state: AgentState) -> dict:
    if not llm:
        return {"merged_context": "Mock merged context. Gemini API key is missing."}
        
    web_res = state.get("web_results", [])
    rag_res = state.get("rag_results", [])
    
    content = f"WEB RESULTS:\n{web_res}\n\nDOCUMENT RESULTS:\n{rag_res}"
    
    messages = [
        SystemMessage(content=SYSTEM_PROMPT),
        HumanMessage(content=content)
    ]
    
    response = llm.invoke(messages)
    
    return {"merged_context": response.content}
