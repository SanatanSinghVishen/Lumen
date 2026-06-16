import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthenticatedFetch } from "../hooks/useAuthenticatedFetch";

const STATUS_BADGE = {
  running:          { label: "Running",          color: "#1A56DB", bg: "rgba(26,86,219,0.12)"  },
  awaiting_review:  { label: "Awaiting review",  color: "#D97706", bg: "rgba(217,119,6,0.12)"  },
  approved:         { label: "Approved",          color: "#1D9E75", bg: "rgba(29,158,117,0.12)" },
  failed:           { label: "Failed",            color: "#E24B4A", bg: "rgba(226,75,74,0.12)"  },
};

function ScoreBadge({ score }) {
  if (score === null || score === undefined) return null;
  const color = score >= 0.75 ? "#1D9E75" : score >= 0.60 ? "#D97706" : "#E24B4A";
  return (
    <span style={{
      fontSize: "11px", padding: "2px 8px",
      borderRadius: "20px", fontWeight: 500,
      background: `${color}20`, color,
    }}>
      {(score * 100).toFixed(0)}%
    </span>
  );
}

export default function HistoryPage() {
  const [sessions, setSessions] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);
  const authFetch  = useAuthenticatedFetch();
  const navigate   = useNavigate();

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res  = await authFetch("/history");
        const data = await res.json();
        setSessions(data.sessions || []);
      } catch (err) {
        setError("Failed to load history.");
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  const formatDate = (iso) => new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });

  if (loading) return (
    <div style={{ display: "flex", justifyContent: "center", padding: "4rem" }}>
      <div style={{
        width: "28px", height: "28px",
        border: "2px solid #1A56DB",
        borderTopColor: "transparent",
        borderRadius: "50%",
        animation: "spin 0.8s linear infinite",
      }} />
    </div>
  );

  return (
    <div style={{ maxWidth: "720px", margin: "0 auto", padding: "2rem 1.5rem" }}>

      {/* Header */}
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{
          fontSize: "22px", fontWeight: 500,
          color: "#F1F5F9", marginBottom: ".5rem"
        }}>
          Research history
        </h1>
        <p style={{ fontSize: "13px", color: "#64748B" }}>
          {sessions.length === 0
            ? "No research sessions yet. Run your first query to get started."
            : `${sessions.length} session${sessions.length !== 1 ? "s" : ""}`}
        </p>
      </div>

      {error && (
        <div style={{
          padding: "1rem", borderRadius: "12px",
          background: "rgba(226,75,74,0.1)",
          border: "1px solid rgba(226,75,74,0.2)",
          color: "#E24B4A", fontSize: "13px",
          marginBottom: "1.5rem",
        }}>
          {error}
        </div>
      )}

      {/* Session list */}
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {sessions.map((session) => {
          const badge = STATUS_BADGE[session.status] || STATUS_BADGE.failed;
          return (
            <div
              key={session.id}
              onClick={() => {
                if (session.status === "approved") {
                  navigate(`/result/${session.thread_id}`);
                } else if (session.status === "awaiting_review") {
                  navigate(`/review/${session.thread_id}`);
                }
              }}
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "12px",
                padding: "1rem 1.25rem",
                cursor: ["approved", "awaiting_review"].includes(session.status)
                  ? "pointer" : "default",
                transition: "all 0.15s ease",
              }}
              onMouseEnter={e => {
                if (["approved","awaiting_review"].includes(session.status)) {
                  e.currentTarget.style.borderColor = "rgba(26,86,219,0.3)";
                  e.currentTarget.style.background  = "rgba(26,86,219,0.05)";
                }
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
                e.currentTarget.style.background  = "rgba(255,255,255,0.03)";
              }}
            >
              {/* Query text */}
              <p style={{
                fontSize: "14px", fontWeight: 500,
                color: "#F1F5F9", marginBottom: ".5rem",
                overflow: "hidden", textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}>
                {session.query}
              </p>

              {/* Meta row */}
              <div style={{
                display: "flex", alignItems: "center",
                gap: "10px", flexWrap: "wrap",
              }}>
                {/* Status badge */}
                <span style={{
                  fontSize: "11px", padding: "2px 8px",
                  borderRadius: "20px", fontWeight: 500,
                  background: badge.bg, color: badge.color,
                }}>
                  {badge.label}
                </span>

                {/* Score */}
                <ScoreBadge score={session.eval_score} />

                {/* Date */}
                <span style={{ fontSize: "11px", color: "#64748B", marginLeft: "auto" }}>
                  {formatDate(session.created_at)}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty state */}
      {sessions.length === 0 && !loading && (
        <div style={{ textAlign: "center", padding: "4rem 0" }}>
          <i className="ti ti-history-off"
             style={{ fontSize: "40px", color: "#334155", marginBottom: "1rem", display: "block" }}
             aria-hidden="true" />
          <p style={{ fontSize: "14px", color: "#64748B", marginBottom: "1.5rem" }}>
            No research sessions yet
          </p>
          <button
            onClick={() => navigate("/")}
            style={{
              padding: ".6rem 1.5rem", borderRadius: "8px",
              background: "#1A56DB", color: "#fff",
              border: "none", cursor: "pointer",
              fontSize: "13px", fontWeight: 500,
            }}
          >
            Start your first research →
          </button>
        </div>
      )}
    </div>
  );
}
