import { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { API_URL } from "../App";
import ErrorScreen from "./ErrorScreen";

const MetricRow = ({ label, value, hint }) => {
  const color = value === null ? "#888"
    : value >= 0.75 ? "#44FF44"
    : value >= 0.60 ? "#FFCC00"
    : "#FF5555";

  const bg = value === null ? "#222"
    : value >= 0.75 ? "#002A05"
    : value >= 0.60 ? "#332200"
    : "#2A0000";

  return (
    <div style={{ marginBottom: "16px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
        <span style={{ fontSize: "12px", color: "var(--color-text-secondary)", fontFamily: "monospace" }}>{label}</span>
        <span style={{
          fontSize: "12px", fontWeight: 600, padding: "2px 8px",
          borderRadius: "4px", background: bg, color, border: `1px solid ${color}40`
        }}>
          {value !== null && value !== undefined ? value.toFixed(2) : "n/a"}
        </span>
      </div>
      <div style={{ height: "4px", background: "#222", borderRadius: "2px", overflow: "hidden" }}>
        <div style={{
          height: "100%", borderRadius: "2px", background: color,
          width: value !== null && value !== undefined ? `${value * 100}%` : "0%",
          transition: "width 1s cubic-bezier(0.16, 1, 0.3, 1)"
        }} />
      </div>
      <p style={{ fontSize: "11px", color: "#555", marginTop: "6px", fontWeight: 300 }}>{hint}</p>
    </div>
  );
};

export default function ReviewPage() {
  const { thread_id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
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
        const res = await fetch(`${API_URL}/review/${thread_id}`);
        
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
      await fetch(`${API_URL}/approve/${thread_id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
    return <div className="flex-1 p-6 text-[13px] text-[#888]">Loading review...</div>;
  }

  const score = data.eval_score || 0;
  let confidenceColor = "bg-[#2A0000] text-[#FF5555] border-[#FF5555] border";
  if (score >= 0.75) {
    confidenceColor = "bg-[#002A05] text-[#44FF44] border-[#44FF44] border";
  } else if (score >= 0.6) {
    confidenceColor = "bg-[#332200] text-[#FFCC00] border-[#FFCC00] border";
  }

  return (
    <div className="flex flex-col h-full bg-[#000000] flex-1">
      {/* Top Bar */}
      <div className="w-full border-b border-[#222] py-3.5 px-6 flex flex-col sm:flex-row justify-between items-start sm:items-center bg-[#0A0A0A] sticky top-14 z-40">
        <div className="text-[13px] font-mono text-[#EDEDED] truncate max-w-md mb-2 sm:mb-0">
          thread_{thread_id.substring(0,8)}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className={`px-3 py-1 rounded-[4px] text-[11px] font-mono ${confidenceColor}`}>
            Confidence: {score.toFixed(2)}
          </div>
          <div className="px-3 py-1 rounded-[4px] text-[11px] font-mono border border-[#0070F3] bg-[#0070F3] bg-opacity-10 text-[#0070F3]">
            Attempt {data.retry_count || 1} of 3
          </div>
          <div className="px-3 py-1 rounded-[4px] text-[11px] font-mono border border-[#FFCC00] bg-[#FFCC00] bg-opacity-10 text-[#FFCC00]">
            Awaiting your approval
          </div>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="flex flex-col sm:flex-row flex-1">
        {/* Left Pane - Report */}
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-[20px] font-medium text-[#EDEDED] mb-2 tracking-tight">Draft Report</h1>
            <div className="text-[11px] font-mono text-[#555] mb-8">
              Generated by LUMEN Pipeline
            </div>
            <div className="prose w-full max-w-none text-[14px]">
              <ReactMarkdown>{data.draft_report || ""}</ReactMarkdown>
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="w-full sm:w-[320px] border-l-0 sm:border-l border-[#222] p-6 sticky top-[113px] h-[calc(100vh-113px)] overflow-y-auto bg-[#0A0A0A]">
          
          {/* Section 1 - Confidence */}
          <div className="mb-8">
            <p className="text-[11px] font-mono uppercase tracking-widest text-[#555] mb-4">
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
            {data.ragas_error && (
              <p className="text-[11px] text-[#FF5555] mt-2 font-mono bg-[#2A0000] p-2 rounded-[4px]">
                ⚠ {data.ragas_error}
              </p>
            )}
          </div>

          {/* Section 2 - Actions */}
          <div className="mb-10">
            <button
              onClick={() => handleAction("approve")}
              disabled={submitting}
              className="w-full h-11 mb-3 bg-[#EDEDED] text-[#000] text-[13px] font-bold rounded-[6px] hover:bg-white disabled:opacity-50 transition-colors"
            >
              Approve & Export ↓
            </button>
            
            <button
              onClick={() => setShowFeedback(!showFeedback)}
              disabled={submitting}
              className="w-full h-11 bg-[#111] border border-[#333] text-[#EDEDED] text-[13px] font-medium rounded-[6px] hover:border-[#555] disabled:opacity-50 transition-colors"
            >
              Request Revision
            </button>

            {showFeedback && (
              <div className="mt-4 animate-fade-in-up">
                <textarea
                  className="w-full border border-[#333] rounded-[6px] p-3 text-[13px] text-[#EDEDED] placeholder:text-[#555] bg-[#000] focus:border-[#0070F3] outline-none min-h-[100px] mb-3 transition-colors"
                  placeholder="Describe what the agent should improve..."
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                />
                <button
                  onClick={() => handleAction("reject")}
                  disabled={submitting || !feedback.trim()}
                  className="text-[12px] font-medium text-[#0070F3] hover:text-[#3291ff] disabled:opacity-50 transition-colors"
                >
                  Deploy Revision Agent →
                </button>
              </div>
            )}
          </div>

          {/* Section 3 - Sources */}
          <div>
            <div className="text-[11px] font-mono uppercase text-[#555] tracking-widest mb-4">
              Sources Injected
            </div>
            <ul className="space-y-3">
              {(data.web_results || []).map((src, idx) => (
                <li key={idx} className="flex items-start">
                  <div className="text-[#0070F3] mr-2 mt-[1px] font-mono text-[10px]">[{idx+1}]</div>
                  <a href={src.url} target="_blank" rel="noreferrer" className="text-[12px] text-[#888] hover:text-[#EDEDED] hover:underline truncate w-full transition-colors" title={src.url}>
                    {src.title || src.url}
                  </a>
                </li>
              ))}
              {(!data.web_results || data.web_results.length === 0) && (
                <li className="text-[12px] text-[#555] font-mono">No web sources injected.</li>
              )}
            </ul>
          </div>

        </div>
      </div>
    </div>
  );
}
