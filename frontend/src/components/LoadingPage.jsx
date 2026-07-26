import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ErrorScreen from "../components/ErrorScreen";
import TechFactBanner from "../components/TechFactBanner";
import { motion, AnimatePresence } from "framer-motion";
import { fadeUp, staggerContainer, staggerItem } from "../utils/motionVariants";

const NODE_LABELS = {
  orchestrator:  { label: "Orchestrator decomposing query", detail: "Breaking into parallel sub-tasks" },
  web_search:    { label: "Agents searching web", detail: "Scraping deep-search results" },
  rag_retrieval: { label: "Agents retrieving context", detail: "Querying vector store" },
  synthesis:     { label: "Synthesizing report", detail: "Streaming LLM draft" },
  fast_eval:     { label: "Evaluation", detail: "Computing faithfulness & relevancy" },
  evaluator:     { label: "LLM-as-judge scoring", detail: "Final quality checks" },
  hitl:          { label: "Awaiting approval", detail: "Preparing review panel" },
};

const NODE_ORDER = Object.keys(NODE_LABELS);

export default function LoadingPage() {
  const { thread_id }       = useParams();
  const navigate           = useNavigate();
  const [tokens, setTokens]         = useState("");
  const [activeNode, setActiveNode] = useState("orchestrator");
  const [completedNodes, setCompletedNodes] = useState([]);
  const [error, setError]           = useState(null);
  const [isActivelyStreaming, setIsActivelyStreaming] = useState(false);
  const reportRef = useRef(null);
  const esRef     = useRef(null);

  useEffect(() => {
    const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
    const es = new EventSource(`${API_URL}/stream/${thread_id}`);
    esRef.current = es;

    let streamTimeout;

    es.addEventListener("status", (e) => {
      const { node } = JSON.parse(e.data);
      setCompletedNodes(prev =>
        prev.includes(activeNode) ? prev : [...prev, activeNode]
      );
      setActiveNode(node);
    });

    es.addEventListener("token", (e) => {
      const parsed = JSON.parse(e.data);
      const token = parsed.token;
      
      setTokens(prev => prev + token);
      setIsActivelyStreaming(true);
      
      clearTimeout(streamTimeout);
      streamTimeout = setTimeout(() => setIsActivelyStreaming(false), 500);

      if (reportRef.current) {
        reportRef.current.scrollTop = reportRef.current.scrollHeight;
      }
    });

    es.addEventListener("hitl", (e) => {
      const { thread_id: hitl_thread_id } = JSON.parse(e.data);
      es.close();
      navigate(`/review/${hitl_thread_id}`, {
        state: { prefetchedReport: tokens }
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

    return () => {
      es.close();
      clearTimeout(streamTimeout);
    };
  }, [thread_id, navigate]);

  if (error) {
    return <ErrorScreen type={error} onRetry={() => navigate("/")} />;
  }

  return (
    <motion.div 
      variants={fadeUp}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="flex flex-col md:flex-row w-full max-w-[1100px] mx-auto p-6 md:p-10 gap-10 mt-6 relative z-10"
    >
      
      {/* Left: Vertical Progressive Stepper */}
      <div className="w-full md:w-1/3 flex flex-col pt-4">
        <div className="flex items-center gap-3 mb-10">
          <motion.div 
            className="pulse-orb"
            animate={{ scale: isActivelyStreaming ? [1, 1.2, 1] : [1, 1.05, 1] }}
            transition={{ repeat: Infinity, duration: isActivelyStreaming ? 1 : 2 }}
          />
          <h2 className="text-[13px] font-medium text-textMuted tracking-wider uppercase">Agent Pipeline</h2>
        </div>

        <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="relative flex flex-col space-y-8 pl-4 border-l border-[rgba(255,255,255,0.1)]">
          {NODE_ORDER.map((key, idx) => {
            const isComplete = completedNodes.includes(key) || NODE_ORDER.indexOf(key) < NODE_ORDER.indexOf(activeNode);
            const isActive   = activeNode === key;
            const isPending  = !isComplete && !isActive;

            return (
              <motion.div variants={staggerItem} key={key} className="relative flex items-start group">
                {/* Timeline Dot */}
                <div className={`absolute -left-[21px] w-[10px] h-[10px] rounded-full border-2 bg-background transition-all duration-300
                  ${isComplete ? "border-gemini-cyan bg-gemini-cyan" : isActive ? "border-gemini-blue animate-pulse shadow-[0_0_15px_rgba(66,133,244,0.6)]" : "border-[rgba(255,255,255,0.2)]"}`} 
                />
                
                <div className={`flex flex-col -mt-1.5 transition-all duration-500 ${isPending ? "opacity-30" : "opacity-100"}`}>
                  <span className={`text-[15px] font-medium transition-colors ${isActive ? "text-gradient-shimmer" : isComplete ? "text-text" : "text-textMuted"}`}>
                    {NODE_LABELS[key].label}
                  </span>
                  
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={isActive ? "active" : isComplete ? "complete" : "pending"}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      transition={{ duration: 0.2 }}
                      className={`text-[12px] mt-1 ${isActive ? "text-gemini-cyan" : "text-textMuted/70"}`}
                    >
                      {isActive ? NODE_LABELS[key].detail : isComplete ? "Completed" : "Pending"}
                    </motion.span>
                  </AnimatePresence>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
        
        <TechFactBanner className="mt-8" />
      </div>

      {/* Right: Glass Card Preview */}
      <div className="w-full md:w-2/3 flex flex-col">
        <motion.div variants={fadeUp} className="glass-card flex flex-col h-[550px] shadow-2xl relative overflow-hidden">
          
          {/* Header */}
          <div className="bg-[rgba(255,255,255,0.02)] border-b border-[rgba(255,255,255,0.05)] px-5 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-[rgba(255,255,255,0.1)]"></div>
                <div className="w-3 h-3 rounded-full bg-[rgba(255,255,255,0.1)]"></div>
                <div className="w-3 h-3 rounded-full bg-[rgba(255,255,255,0.1)]"></div>
              </div>
              <span className="text-[12px] text-textMuted ml-2">Internal State Viewer</span>
            </div>
            <div className="text-[11px] font-mono text-gemini-blue bg-gemini-blue/10 px-2 py-1 rounded-md">
              thread_{thread_id.substring(0, 8)}
            </div>
          </div>

          {/* Body */}
          <div 
            ref={reportRef}
            className="flex-1 p-6 overflow-y-auto text-[14px] text-text leading-relaxed relative scroll-smooth"
          >
            {tokens ? (
              <div className="font-sans opacity-90">
                {tokens.split('\n\n').map((paragraph, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="whitespace-pre-wrap mb-4"
                  >
                    {paragraph}
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-textMuted opacity-50">
                <motion.div 
                  className="pulse-orb mb-4"
                  animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                />
                Initializing agent workspace...
              </div>
            )}
            
            {/* Subtle bottom fade */}
            <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[rgba(4,7,20,0.5)] to-transparent pointer-events-none" />
          </div>
        </motion.div>
      </div>

    </motion.div>
  );
}
