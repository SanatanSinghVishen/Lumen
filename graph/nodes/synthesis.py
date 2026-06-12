from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage, HumanMessage
from graph.state import AgentState
from config import OPENROUTER_API_KEY

llm = ChatOpenAI(model="nvidia/nemotron-3-ultra-550b-a55b:free", openai_api_key=OPENROUTER_API_KEY, openai_api_base="https://openrouter.ai/api/v1", max_retries=1, timeout=45) if OPENROUTER_API_KEY else None

SYSTEM_PROMPT = """You are a research synthesiser. Given web search results and document retrieval results, produce a unified context block. 
You must: 
(1) merge overlapping information
(2) explicitly flag any contradictions between sources with a [CONFLICT] marker
(3) note any topic gaps with a [GAP] marker
(4) cite each claim with its source (url or filename+page). 
Output as structured Markdown."""

def synthesis_node(state: AgentState) -> dict:
    if not llm:
        return {"merged_context": "Mock merged context. OpenRouter API key is missing."}
        
    web_res = state.get("web_results", [])
    rag_res = state.get("rag_results", [])
    
    content = f"WEB RESULTS:\n{web_res}\n\nDOCUMENT RESULTS:\n{rag_res}"
    
    messages = [
        SystemMessage(content=SYSTEM_PROMPT),
        HumanMessage(content=content)
    ]
    
    try:
        response = llm.invoke(messages)
        content = response.content
    except Exception as e:
        content = f"Mock merged context. Your OpenRouter API key appears to be invalid or unauthorized. Error: {str(e)}"
    
    return {"merged_context": content}
