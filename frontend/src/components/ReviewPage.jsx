import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { motion } from "framer-motion";
import { Check, X, ArrowLeft, Download, RefreshCcw } from "lucide-react";
import { cn } from "../lib/utils";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export default function ReviewPage() {
  const { threadId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState("");
  const [showFeedback, setShowFeedback] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState("awaiting_review"); // awaiting_review | complete

  useEffect(() => {
    let interval;
    async function fetchReview() {
      try {
        const res = await fetch(`${API_URL}/review/${threadId}`);
        const json = await res.json();
        setData(json);
        setStatus(json.status);
        if (json.status !== "running") {
          setLoading(false);
        }
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    }
    
    // Initial fetch
    fetchReview();
    
    // If it's running, poll every 2 seconds
    if (status === "running" || loading) {
      interval = setInterval(fetchReview, 2000);
    }
    
    return () => clearInterval(interval);
  }, [threadId, status, loading]);

  const handleAction = async (action) => {
    setSubmitting(true);
    try {
      await fetch(`${API_URL}/approve/${threadId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, notes: feedback }),
      });
      if (action === "approve") {
        setStatus("complete");
      } else {
        // If rejected, set status to running so it shows a loading screen while revising
        setStatus("running");
        setLoading(true);
        setShowFeedback(false);
        setFeedback("");
      }
    } catch (err) {
      console.error(err);
    }
    setSubmitting(false);
  };

  if (loading) {
    return <div className="font-mono text-sm text-textMuted">Loading state...</div>;
  }

  if (!data) {
    return <div className="font-mono text-sm text-textMuted">Failed to load thread data.</div>;
  }

  const score = data.eval_score || 0;
  let badgeColor = "bg-red-500/10 text-red-500 border-red-500/20";
  if (score >= 0.75) badgeColor = "bg-green-500/10 text-green-500 border-green-500/20";
  else if (score >= 0.6) badgeColor = "bg-amber-500/10 text-amber-500 border-amber-500/20";

  if (status === "complete") {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full">
        <button onClick={() => navigate("/")} className="text-textMuted hover:text-text mb-8 flex items-center gap-2 font-mono text-xs transition-colors">
          <ArrowLeft className="w-3 h-3" /> NEW QUERY
        </button>
        <div className="border border-border bg-surface p-8">
          <div className="flex items-center justify-between mb-8 pb-8 border-b border-border">
            <div>
              <h2 className="text-2xl font-sans font-medium text-text tracking-tight mb-2">Final Report</h2>
              <div className="font-mono text-xs text-primary flex items-center gap-2">
                <Check className="w-3 h-3" /> APPROVED AND COMPLETED
              </div>
            </div>
            <button 
              onClick={() => {
                const blob = new Blob([data.draft_report || data.final_report], { type: 'text/markdown' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `report-${threadId.slice(0, 8)}.md`;
                a.click();
              }}
              className="border border-border text-text px-4 py-2 font-mono text-xs hover:bg-surfaceHighlight transition-colors flex items-center gap-2"
            >
              <Download className="w-3 h-3" /> DOWNLOAD .MD
            </button>
          </div>
          <div className="prose prose-invert max-w-none">
            <ReactMarkdown>{data.draft_report || data.final_report}</ReactMarkdown>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="w-full flex gap-8 items-start">
      {/* Sidebar Info */}
      <div className="w-64 shrink-0 flex flex-col gap-6 sticky top-8">
        <div>
          <div className="font-mono text-[10px] text-textMuted uppercase tracking-widest mb-2">Confidence Score</div>
          <div className={cn("inline-flex items-center px-2.5 py-1 rounded-sm border font-mono text-xs", badgeColor)}>
            {(score * 100).toFixed(0)}% / 100%
          </div>
        </div>
        
        <div>
          <div className="font-mono text-[10px] text-textMuted uppercase tracking-widest mb-2">Attempt</div>
          <div className="font-mono text-xs text-text border border-border px-2.5 py-1 inline-block bg-surfaceHighlight">
            {data.retry_count || 1} of 3
          </div>
        </div>

        <div className="pt-6 border-t border-border flex flex-col gap-3">
          <button
            onClick={() => handleAction("approve")}
            disabled={submitting}
            className="w-full bg-text text-background font-mono text-sm font-medium py-2 hover:bg-primary transition-colors flex justify-center items-center gap-2"
          >
            <Check className="w-4 h-4" /> APPROVE
          </button>
          
          {!showFeedback ? (
            <button
              onClick={() => setShowFeedback(true)}
              className="w-full border border-border text-text font-mono text-sm py-2 hover:bg-surfaceHighlight transition-colors flex justify-center items-center gap-2"
            >
              <RefreshCcw className="w-4 h-4" /> REQUEST REVISION
            </button>
          ) : (
            <div className="flex flex-col gap-2 mt-2">
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="What needs to be changed?"
                className="w-full h-24 bg-surface border border-border p-3 text-text font-mono text-xs focus:outline-none focus:border-red-500/50 resize-none"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => setShowFeedback(false)}
                  className="flex-1 border border-border text-textMuted hover:text-text font-mono text-xs py-1.5"
                >
                  CANCEL
                </button>
                <button
                  onClick={() => handleAction("reject")}
                  disabled={submitting || !feedback.trim()}
                  className="flex-1 bg-red-500/10 text-red-500 border border-red-500/20 font-mono text-xs py-1.5 hover:bg-red-500/20 disabled:opacity-50"
                >
                  SUBMIT
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 border border-border bg-surface p-8 min-h-[500px]">
        <div className="font-mono text-[10px] text-textMuted uppercase tracking-widest mb-6 pb-6 border-b border-border">
          Human-in-the-loop Review // ID: {threadId}
        </div>
        <div className="prose prose-invert max-w-none">
          <ReactMarkdown>{data.draft_report}</ReactMarkdown>
        </div>
      </div>
    </motion.div>
  );
}
