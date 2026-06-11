import os
import chromadb
from langchain_chroma import Chroma
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from config import GEMINI_API_KEY

# Ensure documents and chroma_db dirs exist
os.makedirs("documents", exist_ok=True)
os.makedirs("chroma_db", exist_ok=True)

# Use Gemini embeddings instead of OpenAI
embeddings = GoogleGenerativeAIEmbeddings(model="models/embedding-001", google_api_key=GEMINI_API_KEY) if GEMINI_API_KEY else None

# persistent client
client = chromadb.PersistentClient(path="./chroma_db")

vector_store = Chroma(
    client=client,
    collection_name="documents",
    embedding_function=embeddings
)

def search_documents(query: str, n_results: int = 5):
    if not embeddings:
        return []
    
    # Return documents with distances
    results = vector_store.similarity_search_with_score(query, k=n_results)
    
    formatted_results = []
    for doc, score in results:
        if score < 0.4:
            formatted_results.append({
                "content": doc.page_content,
                "metadata": doc.metadata,
                "distance": score
            })
    return formatted_results
