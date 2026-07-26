"""
vector_retrieval.py
───────────────────
Real RAG implementation using ChromaDB with Google's text-embedding-004 API
(free tier via Google AI Studio).

Provides:
  - ingest_file()       : chunk text and store in ChromaDB
  - search_documents()  : real vector similarity search
  - list_documents()    : list all ingested files
  - delete_collection() : clear all stored documents
  - ChromaEmbeddings    : LangChain-compatible wrapper for embeddings
"""

import os
import logging
import chromadb
from google import genai
from langchain_text_splitters import RecursiveCharacterTextSplitter

logger = logging.getLogger("lumen.rag")

# ── Directories ────────────────────────────────────────────────────────────
os.makedirs("documents", exist_ok=True)
os.makedirs("chroma_db", exist_ok=True)

# ── Google Embedding API Setup ─────────────────────────────────────────────
EMBEDDING_MODEL = "gemini-embedding-001"
EMBEDDING_DIMS = 3072  # gemini-embedding-001 output dimensionality

# Lazy-init: the client is created on first use, not at import time.
# This ensures load_dotenv() has run before we read GOOGLE_API_KEY.
_genai_client = None


def _get_client():
    global _genai_client
    if _genai_client is None:
        api_key = os.getenv("GOOGLE_API_KEY", "")
        if not api_key:
            raise ValueError(
                "GOOGLE_API_KEY is not set. "
                "Get a free key at https://aistudio.google.com/apikey"
            )
        _genai_client = genai.Client(api_key=api_key)
    return _genai_client


class GoogleEmbeddingFunction:
    """
    ChromaDB-compatible embedding function using Google's gemini-embedding-001.
    Replaces the local ONNX DefaultEmbeddingFunction to avoid 3-4 minute
    embedding times on Render's throttled free-tier CPU.
    """

    def name(self) -> str:
        return "google-gemini-embedding"

    def __call__(self, input: list[str]) -> list[list[float]]:
        if not input:
            return []

        client = _get_client()

        # Google's embedding API supports batching.
        # Batch in groups of 100 to stay within API limits comfortably.
        all_embeddings = []
        batch_size = 100

        for i in range(0, len(input), batch_size):
            batch = input[i : i + batch_size]
            result = client.models.embed_content(
                model=EMBEDDING_MODEL,
                contents=batch,
            )
            all_embeddings.extend([e.values for e in result.embeddings])

        return all_embeddings

    def embed_query(self, input: list[str]) -> list[list[float]]:
        """Called by ChromaDB during query/search operations."""
        return self.__call__(input)


google_ef = GoogleEmbeddingFunction()

# ── ChromaDB Setup ─────────────────────────────────────────────────────────
client = chromadb.PersistentClient(path="./chroma_db")

collection = client.get_or_create_collection(
    name="lumen_documents",
    embedding_function=google_ef,
    metadata={"hnsw:space": "cosine"},
)

# ── Structure & Table-Aware Text Splitters ─────────────────────────────────
from langchain_text_splitters import MarkdownHeaderTextSplitter

markdown_header_splitter = MarkdownHeaderTextSplitter(
    headers_to_split_on=[
        ("#", "Header 1"),
        ("##", "Header 2"),
        ("###", "Header 3"),
    ],
    strip_headers=False,
)

markdown_text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=1200,
    chunk_overlap=200,
    separators=["\n\n# ", "\n\n## ", "\n\n### ", "\n\n", "\n|", "\n", ". ", " ", ""],
)


def chunk_content(content: str) -> list[str]:
    """
    Structure-aware chunking for Markdown documents and plain text.
    First splits by section headers if present, keeping tables intact.
    """
    if "#" in content or "|" in content:
        try:
            header_docs = markdown_header_splitter.split_text(content)
            chunks = []
            for doc in header_docs:
                sub_chunks = markdown_text_splitter.split_text(doc.page_content)
                chunks.extend(sub_chunks)
            if chunks:
                return chunks
        except Exception:
            pass
    return markdown_text_splitter.split_text(content)


# ── LangChain-compatible Embeddings wrapper ────────────────────
class ChromaEmbeddings:
    """Wraps GoogleEmbeddingFunction for LangChain compatibility."""

    def __init__(self):
        self._ef = google_ef

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

    chunks = chunk_content(content)

    if not chunks:
        return {"filename": filename, "chunks": 0, "status": "empty"}

    ids = [f"{filename}::chunk_{i}" for i in range(len(chunks))]
    metadatas = [{"source": filename, "chunk_index": i} for i in range(len(chunks))]

    # Google API handles batching internally — no need for gc.collect()
    # workarounds that were required for local ONNX inference
    collection.add(
        documents=chunks,
        ids=ids,
        metadatas=metadatas,
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
        embedding_function=google_ef,
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
