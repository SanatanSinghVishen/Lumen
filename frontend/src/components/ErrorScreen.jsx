import { IconClockOff, IconRobotOff, IconWifiOff, IconMoon, IconLoader2, IconHourglass, IconAlertTriangle, IconFileX, IconCloudOff } from "@tabler/icons-react";
import { motion } from "framer-motion";

const ERROR_MESSAGES = {
  // ── existing ─────────────────────────────────────────────────────
  session_expired: {
    icon: <IconClockOff size={48} stroke={1.5} className="text-gemini-cyan" />,
    title: "Session expired",
    body: "Lumen runs on Render's free tier, which restarts the server after periods of inactivity. Your research session was lost in the restart.",
    action: "Start a new query",
    hint: "Sessions persist in Postgres mode — run locally for uninterrupted sessions.",
  },
  pipeline_failed: {
    icon: <IconRobotOff size={48} stroke={1.5} className="text-gemini-pink" />,
    title: "Research failed",
    body: "The AI pipeline couldn't complete your query. This usually means the LLM hit a rate limit or couldn't find enough relevant sources.",
    action: "Try a more specific query",
    hint: 'Tip: queries with a clear topic and time frame work best — e.g. "RAG vs fine-tuning for enterprise LLMs 2025"',
  },
  network_error: {
    icon: <IconWifiOff size={48} stroke={1.5} className="text-amber-400" />,
    title: "Connection lost",
    body: "Could not reach the Lumen backend. The server may be spinning up from a cold start — this takes 30–60 seconds on Render's free tier.",
    action: "Try again",
    hint: null,
  },

  // ── new protection errors ─────────────────────────────────────────
  daily_limit_reached: {
    icon: <IconMoon size={48} stroke={1.5} className="text-gemini-purple" />,
    title: "Daily limit reached",
    body: "LUMEN processes a limited number of research queries per day to keep the demo free and available for everyone. The limit resets at midnight UTC.",
    action: "Come back tomorrow",
    hint: "Want unlimited access? Clone the repo and run it locally with your own API key — full instructions on GitHub.",
  },
  query_in_flight: {
    icon: <IconLoader2 size={48} stroke={1.5} className="text-gemini-blue animate-spin" />,
    title: "Query already running",
    body: "You already have a research query in progress. Please wait for it to complete before starting a new one.",
    action: "Go back",
    hint: null,
  },
  rate_limited: {
    icon: <IconHourglass size={48} stroke={1.5} className="text-amber-400" />,
    title: "Slow down a little",
    body: "You've sent a lot of requests in a short time. Wait a moment and try again — this limit exists to keep the demo fair for everyone.",
    action: "Try again in 60 seconds",
    hint: null,
  },
  invalid_input: {
    icon: <IconAlertTriangle size={48} stroke={1.5} className="text-red-400" />,
    title: "Invalid query",
    body: "Your query couldn't be processed. Make sure it's a genuine research topic between 10 and 500 characters.",
    action: "Try a different query",
    hint: null,
  },
  file_too_large: {
    icon: <IconFileX size={48} stroke={1.5} className="text-red-400" />,
    title: "File too large",
    body: "Uploaded files must be under 10MB. Try compressing the PDF or splitting it into smaller files.",
    action: "Try a smaller file",
    hint: null,
  },
  daily_upload_limit_reached: {
    icon: <IconCloudOff size={48} stroke={1.5} className="text-gemini-purple" />,
    title: "Upload limit reached",
    body: "The daily file upload limit has been reached. This resets at midnight UTC.",
    action: "Come back tomorrow",
    hint: null,
  },
};

export default function ErrorScreen({ type, onRetry }) {
  const err = ERROR_MESSAGES[type] || ERROR_MESSAGES.network_error;
  
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] p-8 text-center max-w-[550px] mx-auto z-10">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, x: 10 }}
        animate={{ opacity: 1, scale: 1, x: [10, -10, 8, -8, 0] }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="glass-card w-full p-10 flex flex-col items-center relative overflow-hidden group"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 blur-[50px] pointer-events-none rounded-full"></div>
        
        <div className="mb-6 p-4 bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.05)] rounded-2xl shadow-[0_0_20px_rgba(0,0,0,0.5)] group-hover:scale-105 transition-transform duration-500">
          {err.icon}
        </div>
        
        <h2 className="text-[22px] font-medium mb-3 text-text">{err.title}</h2>
        <p className="text-[15px] text-textMuted leading-relaxed mb-8">{err.body}</p>
        
        <motion.button 
          whileHover={{ scale: 1.05, boxShadow: "0 0 25px rgba(66,133,244,0.5)" }}
          whileTap={{ scale: 0.95 }}
          onClick={onRetry} 
          className="px-6 py-3 rounded-xl text-[14px] font-medium bg-gradient-primary text-white shadow-[0_0_15px_rgba(66,133,244,0.3)] flex items-center gap-2 transition-colors"
        >
          {err.action} →
        </motion.button>
        
        {err.hint && (
          <div className="mt-8 pt-6 border-t border-[rgba(255,255,255,0.05)] w-full">
            <p className="text-[12px] text-textMuted/70 leading-relaxed font-mono">{err.hint}</p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
