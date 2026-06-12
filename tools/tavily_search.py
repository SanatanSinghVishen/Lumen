from tavily import TavilyClient
from config import TAVILY_API_KEY
from tenacity import retry, wait_exponential, stop_after_attempt

# Initialize client if key exists
client = TavilyClient(api_key=TAVILY_API_KEY) if TAVILY_API_KEY else None

@retry(wait=wait_exponential(multiplier=1, min=2, max=10), stop=stop_after_attempt(3))
def run_tavily_search(query: str, max_results: int = 5) -> list:
    if not client:
        return [{"title": "Mock Result", "url": "http://mock.com", "snippet": "Mock snippet since Tavily key is missing."}]
    try:
        response = client.search(query=query, search_depth="advanced", max_results=max_results)
        return response.get("results", [])
    except Exception as e:
        return [{"title": "Error", "url": "", "snippet": f"Tavily search failed. Error: {str(e)}"}]
