const ERROR_MESSAGES = {
  session_expired: {
    icon: "ti-clock-off",
    title: "Session expired",
    body: "Lumen runs on Render's free tier, which restarts the server after periods of inactivity. Your research session was lost in the restart.",
    action: "Start a new query",
    hint: "This is a known infrastructure tradeoff — see the architecture docs for details.",
  },
  pipeline_failed: {
    icon: "ti-robot-off",
    title: "Research failed",
    body: "The AI pipeline couldn't complete your query. This usually means the LLM hit a rate limit or couldn't find enough relevant sources.",
    action: "Try a more specific query",
    hint: 'Tip: queries with a clear topic and time frame work best — e.g. "RAG vs fine-tuning for enterprise LLMs 2025"',
  },
  network_error: {
    icon: "ti-wifi-off",
    title: "Connection lost",
    body: "Could not reach the Lumen backend. The server may be spinning up from a cold start — this takes 30–60 seconds on Render's free tier.",
    action: "Try again",
    hint: "If the problem persists, check that the backend is live at /health",
  },
};

export default function ErrorScreen({ type, onRetry }) {
  const err = ERROR_MESSAGES[type] || ERROR_MESSAGES.network_error;
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", minHeight: "60vh", padding: "2rem",
      textAlign: "center", maxWidth: "480px", margin: "0 auto"
    }}>
      <i className={`ti ${err.icon}`} style={{ fontSize: "32px", color: "var(--color-text-secondary)", marginBottom: "1.25rem" }} aria-hidden="true" />
      <h2 style={{ fontSize: "18px", fontWeight: 500, marginBottom: ".5rem" }}>{err.title}</h2>
      <p style={{ fontSize: "14px", color: "var(--color-text-secondary)", lineHeight: 1.6, marginBottom: "1.5rem" }}>{err.body}</p>
      <button onClick={onRetry} style={{
        padding: ".6rem 1.5rem", borderRadius: "8px", fontSize: "13px",
        fontWeight: 500, background: "#1A56DB", color: "#fff", border: "none", cursor: "pointer"
      }}>{err.action} →</button>
      <p style={{ fontSize: "11px", color: "var(--color-text-secondary)", marginTop: "1rem", lineHeight: 1.5 }}>{err.hint}</p>
    </div>
  );
}
