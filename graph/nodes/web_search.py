from graph.state import AgentState
from tools.tavily_search import run_tavily_search

def web_search_node(state: AgentState) -> dict:
    sub_tasks = state.get("sub_tasks", [])
    if not sub_tasks:
        sub_tasks = [state["query"]]
        
    all_results = []
    for task in sub_tasks:
        results = run_tavily_search(query=task)
        all_results.extend(results)
        
    return {"web_results": all_results}
