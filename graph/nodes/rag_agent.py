from graph.state import AgentState
from tools.vector_retrieval import search_documents
import logging

logger = logging.getLogger("lumen.rag")


def rag_agent_node(state: AgentState) -> dict:
    """
    Retrieves relevant document chunks from ChromaDB for each sub-task.
    Deduplicates results by content to avoid feeding the synthesiser
    the same chunk multiple times.
    """
    sub_tasks = state.get("sub_tasks", [])
    if not sub_tasks:
        sub_tasks = [state["query"]]

    all_results = []
    seen_contents = set()

    for task in sub_tasks:
        results = search_documents(query=task)
        for r in results:
            # Deduplicate by content hash
            content_key = r["content"][:200]  # first 200 chars as key
            if content_key not in seen_contents:
                seen_contents.add(content_key)
                all_results.append(r)

    logger.info("RAG agent retrieved %d unique chunks across %d sub-tasks", len(all_results), len(sub_tasks))
    return {"rag_results": all_results}
