import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ErrorScreen from "../components/ErrorScreen";

const NODE_LABELS = {
  orchestrator:  { label: "Orchestrator decomposing query", detail: "Breaking into parallel sub-tasks" },
  web_search:    { label: "Agents searching web", detail: "Scraping Tavily deep-search results" },
  rag_retrieval: { label: "Agents retrieving context", detail: "Querying ChromaDB vector store" },
  synthesis:     { label: "Synthesising report", detail: "Streaming LLM draft" },
  ragas_eval:    { label: "RAGAS evaluation", detail: "Computing faithfulness & relevancy" },
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

    return () => es.close();
  }, [thread_id, activeNode, navigate, tokens]);

  if (error) {
    return <ErrorScreen type={error} onRetry={() => navigate("/")} />;
  }

  return (
    <div className="flex flex-col md:flex-row w-full max-w-[1000px] mx-auto p-6 md:p-10 gap-10 mt-10">
      
      {/* Left: Vertical Progressive Stepper */}
      <div className="w-full md:w-1/3 flex flex-col pt-4">
        <h2 className="text-[11px] font-mono text-[#888] uppercase tracking-widest mb-8">Pipeline Execution</h2>
        <div className="relative flex flex-col space-y-8 pl-4 border-l border-[#333]">
          {NODE_ORDER.map((key, idx) => {
            const isComplete = completedNodes.includes(key) || NODE_ORDER.indexOf(key) < NODE_ORDER.indexOf(activeNode);
            const isActive   = activeNode === key;
            const isPending  = !isComplete && !isActive;

            return (
              <div key={key} className="relative flex items-start group">
                {/* Timeline Dot */}
                <div className={`absolute -left-[21px] w-[10px] h-[10px] rounded-full border-2 bg-[#000] transition-colors duration-300
                  ${isComplete ? "border-[#0070F3] bg-[#0070F3]" : isActive ? "border-[#0070F3] animate-glow" : "border-[#333]"}`} 
                />
                
                <div className={`flex flex-col -mt-1.5 transition-opacity duration-300 ${isPending ? "opacity-30" : "opacity-100"}`}>
                  <span className={`text-[14px] font-medium ${isActive ? "text-[#EDEDED]" : isComplete ? "text-[#888]" : "text-[#555]"}`}>
                    {NODE_LABELS[key].label}
                  </span>
                  <span className={`text-[12px] mt-0.5 font-mono ${isActive ? "text-[#0070F3]" : "text-[#555]"}`}>
                    {isActive ? "Processing..." : isComplete ? "Done" : "Waiting"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right: Terminal Preview */}
      <div className="w-full md:w-2/3 flex flex-col">
        <div className="bg-[#0A0A0A] border border-[#222] rounded-xl overflow-hidden flex flex-col h-[500px] shadow-[0_0_30px_rgba(0,112,243,0.05)] relative">
          
          {/* Terminal Header */}
          <div className="bg-[#111] border-b border-[#222] px-4 py-3 flex items-center justify-between">
            <div className="flex gap-2">
              <div className="w-3 h-3 rounded-full bg-[#FF5F56]"></div>
              <div className="w-3 h-3 rounded-full bg-[#FFBD2E]"></div>
              <div className="w-3 h-3 rounded-full bg-[#27C93F]"></div>
            </div>
            <div className="text-[11px] font-mono text-[#555]">
              thread_{thread_id.substring(0, 8)}
            </div>
          </div>

          {/* Terminal Body */}
          <div 
            ref={reportRef}
            className="flex-1 p-5 overflow-y-auto font-mono text-[13px] text-[#00ff41] leading-relaxed relative"
          >
            {tokens ? (
              <span className="whitespace-pre-wrap">{tokens}<span className="animate-blink bg-[#00ff41] inline-block w-2 h-4 ml-1 align-middle"></span></span>
            ) : (
              <span className="text-[#555]">Waiting for synthesis stream to begin...</span>
            )}
            
            {/* Overlay Gradient for terminal effect */}
            <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_100px_rgba(0,0,0,0.5)]" />
          </div>
        </div>
      </div>

    </div>
  );
}
