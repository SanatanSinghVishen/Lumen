import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IconSparkles } from "@tabler/icons-react";

const TECH_FACTS = [
  "💡 Did you know? The term 'Artificial Intelligence' was first coined at Dartmouth College in 1956.",
  "⚡ Fun Fact: Hybrid search combines BM25 keyword matching with vector embeddings for peak RAG precision.",
  "🤖 AI Joke: Why do AI agents love LangGraph? Because they prefer cyclic graphs over dead ends!",
  "🧠 Did you know? Transformer self-attention allows LLMs to weigh the relevance of every word across a document.",
  "📄 Fun Fact: Layout-aware PDF extraction preserves Markdown table structures so LLMs read rows accurately.",
  "🚀 AI Joke: What is an LLM's favorite snack? Context chips with freshly embedded vectors!",
  "🔍 Did you know? Reciprocal Rank Fusion (RRF) merges keyword and semantic rankings effortlessly.",
  "✨ Fun Fact: Gemini 2.5 Flash handles over 1,000,000 tokens of context in a single prompt!"
];

export default function TechFactBanner({ className = "" }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % TECH_FACTS.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className={`w-full ${className}`}>
      <div className="glass-panel px-5 py-3.5 border border-[rgba(255,255,255,0.1)] bg-[#0d1117]/95 backdrop-blur-md rounded-2xl flex items-center gap-3.5 shadow-xl min-h-[56px]">
        <div className="p-2 rounded-xl bg-gemini-purple/15 text-gemini-purple border border-gemini-purple/30 shrink-0">
          <IconSparkles size={18} className="animate-pulse" />
        </div>
        <div className="flex-1 min-w-0">
          <AnimatePresence mode="wait">
            <motion.p
              key={index}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="text-[13px] text-textMuted/90 font-light leading-relaxed text-left break-words"
            >
              {TECH_FACTS[index]}
            </motion.p>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
