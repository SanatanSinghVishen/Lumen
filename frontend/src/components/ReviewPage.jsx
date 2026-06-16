import { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { API_URL } from "../App";
import ErrorScreen from "./ErrorScreen";
import { motion, AnimatePresence } from "framer-motion";
import { fadeUp, staggerContainer, staggerItem } from "../utils/motionVariants";
import { useAuthenticatedFetch } from "../hooks/useAuthenticatedFetch";

const MetricRow = ({ label, value, hint }) => {
  // Smooth gradient mapping for the progress bar
  const getGradient = (val) => {
    if (val === null) return "linear-gradient(90deg, #334155, #475569)"; // slate
    if (val >= 0.75) return "linear-gradient(90deg, #10b981, #34d399)"; // emerald
    if (val >= 0.60) return "linear-gradient(90deg, #f59e0b, #fbbf24)"; // amber
    return "linear-gradient(90deg, #ef4444, #f87171)"; // red
  };

  const getTextColor = (val) => {
    if (val === null) return "text-slate-400";
    if (val >= 0.75) return "text-emerald-400";
    if (val >= 0.60) return "text-amber-400";
    return "text-red-400";
  };

  return (
    <div className="mb-5">
      <div className="flex justify-between items-center mb-2">
        <span className="text-[12px] text-textMuted font-mono">{label}</span>
        <span className={`text-[12px] font-bold px-2 py-0.5 rounded-md bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] ${getTextColor(value)}`}>
          {value !== null && value !== undefined ? value.toFixed(2) : "n/a"}
        </span>
      </div>
      <div className="h-[6px] bg-[rgba(255,255,255,0.05)] rounded-full overflow-hidden border border-[rgba(255,255,255,0.02)]">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: value !== null && value !== undefined ? `${value * 100}%` : "0%" }}
          transition={{ type: "spring", bounce: 0.2, duration: 1.2 }}
          style={{
            height: "100%",
            borderRadius: "9999px",
            background: getGradient(value),
          }} 
          className="shadow-[0_0_10px_rgba(255,255,255,0.2)]" 
        />
      </div>
      <p className="text-[11px] text-textMuted mt-1.5 font-light">{hint}</p>
    </div>
  );
};

