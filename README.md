<p align="center">
  <img src="https://img.shields.io/badge/Status-Live-brightgreen?style=for-the-badge" alt="Status: Live" />
  <img src="https://img.shields.io/badge/Model-Gemini%202.5%20Flash-4285f4?style=for-the-badge&logo=google" alt="Gemini 2.5 Flash" />
  <img src="https://img.shields.io/badge/Framework-LangGraph-eb6f92?style=for-the-badge" alt="LangGraph" />
  <img src="https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge" alt="MIT License" />
</p>

# 🔆 LUMEN — Autonomous Research Agent

> **Type a question. Get a full research report — fact-checked, scored, and human-approved.**

<p align="center">
  <a href="https://lumen-frontend-one.vercel.app"><strong>🌐 Live Demo</strong></a> &nbsp;·&nbsp;
  <a href="https://lumen-api-ijf1.onrender.com/health"><strong>💚 Backend Health</strong></a> &nbsp;·&nbsp;
  <a href="https://github.com/SanatanSinghVishen/Lumen"><strong>📦 GitHub Repo</strong></a>
</p>

> [!NOTE]
> The backend is hosted on Render's free tier. If the site feels slow on first load, the server is waking up from sleep — give it ~30 seconds and it'll be blazing fast after that.

---

## 🤔 Why does LUMEN exist?

Have you ever tried to research a topic online? You probably:

1. **Opened 15 tabs** across Google, Wikipedia, Reddit, and research papers
2. **Read through walls of text** trying to find the important bits
3. **Copy-pasted quotes** into a document, tried to organize them
4. **Realized half your sources disagreed** with each other
5. **Spent hours** just to write a few pages

**Now imagine an AI that does ALL of that for you — automatically.**

LUMEN is that AI. You type a question, and it:

- 🔍 **Searches the web** for the latest information
- 📄 **Reads your own documents** (PDFs, notes, anything you upload)
- ✍️ **Writes a structured report** combining everything it found
- ✅ **Fact-checks its own work** and scores how confident it is
- 🔄 **Rewrites it if the score is too low** — automatically, no nagging
- 👤 **Asks YOU to approve it** before calling it done

The result? A research report that would take you hours — delivered in minutes.

---

## ✨ Key Features

| Feature | What it means for you |
|---|---|
| **Multi-Agent Pipeline** | Multiple specialized AI "workers" handle different parts of the research simultaneously |
| **Parallel Search** | Web search and document search happen at the same time — no waiting |
| **RAG (Upload Your Docs)** | Upload PDFs or text files and the AI will search inside them for relevant info |
| **Auto Fact-Checking** | Every report gets scored by FastEval metrics (faithfulness, relevancy, precision) |
| **Self-Correction Loop** | If the quality score is below 75%, LUMEN automatically revises — up to 3 times |
| **Human-in-the-Loop** | You get final say. Approve the report, or send it back with feedback |
| **Live Streaming** | Watch the report being written in real-time, word by word (via Server-Sent Events) |
| **Beautiful Dark UI** | A sleek, animated interface built with React + Framer Motion |

---

## 🧠 How It Works (Simple Version)

Think of LUMEN like a team of specialists working on your question:

```
You type a question
        ↓
   ┌─────────────────────────────────────────┐
   │  🎯 ORCHESTRATOR                        │
   │  Breaks your question into smaller      │
   │  research tasks                         │
   └──────────────┬──────────────────────────┘
                  ↓
       ┌──────────┴──────────┐
       ↓                     ↓
  ┌─────────┐         ┌──────────┐
  │ 🔍 Web  │         │ 📄 Doc   │
  │ Search  │         │ Search   │
  │ (Tavily)│         │(ChromaDB)│
  └────┬────┘         └────┬─────┘
       └──────────┬────────┘
                  ↓
   ┌─────────────────────────────────────────┐
   │  ✍️  SYNTHESIS                           │
   │  Combines everything into a draft       │
   └──────────────┬──────────────────────────┘
                  ↓
   ┌─────────────────────────────────────────┐
   │  📊 EVALUATOR (FastEval)                │
   │  Scores: Faithfulness · Relevancy ·     │
   │  Precision                              │
   │  Score < 75%? → Back to Orchestrator!   │
   └──────────────┬──────────────────────────┘
                  ↓
   ┌─────────────────────────────────────────┐
   │  👤 HUMAN-IN-THE-LOOP                   │
   │  You review it. Approve ✓ or Reject ✗   │
   └──────────────┬──────────────────────────┘
                  ↓
        📝 Your finished report!
```

