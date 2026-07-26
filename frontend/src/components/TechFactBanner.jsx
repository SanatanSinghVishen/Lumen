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
      <div className="glass-panel px-4 py-3 border border-[rgba(255,255,255,0.08)] bg-[#0d1117]/90 backdrop-blur-md rounded-xl flex items-center gap-3 overflow-hidden shadow-lg min-h-[48px]">
        <div className="p-1.5 rounded-lg bg-gemini-purple/10 text-gemini-purple border border-gemini-purple/20 shrink-0">
          <IconSparkles size={16} className="animate-pulse" />
        </div>
        <div className="flex-1 overflow-hidden relative flex items-center min-h-[24px]">
          <AnimatePresence mode="wait">
            <motion.p
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="text-[12px] text-textMuted font-light leading-snug"
            >
              {TECH_FACTS[index]}
            </motion.p>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
