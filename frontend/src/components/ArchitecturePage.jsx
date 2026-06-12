import ReactMarkdown from "react-markdown";

const ARCHITECTURE_CONTENT = `
## Why LangGraph?

Traditional LLM workflows are linear (like LangChain chains). But research requires loops: if an agent finds conflicting information, it needs to go back and search again. 

LangGraph allows us to build **cyclic graphs** with persistent memory. 
- **Stateful:** The entire pipeline shares a single \`AgentState\` object.
- **Checkpointer:** PostgreSQL automatically saves the state at every step.
- **Human-in-the-Loop:** LangGraph natively supports pausing execution (Interrupts) to let a human review the state before resuming.

---

## The Tech Stack

LUMEN is built with modern, production-ready tools:

* **React + Vite:** For a blazing fast, progressive SPA frontend.
* **FastAPI:** Python backend for seamless integration with LangGraph.
* **LangGraph:** The orchestrator for multi-agent cyclic workflows.
* **PostgreSQL:** Persistent checkpointer for LangGraph memory.
* **Tavily:** Deep-search API optimized for LLM agents.
* **ChromaDB:** Local vector store for document embeddings.
* **RAGAS:** Evaluation framework for RAG metrics.
* **OpenRouter:** Routing LLM calls to Llama 3.3 and Gemini 2.5 Flash.
`;

export default function ArchitecturePage() {
  return (
    <div className="flex flex-col flex-1 bg-[#000000] items-center py-16 relative overflow-hidden">
      
      <div className="w-full max-w-[800px] px-6 relative z-10">
        
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-[40px] font-bold text-[#EDEDED] mb-4 tracking-tight">Architecture</h1>
          <p className="text-[16px] text-[#888] leading-relaxed font-light">
            An overview of the stateful multi-agent system and the technologies powering LUMEN.
          </p>
        </div>

        {/* Visual Diagram (Mockup using CSS grid) */}
        <div className="w-full bg-[#0A0A0A] border border-[#222] rounded-2xl p-8 mb-16 shadow-[0_0_30px_rgba(0,112,243,0.05)]">
          <div className="text-[11px] font-mono uppercase text-[#555] tracking-widest mb-6">
            System Topology
          </div>
          
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            
            <div className="flex flex-col gap-3 w-full md:w-1/4">
              <div className="bg-[#111] border border-[#333] p-3 rounded-lg text-center text-[12px] text-[#EDEDED] font-mono">React Frontend</div>
              <div className="bg-[#111] border border-[#333] p-3 rounded-lg text-center text-[12px] text-[#EDEDED] font-mono">FastAPI Server</div>
            </div>

            <div className="text-[#555]">→</div>

            <div className="w-full md:w-1/2 bg-[#000] border border-[#0070F3] border-opacity-50 rounded-xl p-5 relative overflow-hidden group">
              <div className="absolute inset-0 bg-[#0070F3] opacity-5 group-hover:opacity-10 transition-opacity" />
              <div className="text-[12px] font-mono text-[#0070F3] mb-4 text-center">LangGraph Orchestrator</div>
              
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-[#111] border border-[#222] p-2 rounded text-center text-[10px] text-[#888]">Tavily Search</div>
                <div className="bg-[#111] border border-[#222] p-2 rounded text-center text-[10px] text-[#888]">RAG Retrieval</div>
                <div className="bg-[#111] border border-[#222] p-2 rounded text-center text-[10px] text-[#888]">LLM Synthesis</div>
                <div className="bg-[#111] border border-[#222] p-2 rounded text-center text-[10px] text-[#888]">RAGAS Eval</div>
              </div>
            </div>

            <div className="text-[#555]">→</div>

            <div className="flex flex-col gap-3 w-full md:w-1/4">
              <div className="bg-[#111] border border-[#333] p-3 rounded-lg text-center text-[12px] text-[#EDEDED] font-mono">Postgres (Memory)</div>
            </div>

          </div>
        </div>

        {/* Markdown Content */}
        <div className="prose prose-invert w-full max-w-none text-[15px]">
          <ReactMarkdown>{ARCHITECTURE_CONTENT}</ReactMarkdown>
        </div>

      </div>

    </div>
  );
}
