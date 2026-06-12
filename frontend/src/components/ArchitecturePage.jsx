import { Link } from "react-router-dom";

export default function ArchitecturePage() {
  const stack = [
    { name: "React + Vite", type: "Frontend", desc: "A blazing fast, responsive user interface.", icon: "ti-brand-react" },
    { name: "FastAPI", type: "Backend", desc: "Python web framework managing SSE streams and endpoints.", icon: "ti-server" },
    { name: "LangGraph", type: "AI Orchestration", desc: "Manages the stateful, cyclic graphs where agents live.", icon: "ti-vector" },
    { name: "PostgreSQL", type: "Memory / Checkpointing", desc: "Saves the 'brain state' of the agent so it can be paused for human review.", icon: "ti-database" },
    { name: "OpenRouter", type: "LLM Access", desc: "Routes prompts to massive open-source models like Llama 3.", icon: "ti-cpu" }
  ];

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-[#FAFAFA] min-h-full">
      <div className="max-w-4xl w-full">
        <h1 className="text-3xl font-medium text-[#111827] mb-4 text-center">Under the Hood</h1>
        <p className="text-sm text-[#6B7280] text-center mb-12 max-w-xl mx-auto">
          Lumen relies on a modern, decoupled tech stack designed to handle asynchronous AI workloads, Server-Sent Events, and stateful memory check-pointing.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {stack.map((item, idx) => (
            <div key={idx} className="bg-white border-custom rounded-xl p-5 hover:shadow-sm transition-all hover:-translate-y-1">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-[#EBF2FF] text-[#1A56DB] flex items-center justify-center">
                  <i className={`ti ${item.icon}`}></i>
                </div>
                <div>
                  <h3 className="text-[13px] font-medium text-[#111827]">{item.name}</h3>
                  <p className="text-[10px] uppercase tracking-wider text-[#9CA3AF] font-bold mt-0.5">{item.type}</p>
                </div>
              </div>
              <p className="text-xs text-[#6B7280] leading-relaxed">
                {item.desc}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-16 bg-white border-custom rounded-xl p-8 text-center max-w-2xl mx-auto">
          <h2 className="text-lg font-medium text-[#111827] mb-3">Why LangGraph?</h2>
          <p className="text-xs text-[#6B7280] leading-relaxed mb-6">
            Traditional AI chains (like standard LangChain) move in a straight line. If they make a mistake, they fail. LangGraph allows Lumen to loop backwards. If the Evaluator node detects hallucination, it literally sends the flow backwards to the Orchestrator to try again!
          </p>
          <a href="https://github.com/SanatanSinghVishen/Lumen" target="_blank" rel="noreferrer" className="inline-flex items-center justify-center h-9 px-4 bg-[#111827] text-white text-xs font-medium rounded-lg hover:bg-[#374151] transition-colors">
            View Source on GitHub
          </a>
        </div>
      </div>
    </div>
  );
}
