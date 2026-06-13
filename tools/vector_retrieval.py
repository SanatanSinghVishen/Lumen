"""
vector_retrieval.py
───────────────────
Real RAG implementation using ChromaDB with its built-in
DefaultEmbeddingFunction (all-MiniLM-L6-v2 via ONNX runtime).

Provides:
  - ingest_file()       : chunk text and store in ChromaDB
  - search_documents()  : real vector similarity search
  - list_documents()    : list all ingested files
  - delete_collection() : clear all stored documents
  - ChromaEmbeddings    : LangChain-compatible wrapper for RAGAS
"""

import os
import logging
import chromadb
from chromadb.utils.embedding_functions import DefaultEmbeddingFunction
from langchain_text_splitters import RecursiveCharacterTextSplitter

logger = logging.getLogger("lumen.rag")

# ── Directories ────────────────────────────────────────────────────────────
os.makedirs("documents", exist_ok=True)
os.makedirs("chroma_db", exist_ok=True)

# ── ChromaDB Setup ─────────────────────────────────────────────────────────
client = chromadb.PersistentClient(path="./chroma_db")
default_ef = DefaultEmbeddingFunction()  # all-MiniLM-L6-v2 (384-dim, ONNX)

collection = client.get_or_create_collection(
    name="lumen_documents",
    embedding_function=default_ef,
    metadata={"hnsw:space": "cosine"},
)

# ── Text Splitter ──────────────────────────────────────────────────────────
text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=1000,
    chunk_overlap=200,
    separators=["\n\n", "\n", ". ", " ", ""],
)


# ── LangChain-compatible Embeddings wrapper (for RAGAS) ────────────────────
class ChromaEmbeddings:
    """Wraps ChromaDB's DefaultEmbeddingFunction so RAGAS can use it."""

    def __init__(self):
        self._ef = default_ef

    def embed_documents(self, texts: list[str]) -> list[list[float]]:
        return self._ef(texts)

    def embed_query(self, text: str) -> list[float]:
        return self._ef([text])[0]


embeddings = ChromaEmbeddings()


# ── Core Functions ─────────────────────────────────────────────────────────

def ingest_file(filename: str, content: str) -> dict:
    """
    Chunks a document and stores it in ChromaDB.
    If a file with the same name was previously ingested, its old chunks
    are deleted first to avoid duplicates.
    """
    # Delete old chunks for this filename (idempotent re-upload)
    _delete_file_chunks(filename)

    chunks = text_splitter.split_text(content)

    if not chunks:
        return {"filename": filename, "chunks": 0, "status": "empty"}

    ids = [f"{filename}::chunk_{i}" for i in range(len(chunks))]
    metadatas = [{"source": filename, "chunk_index": i} for i in range(len(chunks))]

    # Process in small batches to prevent OOM crashes on the Render free tier
    # ONNX runtime allocates massive memory if it tries to embed 100+ chunks at once
    batch_size = 20
    for i in range(0, len(chunks), batch_size):
        batch_chunks = chunks[i:i + batch_size]
        batch_ids = ids[i:i + batch_size]
        batch_metas = metadatas[i:i + batch_size]
        
        collection.add(
            documents=batch_chunks,
            ids=batch_ids,
            metadatas=batch_metas,
        )

    logger.info("Ingested %d chunks from '%s'", len(chunks), filename)
    return {"filename": filename, "chunks": len(chunks), "status": "success"}


def search_documents(query: str, n_results: int = 5) -> list[dict]:
    """
    Performs real vector similarity search against ChromaDB.
    Returns a list of dicts with 'content', 'source', and 'score'.
    """
    if collection.count() == 0:
        return []

    results = collection.query(
        query_texts=[query],
        n_results=min(n_results, collection.count()),
        include=["documents", "metadatas", "distances"],
    )

    documents = []
    for i in range(len(results["documents"][0])):
        # cosine distance → similarity:  similarity = 1 - distance
        dist = results["distances"][0][i] if results["distances"] else 0
        documents.append({
            "content": results["documents"][0][i],
            "source": results["metadatas"][0][i].get("source", "unknown"),
            "score": round(1.0 - dist, 4),
        })

    return documents


def list_documents() -> list[dict]:
    """Returns metadata about all stored documents grouped by source file."""
    if collection.count() == 0:
        return []

    all_data = collection.get(include=["metadatas"])
    source_counts: dict[str, int] = {}
    for meta in all_data["metadatas"]:
        src = meta.get("source", "unknown")
        source_counts[src] = source_counts.get(src, 0) + 1

    return [{"filename": s, "chunks": c} for s, c in source_counts.items()]


def delete_collection():
    """Deletes all documents from the collection and recreates it."""
    global collection
    client.delete_collection("lumen_documents")
    collection = client.get_or_create_collection(
        name="lumen_documents",
        embedding_function=default_ef,
        metadata={"hnsw:space": "cosine"},
    )
    logger.info("Document collection cleared")


def _delete_file_chunks(filename: str):
    """Remove all chunks belonging to a specific file."""
    try:
        existing = collection.get(
            where={"source": filename},
            include=[],
        )
        if existing["ids"]:
            collection.delete(ids=existing["ids"])
            logger.info("Deleted %d old chunks for '%s'", len(existing["ids"]), filename)
    except Exception:
        pass  # collection might be empty or file never ingested
