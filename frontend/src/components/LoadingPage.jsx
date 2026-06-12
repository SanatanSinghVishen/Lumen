import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ErrorScreen from "../components/ErrorScreen";

const NODE_LABELS = {
  orchestrator:  { icon: "ti-sitemap",      label: "Decomposing query" },
  web_search:    { icon: "ti-world-search",  label: "Searching web" },
  rag_retrieval: { icon: "ti-database",      label: "Retrieving documents" },
  synthesis:     { icon: "ti-pencil",        label: "Writing report" },
  ragas_eval:    { icon: "ti-chart-bar",     label: "Scoring quality" },
  evaluator:     { icon: "ti-brain",         label: "Evaluating" },
  hitl:          { icon: "ti-user-check",    label: "Awaiting approval" },
};

export default function LoadingPage() {
  const { thread_id }       = useParams();
  const navigate           = useNavigate();
  const [tokens, setTokens]         = useState("");
  const [activeNode, setActiveNode] = useState("orchestrator");
  const [completedNodes, setCompletedNodes] = useState([]);
  const [error, setError]           = useState(null);
  const reportRef = useRef(null);
  const esRef     = useRef(null);

  useEffect(() => {
    const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
    const es = new EventSource(`${API_URL}/stream/${thread_id}`);
    esRef.current = es;

    es.addEventListener("status", (e) => {
      const { node } = JSON.parse(e.data);
      setCompletedNodes(prev =>
        prev.includes(activeNode) ? prev : [...prev, activeNode]
      );
      setActiveNode(node);
    });

    es.addEventListener("token", (e) => {
      const { token } = JSON.parse(e.data);
      setTokens(prev => prev + token);
      // auto-scroll report preview
      if (reportRef.current) {
        reportRef.current.scrollTop = reportRef.current.scrollHeight;
      }
    });

    es.addEventListener("hitl", (e) => {
      const { thread_id: hitl_thread_id } = JSON.parse(e.data);
      es.close();
      navigate(`/review/${hitl_thread_id}`, {
        state: { prefetchedReport: tokens }  // pass accumulated tokens
      });
    });

    es.addEventListener("error", (e) => {
      es.close();
      try {
        const { message } = JSON.parse(e.data);
        setError(message.includes("not found") ? "session_expired" : "pipeline_failed");
      } catch {
        setError("network_error");
      }
    });

    es.addEventListener("done", () => {
      es.close();
    });

    es.onerror = () => {
      es.close();
      setError("network_error");
    };

    return () => es.close();
  }, [thread_id]);

  if (error) {
    return <ErrorScreen type={error} onRetry={() => navigate("/")} />;
  }

  return (
    <div style={{ maxWidth: "720px", margin: "0 auto", padding: "2rem 1.5rem" }}>

      {/* Pipeline node progress strip */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "2rem", flexWrap: "wrap" }}>
        {Object.entries(NODE_LABELS).map(([key, { icon, label }]) => {
          const isComplete = completedNodes.includes(key);
          const isActive   = activeNode === key;
          return (
            <div key={key} style={{
              display: "flex", alignItems: "center", gap: "6px",
              padding: "4px 10px", borderRadius: "20px", fontSize: "11px",
              border: `0.5px solid ${isActive ? "#1A56DB" : isComplete ? "#C0DD97" : "var(--color-border-tertiary)"}`,
              background: isActive ? "#EBF2FF" : isComplete ? "#EAF3DE" : "var(--color-background-secondary)",
              color: isActive ? "#1A56DB" : isComplete ? "#3B6D11" : "var(--color-text-secondary)",
              transition: "all 0.2s ease",
            }}>
              <i className={`ti ${isComplete ? "ti-check" : icon}`}
                 style={{ fontSize: "13px" }} aria-hidden="true" />
              {label}
            </div>
          );
        })}
      </div>

      {/* Live report preview */}
      {tokens && (
        <div style={{
          background: "var(--color-background-secondary)",
          border: "0.5px solid var(--color-border-tertiary)",
          borderRadius: "12px", padding: "1.25rem",
          marginBottom: "1rem"
        }}>
          <p style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: ".08em", color: "var(--color-text-secondary)", marginBottom: ".75rem" }}>
            Report preview — generating
            <span style={{ display: "inline-block", width: "6px", height: "6px", borderRadius: "50%", background: "#1A56DB", marginLeft: "6px", animation: "pulse 1s infinite" }} />
          </p>
          <div
            ref={reportRef}
            style={{ fontSize: "13px", color: "var(--color-text-primary)", lineHeight: 1.7, maxHeight: "400px", overflowY: "auto", whiteSpace: "pre-wrap" }}
          >
            {tokens}
          </div>
        </div>
      )}

      {/* Status message */}
      <p style={{ fontSize: "13px", color: "var(--color-text-secondary)", textAlign: "center" }}>
        {NODE_LABELS[activeNode]?.label ?? "Processing..."}
        {" — your review panel will open automatically"}
      </p>
    </div>
  );
}
