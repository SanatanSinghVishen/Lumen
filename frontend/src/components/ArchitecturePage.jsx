import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { fadeUp, staggerContainer } from "../utils/motionVariants";
import { 
  IconBrowser, IconServer, IconTopologyStar3, IconDatabase, 
  IconBrain, IconSearch, IconPencil, IconUserCheck, IconFileCheck, IconReport, IconRefresh
} from "@tabler/icons-react";

/* ------------------------------------------------------------------ */
/*  Color map for card theming                                         */
/* ------------------------------------------------------------------ */
const colorMap = {
  "gemini-blue":   { text: "text-gemini-blue",   border: "border-gemini-blue/30",   glow: "rgba(66,133,244,0.35)",  solid: "#4285f4" },
  "gemini-cyan":   { text: "text-gemini-cyan",   border: "border-gemini-cyan/30",   glow: "rgba(18,181,203,0.35)",  solid: "#12b5cb" },
  "gemini-purple": { text: "text-gemini-purple", border: "border-gemini-purple/30", glow: "rgba(155,114,203,0.35)", solid: "#9b72cb" },
  "gemini-pink":   { text: "text-gemini-pink",   border: "border-gemini-pink/30",   glow: "rgba(235,111,146,0.35)", solid: "#eb6f92" },
};

/* ------------------------------------------------------------------ */
/*  DiagramNode — a glass card with expand-on-click                    */
/* ------------------------------------------------------------------ */
const DiagramNode = ({ icon, title, techLabel, description, delay = 0, color = "gemini-blue" }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const s = colorMap[color];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ scale: 1.02 }}
      onClick={() => setIsExpanded(!isExpanded)}
      className={`glass-card p-6 cursor-pointer border border-[rgba(255,255,255,0.06)] hover:${s.border} transition-all relative bg-[#0d1117]/80 backdrop-blur-xl w-full`}
      style={{ boxShadow: isExpanded ? `0 0 30px ${s.glow}` : "none" }}
    >
      <div className={`${s.text} mb-3 flex items-center gap-3`}>
        {icon}
        <div className="text-[11px] font-mono text-textMuted uppercase tracking-wider">{techLabel}</div>
      </div>
      <div className="font-semibold text-[16px] md:text-[18px] text-text mb-2 leading-tight">{title}</div>
      
      <div className="text-[13px] text-textMuted flex items-center gap-2 mt-3">
        <span className="w-4 h-[1px] bg-textMuted/30" />
        <span className="text-[10px] uppercase tracking-widest text-textMuted/70">{isExpanded ? "Show less" : "Click for detail"}</span>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div 
            initial={{ opacity: 0, height: 0, marginTop: 0 }}
            animate={{ opacity: 1, height: "auto", marginTop: 16 }}
            exit={{ opacity: 0, height: 0, marginTop: 0 }}
            className="text-[13px] md:text-[14px] text-text/80 leading-relaxed overflow-hidden border-t border-[rgba(255,255,255,0.05)] pt-4"
          >
            {description}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

/* ------------------------------------------------------------------ */
/*  Connector — a pure CSS vertical / angled line between cards        */
/*  These sit in normal document flow, so they ALWAYS render.          */
/* ------------------------------------------------------------------ */

const VerticalLine = ({ height = 48, color = "#9b72cb", label, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, scaleY: 0 }}
    whileInView={{ opacity: 1, scaleY: 1 }}
    viewport={{ once: true, margin: "-20px" }}
    transition={{ duration: 0.5, delay }}
    className="flex flex-col items-center"
    style={{ transformOrigin: "top center" }}
  >
    <div 
      className="w-[2px] rounded-full"
      style={{ height, background: `linear-gradient(to bottom, ${color}aa, ${color}55)` }}
    />
    {/* Arrow tip */}
    <div 
      className="w-0 h-0 -mt-[1px]"
      style={{
        borderLeft: "5px solid transparent",
        borderRight: "5px solid transparent",
        borderTop: `6px solid ${color}88`,
      }}
    />
    {label && (
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: delay + 0.3 }}
        className="mt-1 bg-[#0d1117]/90 backdrop-blur-md border border-[rgba(255,255,255,0.08)] px-3 py-1 rounded-full text-[10px] text-textMuted whitespace-nowrap"
      >
        {label}
      </motion.div>
    )}
  </motion.div>
);