export default function ReviewPage() {
  const { thread_id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const authFetch = useAuthenticatedFetch();
  const [data, setData] = useState(
    location.state?.prefetchedReport
      ? { draft_report: location.state.prefetchedReport, status: "awaiting_review" }
      : null
  );
  const [submitting, setSubmitting] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [status, setStatus] = useState("awaiting_review");
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchReview() {
      try {
        const res = await authFetch(`/review/${thread_id}`);
        
        if (res.status === 404) {
          setError("session_expired");
          return;
        }

        const json = await res.json();
        
        if (json.status === "thread_not_found" || json.detail === "thread_not_found") {
          setError("session_expired");
          return;
        }

        if (json.status === "error") {
          setError("pipeline_failed");
          return;
        }

        setData(json);
        setStatus(json.status);
      } catch (err) {
        console.error(err);
        setError("network_error");
      }
    }
    
    if (!location.state?.prefetchedReport) {
      fetchReview();
    }
  }, [thread_id, location.state]);

  const handleAction = async (action) => {
    setSubmitting(true);
    try {
      await authFetch(`/approve/${thread_id}`, {
        method: "POST",
        body: JSON.stringify({ action, notes: feedback }),
      });
      if (action === "approve") {
        navigate(`/result/${thread_id}`);
      } else {
        navigate(`/loading/${thread_id}`);
      }
    } catch (err) {
      console.error(err);
      setSubmitting(false);
    }
  };

  if (error) {
    return <ErrorScreen type={error} onRetry={() => navigate("/")} />;
  }

  if (!data) {
    return <div className="flex-1 p-6 text-[13px] text-textMuted flex items-center justify-center"><div className="pulse-orb mr-3"></div> Loading review...</div>;
  }

  const score = data.eval_score || 0;
  let confidenceColor = "bg-red-500/10 text-red-400 border-red-500/20";
  if (score >= 0.75) {
    confidenceColor = "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
  } else if (score >= 0.6) {
    confidenceColor = "bg-amber-500/10 text-amber-400 border-amber-500/20";
  }

  return (
    <motion.div 
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="flex flex-col h-full flex-1 max-w-[1400px] mx-auto w-full px-6 py-6 relative z-10"
    >
      
      {/* Top Bar Indicators */}
      <motion.div variants={staggerItem} className="w-full mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <div className="text-[13px] font-mono text-textMuted truncate max-w-md mb-2 sm:mb-0 bg-[rgba(255,255,255,0.03)] px-3 py-1.5 rounded-md border border-[rgba(255,255,255,0.05)]">
          thread_{thread_id.substring(0,8)}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className={`px-3 py-1.5 rounded-md text-[11px] font-mono border shadow-sm ${confidenceColor}`}>
            Confidence: {score.toFixed(2)}
          </div>
          <div className="px-3 py-1.5 rounded-md text-[11px] font-mono border border-gemini-cyan/30 bg-gemini-cyan/10 text-gemini-cyan shadow-sm">
            Attempt {data.retry_count || 1} of 3
          </div>
          <div className="px-3 py-1.5 rounded-md text-[11px] font-mono border border-gemini-purple/30 bg-gemini-purple/10 text-gemini-purple shadow-sm">
            Awaiting your approval
          </div>
        </div>
      </motion.div>

      {/* Two Column Layout */}
      <div className="flex flex-col lg:flex-row flex-1 gap-6 h-[calc(100vh-180px)]">
        
        {/* Left Pane - Report */}
        <motion.div variants={staggerItem} className="flex-1 glass-card overflow-hidden flex flex-col">
          <div className="bg-[rgba(255,255,255,0.02)] border-b border-[rgba(255,255,255,0.05)] px-8 py-5 flex items-center justify-between">
            <h1 className="text-[18px] font-medium text-text tracking-tight">Draft Report</h1>
            <div className="text-[11px] font-mono text-gemini-blue bg-gemini-blue/10 px-2.5 py-1 rounded-md">
              Generated by LUMEN
            </div>
          </div>
          
          <div className="flex-1 p-8 overflow-y-auto scroll-smooth">
            <div className="prose w-full max-w-3xl mx-auto">
              <ReactMarkdown>{data.draft_report || ""}</ReactMarkdown>
            </div>
          </div>
        </motion.div>

        {/* Right Sidebar - Action Panel */}
        <div className="w-full lg:w-[400px] flex flex-col gap-6">
          
          {/* Action Card */}
          <motion.div variants={staggerItem} className="glass-card p-6 border-gemini-purple/30 shadow-[0_0_30px_rgba(155,114,203,0.1)] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gemini-purple/20 blur-[50px] -z-10 rounded-full"></div>
            
            <motion.button
              whileHover={{ scale: 1.02, boxShadow: "0 0 20px rgba(66,133,244,0.4)" }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleAction("approve")}
              disabled={submitting}
              className="w-full h-12 mb-4 bg-gradient-primary text-white text-[14px] font-medium rounded-xl disabled:opacity-50 transition-all"
            >
              Approve & Export ↓
            </motion.button>
            
            <motion.button
              whileHover={{ backgroundColor: "rgba(255,255,255,0.1)" }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowFeedback(!showFeedback)}
              disabled={submitting}
              className="w-full h-11 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] text-text text-[13px] font-medium rounded-xl disabled:opacity-50 transition-colors"
            >
              Request Revision
            </motion.button>

            <AnimatePresence>
              {showFeedback && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="mt-4 overflow-hidden"
                >
                  <textarea
                    className="w-full glass-panel p-3 text-[13px] text-text placeholder:text-textMuted/50 focus:border-gemini-blue focus:shadow-[0_0_15px_rgba(66,133,244,0.2)] outline-none min-h-[120px] mb-3 transition-all"
                    placeholder="Describe what the agent should improve or correct..."
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                  />
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleAction("reject")}
                    disabled={submitting || !feedback.trim()}
                    className="w-full h-10 text-[13px] font-medium bg-gemini-pink/10 text-gemini-pink rounded-xl hover:bg-gemini-pink/20 disabled:opacity-50 transition-colors flex items-center justify-center"
                  >
                    Deploy Revision Agent →
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Metrics Card */}
          <motion.div variants={staggerItem} className="glass-card p-6 flex-1 overflow-y-auto">
            <div className="mb-8">
              <p className="text-[11px] font-mono uppercase tracking-widest text-textMuted mb-5">
                Evaluation Metrics
              </p>
              <MetricRow
                label="LLM_JUDGE"
                value={data.eval_score}
                hint="Overall semantic quality"
              />
              <MetricRow
                label="FAITHFULNESS"
                value={data.faithfulness}
                hint="Grounded in retrieved sources"
              />
              <MetricRow
                label="ANSWER_RELEVANCY"
                value={data.answer_relevancy}
                hint="Directly addresses original query"
              />
              {data.eval_error && (
                <div className="text-red-400 text-sm mt-3 bg-red-500/10 p-3 rounded border border-red-500/20">
                  ⚠ {data.eval_error}
                </div>
              )}
            </div>

            {/* Sources */}
            <div>
              <div className="text-[11px] font-mono uppercase tracking-widest text-textMuted mb-4">
                Sources Injected
              </div>
              <ul className="space-y-3">
                {(data.web_results || []).map((src, idx) => (
                  <li key={idx} className="flex items-start">
                    <div className="text-gemini-cyan mr-2 mt-[2px] font-mono text-[10px] bg-gemini-cyan/10 px-1.5 rounded">[{idx+1}]</div>
                    <a href={src.url} target="_blank" rel="noreferrer" className="text-[13px] text-textMuted hover:text-gemini-cyan transition-colors truncate w-full" title={src.url}>
                      {src.title || src.url}
                    </a>
                  </li>
                ))}
                {(!data.web_results || data.web_results.length === 0) && (
                  <li className="text-[12px] text-textMuted/70 font-mono">No web sources injected.</li>
                )}
              </ul>
            </div>
          </motion.div>

        </div>
      </div>
    </motion.div>
  );
}
