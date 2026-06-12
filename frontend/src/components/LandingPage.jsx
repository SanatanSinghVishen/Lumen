import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { IconSitemap, IconWorldSearch, IconBrain, IconUserCheck, IconSearch, IconArrowRight } from "@tabler/icons-react";
import { API_URL } from "../App";

export default function LandingPage() {
  const [query, setQuery] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showColdStartBanner, setShowColdStartBanner] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkHealth = async () => {
      const start = Date.now();
      try {
        await fetch(`${API_URL}/health`);
        const elapsed = Date.now() - start;
        if (elapsed > 3000) setShowColdStartBanner(true);
      } catch {
        setShowColdStartBanner(true);
      }
    };
    checkHealth();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });
      const data = await res.json();
      navigate(`/loading/${data.thread_id}`);
    } catch (err) {
      console.error(err);
      setSubmitting(false);
    }
  };

  const steps = [
    { num: "01", icon: <IconSitemap size={20} stroke={1.5} />, label: "Orchestrator decomposes", desc: "Breaks your query into parallel tasks" },
    { num: "02", icon: <IconWorldSearch size={20} stroke={1.5} />, label: "Agents retrieve", desc: "Scours the web & documents instantly" },
    { num: "03", icon: <IconBrain size={20} stroke={1.5} />, label: "LLM-as-judge scores", desc: "Synthesises and evaluates confidence" },
    { num: "04", icon: <IconUserCheck size={20} stroke={1.5} />, label: "You approve", desc: "Final human review and feedback" },
  ];

  const EXAMPLE_QUERIES = [
    "LangGraph vs AutoGen: which is better for production AI agents?",
    "Breakthroughs in LLM reasoning and planning in 2025",
    "How does RAG compare to fine-tuning for enterprise knowledge bases?",
  ];

  return (
    <div className="flex flex-col w-full relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-[-20%] left-1/2 transform -translate-x-1/2 w-[800px] h-[400px] bg-[#0070F3] opacity-20 blur-[120px] rounded-full pointer-events-none"></div>

      {showColdStartBanner && (
        <div className="bg-[#111] border-b border-[#333] px-6 py-2 text-[12px] text-[#888] flex items-center justify-center gap-2">
          <i className="ti ti-clock animate-pulse" aria-hidden="true" />
          Backend is warming up from a cold start — your first query may take an extra 30–60 seconds.
        </div>
      )}

      {/* Hero Section */}
      <section className="flex flex-col items-center text-center pt-24 pb-16 px-6 relative z-10">
        <div className="inline-flex items-center px-4 py-1.5 bg-[#111] text-[#EDEDED] text-[11px] font-medium border border-[#333] rounded-full mb-8 shadow-[0_0_15px_rgba(255,255,255,0.05)]">
          <span className="mr-2 text-[#0070F3] animate-pulse">●</span> Agentic AI · Multi-Agent · RAG · HITL
        </div>
        
        <h1 className="text-[48px] sm:text-[56px] font-bold leading-[1.1] tracking-tight mb-6 text-transparent bg-clip-text bg-gradient-to-b from-white to-[#888]">
          Research anything.<br />
          Verified by AI, approved by you.
        </h1>
        
        <p className="text-[16px] text-[#888] max-w-[540px] mb-10 leading-relaxed font-light">
          Type a topic. Lumen deploys parallel agents to search the web, retrieve documents, synthesise findings, and score its own confidence — before asking you to approve.
        </p>

        <form onSubmit={handleSubmit} className="w-full max-w-[600px] relative mb-6">
          <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-[#555]">
            <IconSearch size={20} stroke={2} />
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Latest breakthroughs in quantum error correction 2025"
            className="w-full h-[60px] pl-14 pr-36 bg-[#0A0A0A] border border-[#333] rounded-2xl text-[15px] text-[#EDEDED] focus:border-[#0070F3] focus:bg-[#000] focus:shadow-[0_0_20px_rgba(0,112,243,0.3)] transition-all placeholder:text-[#555] outline-none"
            disabled={submitting}
          />
          <div className="absolute inset-y-0 right-2 flex items-center">
            <button 
              type="submit" 
              disabled={submitting || !query.trim()}
              className="h-11 px-6 bg-[#EDEDED] text-[#000] text-[13px] font-bold rounded-xl hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center transition-colors"
            >
              Research <IconArrowRight size={16} className="ml-1.5" stroke={2} />
            </button>
          </div>
        </form>

        <div className="flex gap-3 flex-wrap justify-center mb-8">
          {EXAMPLE_QUERIES.map((q) => (
            <button
              key={q}
              onClick={() => setQuery(q)}
              className="text-[12px] px-4 py-2 rounded-full bg-[#111] border border-[#222] text-[#888] hover:border-[#444] hover:text-[#EDEDED] transition-colors"
            >
              {q}
            </button>
          ))}
        </div>

        <div className="text-[12px] text-[#555] font-mono">
          Takes ~25 seconds · Try the live demo
        </div>
      </section>

      {/* Animated Pipeline Strip */}
      <section className="w-full py-16 px-6 relative z-10 border-t border-[#111] bg-gradient-to-b from-[#000] to-[#0A0A0A]">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {steps.map((step, idx) => (
              <div 
                key={idx} 
                className="bg-[#0A0A0A] border border-[#222] rounded-2xl p-6 flex flex-col items-start hover:border-[#444] transition-colors animate-fade-in-up"
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                <div className="w-full flex justify-between items-center mb-6">
                  <span className="text-[11px] font-mono text-[#555]">{step.num}</span>
                  <div className="text-[#EDEDED] bg-[#111] p-2 rounded-lg border border-[#222]">{step.icon}</div>
                </div>
                <h3 className="text-[14px] font-medium text-[#EDEDED] mb-2">{step.label}</h3>
                <p className="text-[13px] text-[#888] leading-relaxed font-light">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tech Stack Strip */}
      <section className="w-full py-8 px-6 mt-auto border-t border-[#111]">
        <div className="max-w-4xl mx-auto flex flex-wrap justify-center gap-3">
          {["LangGraph", "FastAPI", "ChromaDB", "Redis", "Gemini 2.5 Flash", "Tavily", "LangSmith", "Docker"].map((tech) => (
            <div key={tech} className="px-4 py-1.5 bg-[#0A0A0A] border border-[#222] rounded-full text-[12px] text-[#555] font-mono">
              {tech}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