/* Branch connector: one node splits into two side-by-side nodes */
const BranchConnector = ({ color = "#9b72cb", delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0 }}
    whileInView={{ opacity: 1 }}
    viewport={{ once: true, margin: "-20px" }}
    transition={{ duration: 0.6, delay }}
    className="relative w-full flex justify-center"
    style={{ height: 48 }}
  >
    {/* Vertical stem from parent */}
    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[2px] h-[24px]" 
         style={{ background: `linear-gradient(to bottom, ${color}aa, ${color}77)` }} />
    {/* Horizontal bar */}
    <div className="absolute top-[24px] left-[25%] right-[25%] h-[2px]"
         style={{ background: `linear-gradient(to right, ${color}77, ${color}aa, ${color}77)` }} />
    {/* Left drop */}
    <div className="absolute top-[24px] left-[25%] -translate-x-1/2 w-[2px] h-[24px]"
         style={{ background: `${color}77` }} />
    {/* Left arrow */}
    <div className="absolute top-[46px] left-[25%] -translate-x-1/2"
         style={{ width: 0, height: 0, borderLeft: "4px solid transparent", borderRight: "4px solid transparent", borderTop: `5px solid ${color}77` }} />
    {/* Right drop */}
    <div className="absolute top-[24px] right-[25%] translate-x-1/2 w-[2px] h-[24px]"
         style={{ background: `${color}77` }} />
    {/* Right arrow */}
    <div className="absolute top-[46px] right-[25%] translate-x-1/2"
         style={{ width: 0, height: 0, borderLeft: "4px solid transparent", borderRight: "4px solid transparent", borderTop: `5px solid ${color}77` }} />
  </motion.div>
);

/* Merge connector: two side-by-side nodes merge into one */
const MergeConnector = ({ color = "#9b72cb", delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0 }}
    whileInView={{ opacity: 1 }}
    viewport={{ once: true, margin: "-20px" }}
    transition={{ duration: 0.6, delay }}
    className="relative w-full flex justify-center"
    style={{ height: 48 }}
  >
    {/* Left rise */}
    <div className="absolute top-0 left-[25%] -translate-x-1/2 w-[2px] h-[24px]"
         style={{ background: `${color}77` }} />
    {/* Right rise */}
    <div className="absolute top-0 right-[25%] translate-x-1/2 w-[2px] h-[24px]"
         style={{ background: `${color}77` }} />
    {/* Horizontal bar */}
    <div className="absolute top-[22px] left-[25%] right-[25%] h-[2px]"
         style={{ background: `linear-gradient(to right, ${color}77, ${color}aa, ${color}77)` }} />
    {/* Vertical stem to child */}
    <div className="absolute top-[22px] left-1/2 -translate-x-1/2 w-[2px] h-[24px]"
         style={{ background: `linear-gradient(to bottom, ${color}aa, ${color}55)` }} />
    {/* Arrow */}
    <div className="absolute top-[44px] left-1/2 -translate-x-1/2"
         style={{ width: 0, height: 0, borderLeft: "4px solid transparent", borderRight: "4px solid transparent", borderTop: `5px solid ${color}77` }} />
  </motion.div>
);

/* Revision loop label — sits to the right of the card stack */
const RevisionLoopLabel = ({ delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, x: 20 }}
    whileInView={{ opacity: 1, x: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.6, delay }}
    className="flex items-center gap-2 mt-2 mb-2 justify-center"
  >
    <div className="flex items-center gap-2 bg-[#0d1117]/90 backdrop-blur-md border border-[rgba(235,111,146,0.2)] px-4 py-2 rounded-full">
      <IconRefresh size={14} className="text-gemini-pink animate-spin" style={{ animationDuration: "3s" }} />
      <span className="text-[11px] text-gemini-pink font-medium tracking-wide">Revision Loop — sends back if score &lt; 75%</span>
    </div>
  </motion.div>
);

