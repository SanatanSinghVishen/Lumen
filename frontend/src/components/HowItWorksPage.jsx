import { useState } from "react";
import { IconSitemap, IconWorldSearch, IconBrain, IconUserCheck, IconPencil } from "@tabler/icons-react";
import { motion, AnimatePresence } from "framer-motion";
import { fadeUp, staggerContainer, staggerItem } from "../utils/motionVariants";

export default function HowItWorksPage() {
  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    {
      id: "orchestrator",
      icon: <IconSitemap size={24} stroke={1.5} />,
      title: "1. Orchestrator Decomposes",
      desc: "Gemini 2.5 Flash decomposes your query into focused sub-tasks. On retries, it receives the evaluator's feedback and adjusts the subtasks to address gaps identified in the previous attempt."
    },
    {
      id: "search",
      icon: <IconWorldSearch size={24} stroke={1.5} />,
      title: "2. Web & Document Search",
      desc: "Two agents fan out in parallel: Tavily deep-searches the live web , while the RAG agent queries your uploaded documents in ChromaDB using cosine similarity on all-MiniLM-L6-v2 embeddings."
    },
    {
      id: "synthesis",
      icon: <IconPencil size={24} stroke={1.5} />,
      title: "3. Synthesis (Streaming)",
      desc: "Both agents fan back in. Gemini 2.5 Flash merges all context into a structured Markdown report via async streaming — tokens flow live to your browser via SSE. Conflicts are flagged with a markers."
    },
    {
      id: "evaluator",
      icon: <IconBrain size={24} stroke={1.5} />,
      title: "4. Dual Evaluation",
      desc: "Two evaluators run in sequence: RAGAS computes Faithfulness and Answer Relevancy, then an LLM-as-Judge scores relevance, groundedness, and completeness. If Overall Score < 0.75, the pipeline retries (up to 3×)."
    },
    {
      id: "hitl",
      icon: <IconUserCheck size={24} stroke={1.5} />,
      title: "5. Human-in-the-Loop",
      desc: "LangGraph pauses the graph and serializes state to the checkpointer. You review the report with all metrics, then approve to export or reject with feedback to trigger a revision cycle."
    },
  ];

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="flex flex-col flex-1 items-center relative overflow-hidden pb-24 z-10"
    >

      {/* Hero Header */}
      <motion.div
        variants={fadeUp}
        className="w-full text-center py-16 px-6 relative z-10"
      >
        <h1 className="text-[40px] font-bold mb-4 tracking-tight text-text drop-shadow-md">How it works</h1>
        <p className="text-[16px] text-textMuted max-w-[600px] mx-auto leading-relaxed font-light drop-shadow-sm">
          LUMEN is powered by LangGraph, allowing us to build cyclic, stateful multi-agent workflows. Here is what happens under the hood when you hit enter.
        </p>
      </motion.div>

      {/* Interactive Timeline */}
      <div className="w-full max-w-[1000px] px-6 relative z-10">
        <div className="flex flex-col md:flex-row gap-8">

          {/* Left: Step List */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="w-full md:w-1/3 flex flex-col space-y-3"
          >
            {steps.map((step, idx) => (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                key={step.id}
                onMouseEnter={() => setActiveStep(idx)}
                onClick={() => setActiveStep(idx)}
                className={`flex items-center gap-4 w-full text-left p-4 rounded-2xl transition-all duration-300 border ${activeStep === idx
                  ? "bg-[rgba(255,255,255,0.08)] border-[rgba(255,255,255,0.15)] shadow-[0_0_20px_rgba(66,133,244,0.15)] text-text"
                  : "bg-transparent border-transparent text-textMuted hover:bg-[rgba(255,255,255,0.03)] hover:text-text/80"
                  }`}
              >
                <div className={`p-2.5 rounded-xl transition-all duration-300 ${activeStep === idx ? "bg-[rgba(255,255,255,0.05)] text-gemini-blue border border-[rgba(255,255,255,0.1)] shadow-[0_0_10px_rgba(66,133,244,0.3)]" : "bg-transparent text-textMuted"
                  }`}>
                  {step.icon}
                </div>
                <span className="text-[14px] font-medium">{step.title}</span>
              </motion.button>
            ))}
          </motion.div>

          {/* Right: Step Details */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
            className="w-full md:w-2/3 flex items-center justify-center"
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={activeStep}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.4 }}
                className="w-full glass-card p-10 min-h-[350px] flex flex-col justify-center relative overflow-hidden group"
              >
                {/* Subtle background glow based on active step */}
                <div className="absolute -top-20 -right-20 w-64 h-64 bg-gemini-blue/10 blur-[80px] rounded-full pointer-events-none transition-opacity duration-1000"></div>

                <div className="text-gemini-cyan mb-8 p-4 bg-[rgba(255,255,255,0.03)] w-max rounded-2xl border border-[rgba(255,255,255,0.05)] shadow-[0_0_20px_rgba(18,181,203,0.15)]">
                  {steps[activeStep].icon}
                </div>
                <h2 className="text-[26px] font-medium text-text mb-4">
                  {steps[activeStep].title}
                </h2>
                <p className="text-[16px] text-textMuted leading-relaxed font-light">
                  {steps[activeStep].desc}
                </p>
              </motion.div>
            </AnimatePresence>
          </motion.div>

        </div>
      </div>
    </motion.div>
  );
}
