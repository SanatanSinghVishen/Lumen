from graph.state import AgentState
from tools.vector_retrieval import search_documents

def rag_agent_node(state: AgentState) -> dict:
    sub_tasks = state.get("sub_tasks", [])
    if not sub_tasks:
        sub_tasks = [state["query"]]
        
    all_results = []
    for task in sub_tasks:
        results = search_documents(query=task)
        all_results.extend(results)
        
    return {"rag_results": all_results}