/* SSE feedback label */
const SSELabel = ({ delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, x: -20 }}
    whileInView={{ opacity: 1, x: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.6, delay }}
    className="flex items-center gap-2 mt-2 mb-2 justify-center"
  >
    <div className="flex items-center gap-2 bg-[#0d1117]/90 backdrop-blur-md border border-[rgba(18,181,203,0.2)] px-4 py-2 rounded-full">
      <div className="w-2 h-2 rounded-full bg-gemini-cyan animate-pulse" />
      <span className="text-[11px] text-gemini-cyan font-medium tracking-wide">Live updates stream back as the agent works (SSE)</span>
    </div>
  </motion.div>
);


/* ------------------------------------------------------------------ */
/*  Workflow View                                                      */
/* ------------------------------------------------------------------ */
const WorkflowView = () => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
    className="w-full max-w-[700px] mx-auto flex flex-col items-center py-10"
  >
    {/* 1. Orchestrator */}
    <div className="w-full max-w-[360px]">
      <DiagramNode icon={<IconRefresh size={28} />} title="Breaks your question into smaller tasks" techLabel="Orchestrator" description="Analyzes the core goal and delegates specialized research sub-tasks to the worker agents below." color="gemini-purple" delay={0.1} />
    </div>

    {/* Branch: Orchestrator → Web Search + Doc Search */}
    <BranchConnector color="#9b72cb" delay={0.2} />

    {/* 2. Parallel search row */}
    <div className="flex flex-col sm:flex-row gap-6 w-full justify-center">
      <div className="w-full sm:w-1/2 max-w-[320px]">
        <DiagramNode icon={<IconSearch size={28} />} title="Looks things up online" techLabel="Web Search" description="Deep scrapes real-time information from across the web using Tavily." color="gemini-cyan" delay={0.35} />
      </div>
      <div className="w-full sm:w-1/2 max-w-[320px]">
        <DiagramNode icon={<IconDatabase size={28} />} title="Searches your files" techLabel="Document Search" description="Finds relevant paragraphs inside the PDFs/Docs you've uploaded using vector similarity." color="gemini-blue" delay={0.35} />
      </div>
    </div>

    {/* Merge: Web Search + Doc Search → Synthesis */}
    <MergeConnector color="#eb6f92" delay={0.5} />

    {/* 3. Synthesis */}
    <div className="w-full max-w-[360px]">
      <DiagramNode icon={<IconPencil size={28} />} title="Writes the first draft" techLabel="Synthesis" description="Merges all the research context into a coherent, structured Markdown report." color="gemini-pink" delay={0.6} />
    </div>

    <VerticalLine color="#4285f4" delay={0.7} />

    {/* 4. Evaluator */}
    <div className="w-full max-w-[360px]">
      <DiagramNode icon={<IconFileCheck size={28} />} title="Fact-checks and scores" techLabel="Evaluator (FastEval)" description="Scores the draft for accuracy. If the score is below 75%, it automatically sends it back to the Orchestrator for revision." color="gemini-blue" delay={0.8} />
    </div>

    <RevisionLoopLabel delay={0.9} />

    <VerticalLine color="#12b5cb" delay={1.0} />

    {/* 5. Human-in-the-Loop */}
    <div className="w-full max-w-[360px]">
      <DiagramNode icon={<IconUserCheck size={28} />} title="A human reviews it" techLabel="Human-in-the-Loop" description="You get to approve the final draft, or provide feedback notes to send it through another revision cycle." color="gemini-cyan" delay={1.1} />
    </div>

    <VerticalLine color="#9b72cb" delay={1.2} />

    {/* 6. Final Report */}
    <div className="w-full max-w-[360px]">
      <DiagramNode icon={<IconReport size={28} />} title="Your finished document" techLabel="Final Report" description="The successfully vetted and finalized research report, ready to be exported." color="gemini-purple" delay={1.3} />
    </div>
  </motion.div>
);


