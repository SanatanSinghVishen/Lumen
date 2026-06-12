import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Search, Loader2 } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export default function QueryPage() {
  const [query, setQuery] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [threadId, setThreadId] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    
    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });
      const data = await res.json();
      setThreadId(data.thread_id);
    } catch (err) {
      console.error(err);
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (!threadId) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${API_URL}/review/${threadId}`);
        const data = await res.json();
        if (data.status === "awaiting_review") {
          clearInterval(interval);
          navigate(`/review/${threadId}`);
        } else if (data.status === "complete") {
          // If it somehow bypassed review
          clearInterval(interval);
          navigate(`/review/${threadId}`);
        }
      } catch (err) {
        console.error("Polling error:", err);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [threadId, navigate]);

  return (
    <div className="flex flex-col items-center justify-center flex-1 max-w-2xl mx-auto w-full">
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full"
      >
        <h2 className="text-3xl font-sans font-medium text-text mb-2 tracking-tight">Initiate Research</h2>
        <p className="text-textMuted font-mono text-sm mb-8">Enter your query to spawn autonomous agents.</p>
        
        <form onSubmit={handleSubmit} className="w-full space-y-4">
          <div className="relative group">
            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. Compare the memory architectures of LangGraph vs AutoGen..."
              className="w-full h-40 bg-surface border border-border rounded-none p-4 pl-11 text-text font-mono text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors resize-none placeholder:text-border"
              disabled={isSubmitting}
            />
            <Search className="absolute left-4 top-4 w-4 h-4 text-textMuted group-focus-within:text-primary transition-colors" />
          </div>

          <div className="flex items-center justify-end">
            <button
              type="submit"
              disabled={isSubmitting || !query.trim()}
              className="bg-text text-background font-mono text-sm font-medium px-6 py-2.5 hover:bg-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  INITIALIZING...
                </>
              ) : (
                "RUN RESEARCH"
              )}
            </button>
          </div>
        </form>

        {isSubmitting && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-12 p-6 border border-border bg-surfaceHighlight flex items-start gap-4"
          >
            <Loader2 className="w-5 h-5 text-primary animate-spin shrink-0 mt-0.5" />
            <div>
              <h3 className="font-mono text-sm text-text font-medium mb-1">Running research pipeline...</h3>
              <p className="font-mono text-xs text-textMuted">The orchestration graph has been triggered. This process involves web search, RAG, and evaluation, and typically takes 20-30 seconds to reach the human-in-the-loop pause state.</p>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
