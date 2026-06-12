import { useState } from "react";
import { IconSitemap, IconWorldSearch, IconBrain, IconUserCheck, IconPencil } from "@tabler/icons-react";

export default function HowItWorksPage() {
  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    { 
      id: "orchestrator",
      icon: <IconSitemap size={24} stroke={1.5} />, 
      title: "1. Orchestrator Decomposes", 
      desc: "When you submit a query, the Orchestrator agent breaks it down into multiple parallel sub-tasks. It figures out exactly what information is needed to answer your complex question."
    },
    { 
      id: "search",
      icon: <IconWorldSearch size={24} stroke={1.5} />, 
      title: "2. Web & Document Search", 
      desc: "Lumen concurrently searches the live internet (via Tavily) and local documents (via ChromaDB) to gather the most relevant and up-to-date context for every sub-task."
    },
    { 
      id: "synthesis",
      icon: <IconPencil size={24} stroke={1.5} />, 
      title: "3. Synthesis", 
      desc: "A powerful LLM takes all the retrieved context and synthesizes it into a comprehensive markdown report. It resolves conflicting information and explicitly flags any gaps in the data."
    },
    { 
      id: "evaluator",
      icon: <IconBrain size={24} stroke={1.5} />, 
      title: "4. RAGAS Evaluator", 
      desc: "Before showing you the report, LUMEN grades its own work. It uses RAGAS metrics to calculate Faithfulness (are claims supported?) and Answer Relevancy, ensuring high quality."
    },
    { 
      id: "hitl",
      icon: <IconUserCheck size={24} stroke={1.5} />, 
      title: "5. Human-in-the-Loop", 
      desc: "The system pauses and waits for your approval. You can export the finalized report, or type feedback to send the agent back to the drawing board for a revision."
    },
  ];

  return (
    <div className="flex flex-col flex-1 bg-[#000000] items-center relative overflow-hidden pb-20">
      
      {/* Hero Header */}
      <div className="w-full text-center py-20 px-6 relative z-10">
        <h1 className="text-[40px] font-bold text-[#EDEDED] mb-4 tracking-tight">How it works</h1>
        <p className="text-[16px] text-[#888] max-w-[600px] mx-auto leading-relaxed font-light">
          LUMEN is powered by LangGraph, allowing us to build cyclic, stateful multi-agent workflows. Here is what happens under the hood when you hit enter.
        </p>
      </div>

      {/* Interactive Timeline */}
      <div className="w-full max-w-[900px] px-6 relative z-10">
        <div className="flex flex-col md:flex-row gap-12">
          
          {/* Left: Step List */}
          <div className="w-full md:w-1/3 flex flex-col space-y-2">
            {steps.map((step, idx) => (
              <button
                key={step.id}
                onMouseEnter={() => setActiveStep(idx)}
                onClick={() => setActiveStep(idx)}
                className={`flex items-center gap-4 w-full text-left p-4 rounded-xl transition-all duration-300 border ${
                  activeStep === idx 
                    ? "bg-[#111] border-[#333] shadow-[0_0_20px_rgba(0,112,243,0.1)] text-[#EDEDED]" 
                    : "bg-transparent border-transparent text-[#555] hover:bg-[#0A0A0A] hover:text-[#888]"
                }`}
              >
                <div className={`p-2 rounded-lg transition-colors ${
                  activeStep === idx ? "bg-[#0A0A0A] text-[#0070F3] border border-[#222]" : "bg-transparent text-[#555]"
                }`}>
                  {step.icon}
                </div>
                <span className="text-[14px] font-medium">{step.title}</span>
              </button>
            ))}
          </div>

          {/* Right: Step Details */}
          <div className="w-full md:w-2/3 flex items-center justify-center">
            <div className="w-full bg-[#0A0A0A] border border-[#222] rounded-2xl p-8 min-h-[300px] flex flex-col justify-center transition-all duration-500" key={activeStep}>
              <div className="text-[#0070F3] mb-6 p-4 bg-[#111] w-max rounded-xl border border-[#222] shadow-[0_0_15px_rgba(0,112,243,0.15)]">
                {steps[activeStep].icon}
              </div>
              <h2 className="text-[24px] font-medium text-[#EDEDED] mb-4">
                {steps[activeStep].title}
              </h2>
              <p className="text-[15px] text-[#888] leading-relaxed font-light">
                {steps[activeStep].desc}
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