/* ------------------------------------------------------------------ */
/*  Components View                                                    */
/* ------------------------------------------------------------------ */
const ComponentsView = () => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
    className="w-full max-w-[700px] mx-auto flex flex-col items-center py-10"
  >
    {/* 1. Browser */}
    <div className="w-full max-w-[360px]">
      <DiagramNode icon={<IconBrowser size={28} />} title="What you're looking at right now" techLabel="Your Browser" description="The React frontend running in your browser, connecting via HTTP and listening to a live SSE stream for real-time tokens." color="gemini-cyan" delay={0.1} />
    </div>

    <VerticalLine color="#9b72cb" label="Sends your question" delay={0.2} />

    {/* 2. Backend */}
    <div className="w-full max-w-[360px]">
      <DiagramNode icon={<IconServer size={28} />} title="The receptionist" techLabel="FastAPI Backend" description="A blazing fast Python API that takes your request, hands it to the AI pipeline, and pipes the live output back to you." color="gemini-purple" delay={0.3} />
    </div>

    <SSELabel delay={0.35} />

    <VerticalLine color="#4285f4" label="Hands off the work" delay={0.4} />

    {/* 3. Pipeline + ChromaDB side by side */}
    <div className="flex flex-col lg:flex-row gap-6 w-full justify-center">
      <div className="w-full lg:w-1/2 max-w-[320px]">
        <DiagramNode icon={<IconTopologyStar3 size={28} />} title="The assembly line" techLabel="LangGraph Pipeline" description="Routes your question through specialized AI steps, running loops if it needs to fact-check or correct its own mistakes." color="gemini-blue" delay={0.5} />
      </div>
      <div className="w-full lg:w-1/2 max-w-[320px] flex flex-col items-center">
        <DiagramNode icon={<IconDatabase size={28} />} title="A private library" techLabel="ChromaDB" description="A vector database storing all the files you upload. The agent queries this library to ground its answers in your data." color="gemini-blue" delay={0.6} />
        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.7 }}
          className="mt-2 bg-[#0d1117]/90 backdrop-blur-md border border-[rgba(66,133,244,0.15)] px-3 py-1 rounded-full text-[10px] text-gemini-blue/80"
        >
          ← Pipeline queries this for your docs
        </motion.div>
      </div>
    </div>

    <VerticalLine color="#eb6f92" label="Asks the AI to think" delay={0.8} />

    {/* 4. LLM */}
    <div className="w-full max-w-[360px]">
      <DiagramNode icon={<IconBrain size={28} />} title="The thinking part" techLabel="OpenRouter / LLM" description="The actual AI model (Gemini 2.5 Flash) that writes the report, reasons through data, and evaluates the final output." color="gemini-pink" delay={0.9} />
    </div>
  </motion.div>
);


/* ------------------------------------------------------------------ */
/*  Main Page                                                          */
/* ------------------------------------------------------------------ */
export default function ArchitecturePage() {
  const [activeTab, setActiveTab] = useState("workflow");

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="visible" exit="exit" className="flex flex-col flex-1 items-center py-12 relative overflow-hidden z-10">
      <div className="w-full max-w-[1200px] px-6 relative z-10">
        <motion.div variants={fadeUp} className="mb-12 text-center">
          <h1 className="text-[40px] md:text-[50px] font-bold mb-4 tracking-tight text-text">How Lumen Works</h1>
          <p className="text-[16px] text-textMuted max-w-2xl mx-auto leading-relaxed font-light">
            LUMEN works in two parts: what it's built with, and how a request flows through it.
          </p>
        </motion.div>

        <div className="flex justify-center mb-16">
          <div className="glass-panel p-1.5 flex gap-2 rounded-full border border-[rgba(255,255,255,0.05)] bg-[#0d1117]/80 backdrop-blur-md">
            <button 
              onClick={() => setActiveTab("workflow")}
              className={`px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${activeTab === "workflow" ? "bg-[rgba(255,255,255,0.1)] text-text shadow-[0_0_20px_rgba(255,255,255,0.05)]" : "text-textMuted hover:text-text/80"}`}
            >
              Workflow View
            </button>
            <button 
              onClick={() => setActiveTab("components")}
              className={`px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${activeTab === "components" ? "bg-[rgba(255,255,255,0.1)] text-text shadow-[0_0_20px_rgba(255,255,255,0.05)]" : "text-textMuted hover:text-text/80"}`}
            >
              Components View
            </button>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === "workflow" ? <WorkflowView key="workflow" /> : <ComponentsView key="components" />}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