---

## 🏗️ Architecture

### Frontend (What you see)

| Component | Purpose |
|---|---|
| **React + Vite** | Fast, modern single-page app |
| **Framer Motion** | Smooth page transitions and animations |
| **Vanilla CSS** | Custom dark theme with glassmorphism |
| **SSE Client** | Receives the report in real-time as the AI writes it |

**Pages:**

| Page | What it does |
|---|---|
| Landing Page | Type your question, upload documents |
| Loading Page | Live progress — shows which agent is currently working |
| Review Page | Read the draft, see quality scores, approve or reject |
| Result Page | Final report with export options |
| Architecture Page | Interactive visual diagram of how LUMEN works |
| How It Works Page | Step-by-step animated explainer |

### Backend (The brain)

| Component | Technology | What it does |
|---|---|---|
| **API Server** | FastAPI (Python) | Takes your request, returns results, manages sessions |
| **Agent Engine** | LangGraph | Orchestrates the multi-agent pipeline with state management |
| **LLM** | Gemini 2.5 Flash (via OpenRouter) | The AI that thinks, writes, and evaluates |
| **Web Search** | Tavily API | Searches the live internet for current information |
| **Vector Store** | ChromaDB | Stores and searches your uploaded documents |
| **Evaluation** | FastEval | Computes faithfulness, relevancy, and precision scores |
| **Checkpointer** | Postgres (Supabase) / MemorySaver | Saves conversation state so sessions persist |
| **Rate Limiting** | slowapi | Prevents abuse — protects the free API keys |
| **Observability** | LangSmith | Optional tracing for debugging agent behavior |

### Infrastructure

| Service | Platform |
|---|---|
| Frontend hosting | Vercel |
| Backend hosting | Render |
| Database | Supabase (Postgres) |
| Domain | Custom (via Vercel) |

---

## 📁 Project Structure

```
Lumen/
├── main.py                 # FastAPI app entry point
├── config.py               # Environment variables & thresholds
├── llm.py                  # LLM configuration (all models centralized here)
├── requirements.txt        # Python dependencies
├── Dockerfile              # Backend container
├── docker-compose.yml      # Full stack (backend + frontend + Redis)
├── render.yaml             # Render deployment config
│
├── api/
│   └── routes.py           # API endpoints (/research, /approve, /upload, etc.)
│
├── graph/
│   ├── graph.py            # LangGraph pipeline definition (nodes + edges + conditionals)
│   ├── state.py            # AgentState schema
│   └── nodes/
│       ├── orchestrator.py # Task decomposition (query → sub-tasks)
│       ├── web_search.py   # Tavily web search
│       ├── rag_agent.py    # ChromaDB document retrieval
│       ├── synthesis.py    # Report writing (with SSE streaming)
│       ├── evaluator.py    # LLM-as-judge scoring
│       └── hitl.py         # Human-in-the-loop interrupt
│
├── eval/
│   └── fast_eval.py        # FastEval metric computation
│
├── tools/
│   └── ...                 # Utility tools
│
└── frontend/
    ├── index.html
    ├── vite.config.js
    └── src/
        ├── App.jsx         # Router + API URL config
        ├── index.css       # Global dark theme + animations
        ├── utils/
        │   └── motionVariants.js  # Framer Motion presets
        └── components/
            ├── LandingPage.jsx      # Search input + file upload
            ├── LoadingPage.jsx      # Real-time agent progress
            ├── ReviewPage.jsx       # Draft review + Evaluation scores
            ├── ResultPage.jsx       # Final report display
            ├── ArchitecturePage.jsx  # Interactive architecture diagrams
            ├── HowItWorksPage.jsx   # Animated step-by-step explainer
            ├── Layout.jsx           # Navbar + footer + page transitions
            └── ErrorScreen.jsx      # Graceful error handling
```

---

## 🚀 Run Locally

### Prerequisites

