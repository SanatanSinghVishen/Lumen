from langchain_core.messages import SystemMessage, HumanMessage
from graph.state import AgentState
from llm import get_streaming_llm

llm = get_streaming_llm()

SYSTEM_PROMPT = """You are a research synthesiser. Given web search results and document retrieval results, write a comprehensive research report.
You must: 
(1) merge overlapping information
(2) explicitly flag any contradictions between sources with a [CONFLICT] marker
(3) note any topic gaps with a [GAP] marker
(4) cite each claim with its source (url or filename). 
Output as structured Markdown."""

from langchain_core.runnables import RunnableConfig

async def synthesis_node(state: AgentState, config: RunnableConfig) -> dict:
    web_res = state.get("web_results", [])
    rag_res = state.get("rag_results", [])
    
    # ── Context trimming ───────────────────────────────────────────────
    # Groq free tier: 12,000 TPM. We must keep input under ~8K tokens
    # (~32K chars) to leave room for system prompt + output tokens.
    # Strategy: top 3 results per source, each truncated to 1500 chars.
    MAX_RESULTS = 3
    MAX_CHARS_PER_RESULT = 1500
    
    def trim(text: str) -> str:
        return text[:MAX_CHARS_PER_RESULT] + "..." if len(text) > MAX_CHARS_PER_RESULT else text
    
    web_text = "\n\n".join([
        f"Source: {r.get('url', 'Web')}\nContent: {trim(r.get('content', r.get('snippet', '')))}"
        for r in web_res[:MAX_RESULTS]
    ])
    rag_text = "\n\n".join([
        f"Source: {r.get('source', 'Document')}\nContent: {trim(r.get('content', ''))}"
        for r in rag_res[:MAX_RESULTS]
    ])
    
    content = f"WEB RESULTS:\n{web_text}\n\nDOCUMENT RESULTS:\n{rag_text}"
    
    eval_feedback = state.get("eval_feedback")
    draft_report = state.get("draft_report")
    
    if eval_feedback and draft_report:
        # If this is a revision, explicitly instruct the LLM to apply the feedback to the draft
        prompt_content = (
            f"PREVIOUS DRAFT:\n{draft_report}\n\n"
            f"USER REVISION REQUEST:\n{eval_feedback}\n\n"
            f"Please completely rewrite the previous draft, strictly incorporating the user's revision request above. "
            f"Use the retrieved context below if necessary:\n\n{content}"
        )
    else:
        prompt_content = f"ORIGINAL QUERY:\n{state.get('query')}\n\n{content}"
        
    messages = [
        SystemMessage(content=SYSTEM_PROMPT),
        HumanMessage(content=prompt_content)
    ]    
    try:
        content = ""
        # Create a new config dict with the merged tags
        run_config = {**config, "tags": config.get("tags", []) + ["synthesis_llm"]}
        async for chunk in llm.astream(messages, config=run_config):
            content += chunk.content
    except Exception as e:
        raise RuntimeError(f"Synthesis LLM failed: {str(e)}")
        
    import gc
    gc.collect()
    
    return {"merged_context": content}
