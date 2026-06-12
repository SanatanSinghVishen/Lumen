import os
import chromadb
from langchain_chroma import Chroma

# Ensure documents and chroma_db dirs exist
os.makedirs("documents", exist_ok=True)
os.makedirs("chroma_db", exist_ok=True)

class DummyEmbeddings:
    def embed_documents(self, texts):
        return [[0.0] * 768 for _ in texts]
    def embed_query(self, text):
        return [0.0] * 768

embeddings = DummyEmbeddings()

# persistent client
client = chromadb.PersistentClient(path="./chroma_db")

vector_store = Chroma(
    client=client,
    collection_name="documents",
    embedding_function=embeddings
)

def search_documents(query: str, n_results: int = 5):
    # Bypass actual vector search since no documents are loaded
    return []
