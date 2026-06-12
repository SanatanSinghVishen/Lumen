import { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { API_URL } from "../App";
import ErrorScreen from "./ErrorScreen";

const MetricRow = ({ label, value, hint }) => {
  const color = value === null ? "#888"
    : value >= 0.75 ? "#3B6D11"
    : value >= 0.60 ? "#854F0B"
    : "#A32D2D";

  const bg = value === null ? "#F1F5F9"
    : value >= 0.75 ? "#EAF3DE"
    : value >= 0.60 ? "#FAEEDA"
    : "#FCEBEB";

  return (
    <div style={{ marginBottom: "12px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
        <span style={{ fontSize: "12px", color: "var(--color-text-secondary)" }}>{label}</span>
        <span style={{
          fontSize: "12px", fontWeight: 500, padding: "2px 8px",
          borderRadius: "20px", background: bg, color
        }}>
          {value !== null && value !== undefined ? value.toFixed(2) : "n/a"}
        </span>
      </div>
      <div style={{ height: "3px", background: "var(--color-background-secondary)", borderRadius: "2px", overflow: "hidden" }}>
        <div style={{
          height: "100%", borderRadius: "2px", background: color,
          width: value !== null && value !== undefined ? `${value * 100}%` : "0%",
          transition: "width 0.6s ease"
        }} />
      </div>
      <p style={{ fontSize: "10px", color: "var(--color-text-secondary)", marginTop: "3px" }}>{hint}</p>
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
    
    // Only fetch from API if we don't have prefetched data
    if (!location.state?.prefetchedReport) {
      fetchReview();
    }
  }, [thread_id]);

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
    return <div className="flex-1 p-6 text-[13px] text-[#6B7280]">Loading review...</div>;
  }

  const score = data.eval_score || 0;
  let confidenceColor = "bg-[#FEF2F2] text-[#991B1B]"; // red
  let progressColor = "bg-[#991B1B]";
  if (score >= 0.75) {
    confidenceColor = "bg-[#EAF3DE] text-[#3B6D11]"; // green
    progressColor = "bg-[#3B6D11]";
  } else if (score >= 0.6) {
    confidenceColor = "bg-[#FEF3C7] text-[#92400E]"; // amber
    progressColor = "bg-[#92400E]";
  }

  return (
    <div className="flex flex-col h-full bg-white flex-1">
      {/* Top Bar */}
      <div className="w-full border-custom border-b py-3.5 px-6 flex justify-between items-center bg-white sticky top-14 z-40">
        <div className="text-[13px] font-medium text-[#111827] truncate max-w-md">
          {thread_id}
        </div>
        <div className="flex items-center space-x-2">
          <div className={`px-2.5 py-1 rounded-full text-[11px] font-medium border border-transparent ${confidenceColor}`}>
            Confidence: {score.toFixed(2)}
          </div>
          <div className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-[#EBF2FF] text-[#1A56DB]">
            Attempt {data.retry_count || 1} of 3
          </div>
          <div className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-[#FEF3C7] text-[#92400E]">
            Awaiting your approval
          </div>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="flex flex-col sm:flex-row flex-1">
        {/* Left Pane - Report */}
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-[18px] font-medium text-[#111827] mb-2">Draft Report</h1>
            <div className="text-[11px] text-[#6B7280] mb-8">
              Generated · 24s · 6 sources · 3 agents
            </div>
            <div className="prose w-full max-w-none text-[14px]">
              <ReactMarkdown>{data.draft_report || ""}</ReactMarkdown>
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="w-full sm:w-[280px] border-custom border-l-0 sm:border-l p-5 sticky top-[113px] h-[calc(100vh-113px)] overflow-y-auto bg-[#F9FAFB] sm:bg-white">
          
          {/* Section 1 - Confidence */}
          <div style={{ marginBottom: "1.25rem" }}>
            <p style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: ".08em", color: "var(--color-text-secondary)", marginBottom: ".75rem" }}>
              Evaluation scores
            </p>
            <MetricRow
              label="LLM judge"
              value={data.eval_score}
              hint="Overall quality scored by the AI evaluator"
            />
            <MetricRow
              label="Faithfulness"
              value={data.faithfulness}
              hint="Claims are grounded in retrieved sources"
            />
            <MetricRow
              label="Answer relevancy"
              value={data.answer_relevancy}
              hint="Report directly addresses the query"
            />
            {data.ragas_error && (
              <p style={{ fontSize: "10px", color: "var(--color-text-secondary)", marginTop: "4px" }}>
                ⚠ RAGAS metrics unavailable: {data.ragas_error}
              </p>
            )}
          </div>

          {/* Section 2 - Actions */}
          <div className="mb-8">
            <button
              onClick={() => handleAction("approve")}
              disabled={submitting}
              className="w-full h-10 mb-2 bg-[#1A56DB] text-white text-[13px] font-medium rounded-lg hover:bg-[#1546b5] disabled:opacity-50"
            >
              Approve & export ↓
            </button>
            
            <button
              onClick={() => setShowFeedback(!showFeedback)}
              disabled={submitting}
              className="w-full h-10 bg-white border-custom text-[#111827] text-[13px] font-medium rounded-lg hover:bg-[#F9FAFB] disabled:opacity-50"
            >
              Request revision
            </button>

            {showFeedback && (
              <div className="mt-3 animate-fade-in-up">
                <textarea
                  className="w-full border-custom rounded-lg p-2 text-[13px] placeholder:text-[#9CA3AF] bg-[#F9FAFB] focus:bg-white min-h-[80px] mb-2"
                  placeholder="Describe what to improve..."
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                />
                <button
                  onClick={() => handleAction("reject")}
                  disabled={submitting || !feedback.trim()}
                  className="text-[12px] font-medium text-[#1A56DB] hover:underline disabled:opacity-50"
                >
                  Send feedback →
                </button>
              </div>
            )}
          </div>

          {/* Section 3 - Sources */}
          <div>
            <div className="text-[10px] uppercase text-[#9CA3AF] font-medium tracking-wider mb-3">
              Sources used
            </div>
            <ul className="space-y-2">
              {(data.web_results || []).map((src, idx) => (
                <li key={idx} className="flex items-start">
                  <div className="w-[5px] h-[5px] rounded-full bg-[#1A56DB] mt-[5px] mr-2 flex-shrink-0"></div>
                  <a href={src.url} target="_blank" rel="noreferrer" className="text-[11px] text-[#6B7280] hover:text-[#1A56DB] truncate w-full" title={src.url}>
                    {src.title || src.url}
                  </a>
                </li>
              ))}
              {(!data.web_results || data.web_results.length === 0) && (
                <li className="text-[11px] text-[#9CA3AF]">No web sources used.</li>
              )}
            </ul>
          </div>

        </div>
      </div>
    </div>
  );
}
