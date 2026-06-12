from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage, HumanMessage
from graph.state import AgentState
from config import OPENROUTER_API_KEY

llm = ChatOpenAI(model="google/gemini-2.5-flash", openai_api_key=OPENROUTER_API_KEY, openai_api_base="https://openrouter.ai/api/v1", max_retries=1, timeout=45, streaming=True, max_tokens=8000) if OPENROUTER_API_KEY else None

SYSTEM_PROMPT = """You are a research synthesiser. Given web search results and document retrieval results, produce a unified context block. 
You must: 
(1) merge overlapping information
(2) explicitly flag any contradictions between sources with a [CONFLICT] marker
(3) note any topic gaps with a [GAP] marker
(4) cite each claim with its source (url or filename+page). 
Output as structured Markdown."""

from langchain_core.runnables import RunnableConfig

async def synthesis_node(state: AgentState, config: RunnableConfig) -> dict:
    if not llm:
        raise ValueError("OpenRouter API key is missing. Please configure OPENROUTER_API_KEY.")
        
    web_res = state.get("web_results", [])
    rag_res = state.get("rag_results", [])
    
    content = f"WEB RESULTS:\n{web_res}\n\nDOCUMENT RESULTS:\n{rag_res}"
    
    messages = [
        SystemMessage(content=SYSTEM_PROMPT),
        HumanMessage(content=content)
    ]
    
    try:
        content = ""
        # Create a new config dict with the merged tags
        run_config = {**config, "tags": config.get("tags", []) + ["synthesis_llm"]}
        async for chunk in llm.astream(messages, config=run_config):
            content += chunk.content
    except Exception as e:
        raise RuntimeError(f"Synthesis LLM failed: {str(e)}")
    
    return {"merged_context": content}
