import { useState } from "react";
import { Link } from "react-router-dom";

export default function HowItWorksPage() {
  const steps = [
    {
      id: "orchestrator",
      icon: "ti-sitemap",
      title: "1. The Orchestrator",
      desc: "When you ask a complex question, the Orchestrator acts as the brain. It breaks down your large query into 2-4 smaller, highly specific sub-tasks so nothing gets missed."
    },
    {
      id: "search",
      icon: "ti-world-search",
      title: "2. Web & Document Search",
      desc: "Dedicated Search Agents hit the live internet and scan local documents in parallel, gathering raw facts, citations, and context for each of the sub-tasks."
    },
    {
      id: "synthesis",
      icon: "ti-pencil",
      title: "3. Synthesis",
      desc: "An AI Writer weaves all the messy, overlapping search results into a clean, comprehensive, and well-structured draft report."
    },
    {
      id: "evaluate",
      icon: "ti-brain",
      title: "4. Mathematical Evaluation",
      desc: "Before you even see it, an AI Judge and a strict mathematical framework (RAGAS) score the report. If the report hallucinates or drifts off-topic, it is automatically sent back to be rewritten!"
    },
    {
      id: "hitl",
      icon: "ti-user-check",
      title: "5. Human in the Loop",
      desc: "The system pauses and hands the draft to you. You can approve it, edit it yourself, or instantly send it back to the AI with notes for a revision."
    }
  ];

  const [activeStep, setActiveStep] = useState(null);

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-[#FAFAFA] min-h-full">
      <div className="max-w-3xl w-full">
        <h1 className="text-3xl font-medium text-[#111827] mb-4 text-center">How Lumen Works</h1>
        <p className="text-sm text-[#6B7280] text-center mb-12 max-w-xl mx-auto">
          Lumen isn't just a chatbot—it's a multi-agent system. This means multiple AI agents work together in a cycle to research, write, and verify information before it ever reaches you.
        </p>

        <div className="space-y-4">
          {steps.map((step, idx) => (
            <div 
              key={step.id}
              className="bg-white border-custom rounded-xl p-5 cursor-pointer transition-all hover:shadow-sm hover:border-[#1A56DB]"
              onMouseEnter={() => setActiveStep(idx)}
              onMouseLeave={() => setActiveStep(null)}
            >
              <div className="flex items-start space-x-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${activeStep === idx ? 'bg-[#1A56DB] text-white' : 'bg-[#F1F5F9] text-[#6B7280]'}`}>
                  <i className={`ti ${step.icon} text-lg`}></i>
                </div>
                <div>
                  <h3 className={`text-sm font-medium transition-colors ${activeStep === idx ? 'text-[#1A56DB]' : 'text-[#111827]'}`}>
                    {step.title}
                  </h3>
                  <p className="text-xs text-[#6B7280] mt-2 leading-relaxed">
                    {step.desc}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Link to="/" className="inline-flex items-center space-x-2 text-sm text-[#1A56DB] hover:underline font-medium">
            <span>Try it out yourself</span>
            <i className="ti ti-arrow-right"></i>
          </Link>
        </div>
      </div>
    </div>
  );
}
