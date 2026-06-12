from graph.state import AgentState
from tools.tavily_search import run_tavily_search

import logging
logger = logging.getLogger("lumen.web_search")

def web_search_node(state: AgentState) -> dict:
    sub_tasks = state.get("sub_tasks", [])
    if not sub_tasks:
        sub_tasks = [state["query"]]
        
    from concurrent.futures import ThreadPoolExecutor

    all_results = []
    # Run tavily searches concurrently
    with ThreadPoolExecutor(max_workers=len(sub_tasks)) as executor:
        futures = [executor.submit(run_tavily_search, query=task) for task in sub_tasks]
        for future in futures:
            try:
                results = future.result()
                all_results.extend(results)
            except Exception as e:
                # Log error but don't crash
                logger.warning("Tavily search thread failed: %s", str(e))
                
    return {"web_results": all_results}
