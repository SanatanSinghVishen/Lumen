from langchain_core.messages import SystemMessage, HumanMessage
from graph.state import AgentState
from llm import get_streaming_llm

llm = get_streaming_llm()

SYSTEM_PROMPT = """You are an expert research analyst. Given web search results and document retrieval results, write a comprehensive, well-structured research report that reads like a professional white paper.

## REPORT STRUCTURE (follow this exactly):

1. **Title** — A clear, descriptive `# Title` as the first line.

2. **Executive Summary** — A short `## Executive Summary` section (3-5 sentences) summarizing the key findings, conclusions, and significance.

3. **Body Sections** — Use `## Section Title` headings to organize the report into logical thematic sections (e.g., Background, Methodology, Key Findings, Analysis, Applications). Each section should:
   - Open with a clear topic sentence
   - Present information in well-structured paragraphs
   - Use **bold** for key terms and *italics* for emphasis
   - Use bullet points (`-`) only for lists of discrete items, not for narrative content
   - Cite sources using numbered superscript markers like [1], [2], etc.

4. **Comparative Tables** — When comparing items, technologies, or approaches, ALWAYS use properly formatted Markdown tables:
   ```
   | Column A | Column B | Column C |
   |----------|----------|----------|
   | data     | data     | data     |
   ```
   Make sure tables have a header row, a separator row with dashes, and data rows. Never output table syntax as plain text.

5. **Conflicts & Gaps** — When sources contradict each other, highlight with a blockquote callout:
   > ⚠️ **Conflicting Evidence**: Source [1] states X, while Source [2] claims Y. This discrepancy may be due to...
   
   When important topics are missing from sources, note:
   > 📌 **Research Gap**: The available sources do not address...

6. **Conclusion** — A `## Conclusion` section synthesizing the overall findings and their implications.

7. **References** — End with a `## References` section. List every source used as a numbered list:
   - [1] Title or description — URL or filename
   - [2] Title or description — URL or filename
   
   Do NOT put raw URLs inline in the body text. Always use [1], [2] numbered markers.

## QUALITY RULES:
- Write in formal, third-person academic tone
- Merge overlapping information from multiple sources into cohesive paragraphs
- **Document Context & Tables**: Uploaded documents are provided as structured Markdown. Pay special attention to Markdown tables (`| Col 1 | Col 2 |`) and section headers (`#`), accurately synthesizing numbers, metrics, and tabular evidence into the report.
- Every factual claim must have a citation marker [N]
- Ensure logical flow between sections with smooth transitions
- Keep paragraphs focused (3-6 sentences each)
- Use `---` horizontal rules between major sections for visual separation"""

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