- **Python 3.10+**
- **Node.js 18+**
- **An OpenRouter API key** (free at [openrouter.ai/keys](https://openrouter.ai/keys))
- **A Tavily API key** (free at [tavily.com](https://tavily.com) — 1,000 searches/month)
- **libmagic1** (Linux only, for file type validation: `sudo apt-get install libmagic1`)

### 1. Clone the repo

```bash
git clone https://github.com/SanatanSinghVishen/Lumen.git
cd Lumen
```

### 2. Set up the backend

```bash
# Create a virtual environment
python -m venv venv

# Activate it
# On macOS/Linux:
source venv/bin/activate
# On Windows:
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Open .env and fill in your API keys
```

### 3. Start the backend

```bash
uvicorn main:app --reload --port 8000
```

### 4. Start the frontend (in a new terminal)

```bash
cd frontend
npm install
npm run dev
# → Opens at http://localhost:5173
```

### 5. (Optional) Run with Docker

```bash
docker-compose up --build
# → Frontend at http://localhost:3000
# → Backend at http://localhost:8000
```

---

## ⚙️ Environment Variables

Create a `.env` file in the project root:

```env
# ── Required ────────────────────────────────────
OPENROUTER_API_KEY=sk-or-...        # Get from openrouter.ai/keys
TAVILY_API_KEY=tvly-...             # Get from tavily.com

# ── Infrastructure ──────────────────────────────
POSTGRES_URL=                       # Supabase Postgres URL (leave empty for local MemorySaver)
FRONTEND_URL=http://localhost:5173  # For CORS — change to your Vercel URL in production

# ── Observability (optional) ────────────────────
LANGCHAIN_TRACING_V2=false          # Set to "true" to enable LangSmith tracing
LANGCHAIN_API_KEY=                  # Your LangSmith API key
LANGCHAIN_PROJECT=lumen-research-agent
```

---

## 🔧 How the Self-Correction Loop Works

This is what makes LUMEN special — it doesn't just generate a report and call it done:

1. **Synthesis** writes the first draft
2. **Fast Evaluator** scores it on three metrics:
   - **Faithfulness** — Does the report match the source material?
   - **Answer Relevancy** — Does it actually answer the original question?
   - **Context Precision** — Did it use the right parts of the research?
3. If the **average score < 75%**, the Evaluator sends feedback to the Orchestrator
4. The Orchestrator **re-plans** the research based on what went wrong
5. The entire search → write → evaluate cycle runs again
6. This repeats up to **3 times** before presenting whatever it has to the human

---

## 📝 Architecture Notes

**Why OpenRouter instead of direct Gemini API?**
OpenRouter provides a unified API for 100+ models. If Gemini goes down or rate-limits, switching to Claude or GPT-4o is a one-line config change.

**Why MemorySaver as fallback?**
LangGraph's Redis checkpointer needs RediSearch (`FT.*` commands) which isn't available on free Redis tiers. MemorySaver gives identical behavior for single-session use. The codebase supports Postgres (Supabase) for production persistence.

**Known Limitation:**
On Render's free tier, the backend container sleeps after 15 minutes of inactivity. A cold start takes ~30 seconds. The frontend detects this and shows a banner. In-flight sessions are lost on restart when using MemorySaver (Postgres mode persists them).

---

## 🤝 Contributing

Found a bug? Have an idea? Feel free to:

1. Fork the repo
2. Create a feature branch (`git checkout -b feature/amazing-thing`)
3. Commit your changes (`git commit -m 'Add amazing thing'`)
4. Push to the branch (`git push origin feature/amazing-thing`)
5. Open a Pull Request

---

## 👨‍💻 Built By

<table>
  <tr>
    <td align="center">
      <strong>Sanatan Singh</strong><br/>
      B.Tech CSE · IIIT Nagpur · Class of 2027<br/><br/>
      <a href="https://www.linkedin.com/in/sanatan-singh-55b3502a3/">LinkedIn</a> · 
      <a href="https://github.com/SanatanSinghVishen">GitHub</a>
    </td>
  </tr>
</table>

---

<p align="center">
  <sub>Built with ☕ and curiosity. If LUMEN helped you, consider giving it a ⭐ on GitHub.</sub>
</p>
