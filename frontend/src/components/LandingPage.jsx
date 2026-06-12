import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { IconSitemap, IconWorldSearch, IconBrain, IconUserCheck, IconSearch, IconArrowRight } from "@tabler/icons-react";
import { API_URL } from "../App";

export default function LandingPage() {
  const [query, setQuery] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

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
    { num: "01", icon: <IconSitemap size={22} stroke={1.5} />, label: "Orchestrator decomposes", desc: "Breaks your query into parallel tasks" },
    { num: "02", icon: <IconWorldSearch size={22} stroke={1.5} />, label: "Agents retrieve", desc: "Scours the web & documents instantly" },
    { num: "03", icon: <IconBrain size={22} stroke={1.5} />, label: "LLM-as-judge scores", desc: "Synthesises and evaluates confidence" },
    { num: "04", icon: <IconUserCheck size={22} stroke={1.5} />, label: "You approve", desc: "Final human review and feedback" },
  ];

  return (
    <div className="flex flex-col w-full">
      {/* Hero Section */}
      <section className="flex flex-col items-center text-center pt-16 pb-10 px-6">
        <div className="inline-flex items-center px-3 py-1 bg-[#EBF2FF] text-[#1A56DB] text-[11px] font-medium border border-[#B5D4F4] rounded-full mb-6">
          <span className="mr-1">⚡</span> Agentic AI · Multi-Agent · RAG · HITL
        </div>
        
        <h1 className="text-[40px] font-medium leading-[1.2] tracking-tight mb-4 text-[#111827]">
          Research anything.<br />
          <span className="text-[#1A56DB]">Verified by AI, approved by you.</span>
        </h1>
        
        <p className="text-[15px] text-[#6B7280] max-w-[480px] mb-8 leading-relaxed">
          Type a topic. Lumen deploys parallel agents to search the web, retrieve documents, synthesise findings, and score its own confidence — before asking you to approve.
        </p>

        <form onSubmit={handleSubmit} className="w-full max-w-[560px] relative mb-3">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#6B7280]">
            <IconSearch size={18} stroke={2} />
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Latest breakthroughs in quantum error correction 2025"
            className="w-full h-[52px] pl-11 pr-32 bg-[#F9FAFB] border-custom rounded-xl text-[15px] focus:bg-white placeholder:text-[#9CA3AF]"
            disabled={submitting}
          />
          <div className="absolute inset-y-0 right-1.5 flex items-center">
            <button 
              type="submit" 
              disabled={submitting || !query.trim()}
              className="h-10 px-4 bg-[#1A56DB] text-white text-[13px] font-medium rounded-lg hover:bg-[#1546b5] disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              Research <IconArrowRight size={14} className="ml-1" stroke={2} />
            </button>
          </div>
        </form>
        <div className="text-[11px] text-[#9CA3AF]">
          Takes ~25 seconds · Try the live demo
        </div>
      </section>

      {/* Animated Pipeline Strip */}
      <section className="w-full bg-[var(--color-background-secondary)] py-8 px-6 border-custom border-t border-b border-l-0 border-r-0">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-[11px] uppercase tracking-widest text-[#9CA3AF] font-medium mb-6 text-center">
            How Lumen works
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {steps.map((step, idx) => (
              <div 
                key={idx} 
                className="bg-white border-custom rounded-xl p-4 flex flex-col items-center text-center animate-fade-in-up"
                style={{ animationDelay: `${idx * 80}ms` }}
              >
                <div className="w-full flex justify-between items-start mb-3">
                  <span className="text-[10px] font-medium text-[#1A56DB]">{step.num}</span>
                  <div className="text-[#1A56DB]">{step.icon}</div>
                </div>
                <h3 className="text-[12px] font-medium text-[#111827] mb-1.5 w-full text-left">{step.label}</h3>
                <p className="text-[11px] text-[#6B7280] w-full text-left leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tech Stack Strip */}
      <section className="w-full py-4 px-6 mt-auto">
        <div className="max-w-4xl mx-auto flex flex-wrap justify-center gap-2">
          {["LangGraph", "FastAPI", "ChromaDB", "Redis", "Gemini 2.5 Flash", "Tavily", "LangSmith", "Docker"].map((tech) => (
            <div key={tech} className="px-3 py-1 bg-[var(--color-background-secondary)] border-custom rounded-full text-[11px] text-[#6B7280]">
              {tech}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
