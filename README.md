# LUMEN — Autonomous Multi-Agent Research Platform

> Type a topic. Lumen deploys parallel AI agents to search the web, retrieve documents, synthesise findings, score its own confidence, and wait for your approval before finalising.

**[Live Demo →](https://your-lumen-app.vercel.app)**  |  **[Backend Health →](https://your-lumen-api.onrender.com/health)**

---

## How it works

```
User query
    ↓
Orchestrator (Gemini) — decomposes into sub-tasks
    ↓ (parallel)
┌─────────────────┬──────────────────┐
│  Web Search     │  Document RAG    │
│  (Tavily)       │  (ChromaDB)      │
└─────────────────┴──────────────────┘
    ↓ (merged)
Synthesis agent — drafts the report
    ↓
Evaluator (LLM-as-judge) — scores relevance + hallucination risk
    ↓ (if score < 0.75, retry loop — max 3 attempts)
HITL interrupt — waits for human approval
    ↓
Final report
```

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React + Vite + Vanilla CSS |
| Backend | FastAPI (Python 3.10) |
| Agent engine | LangGraph |
| LLM | Gemini 2.0 Flash (free tier via OpenRouter) |
| Web search | Tavily API |
| Vector store | ChromaDB |
| State | LangGraph MemorySaver |
| Observability | LangSmith (graceful degradation) |
| Rate limiting | slowapi |
| Frontend hosting | Vercel |
| Backend hosting | Render |

## Run locally

```bash
# 1. Clone
git clone https://github.com/SanatanSinghVishen/Lumen.git
cd Lumen

# 2. Backend
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # fill in your API keys
uvicorn main:app --reload --port 8000

# 3. Frontend (new terminal)
cd frontend
npm install
npm run dev            # runs on localhost:5173
```

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `OPENROUTER_API_KEY` | Yes | OpenRouter API key |
| `TAVILY_API_KEY` | Yes | Tavily search API key |
| `FRONTEND_URL` | Yes | Vercel frontend URL for CORS |
| `LANGCHAIN_TRACING_V2` | No | Set `true` to enable LangSmith |
| `LANGCHAIN_API_KEY` | No | LangSmith API key |

## Architecture notes

**Why MemorySaver instead of Redis?**
LangGraph requires RediSearch (`FT.*` commands) which is unsupported on free serverless Redis tiers. MemorySaver provides identical behaviour for single-session portfolio use. Migration path to `AsyncPostgresSaver` for horizontal scaling is documented in `ARCHITECTURE.md`.

**Known limitation**
Because state is held in RAM, a Render container restart (which occurs after inactivity on the free tier) will lose in-flight sessions. The frontend detects this and shows a clear session-expired message.

---

Built by **Sanatan Singh** · IIIT Nagpur · B.Tech CSE 2027
[LinkedIn](https://www.linkedin.com/in/sanatan-singh-55b3502a3/) · [GitHub](https://github.com/SanatanSinghVishen)
