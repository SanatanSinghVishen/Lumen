import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { IconSitemap, IconWorldSearch, IconBrain, IconUserCheck, IconSearch, IconArrowRight, IconUpload, IconFile, IconCheck, IconX, IconTrash, IconPaperclip, IconSparkles, IconActivity } from "@tabler/icons-react";
import { API_URL } from "../App";
import ErrorScreen from "./ErrorScreen";
import { motion, AnimatePresence } from "framer-motion";
import { fadeUp, staggerContainer, staggerItem, scaleIn } from "../utils/motionVariants";
import { useAuthenticatedFetch } from "../hooks/useAuthenticatedFetch";
import { useAuth } from "@clerk/clerk-react";

export default function LandingPage() {
  const [query, setQuery] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showColdStartBanner, setShowColdStartBanner] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const navigate = useNavigate();
  const authFetch = useAuthenticatedFetch();

  // Animation states
  const [placeholderText, setPlaceholderText] = useState("");
  const [headingWord, setHeadingWord] = useState("Research");

  // RAG Upload state
  const [uploadedDocs, setUploadedDocs] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const [processingUploads, setProcessingUploads] = useState([]); // {task_id, filename}
  const pollIntervalsRef = useRef(new Map()); // task_id -> intervalId
  const fileInputRef = useRef(null);
  const { getToken } = useAuth();

  useEffect(() => {
    const checkHealth = async () => {
      const start = Date.now();
      try {
        await fetch(`${API_URL}/health`);
        const elapsed = Date.now() - start;
        if (elapsed > 3000) setShowColdStartBanner(true);
      } catch {
        setShowColdStartBanner(true);
      }
    };
    checkHealth();
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const res = await authFetch("/documents");
      const json = await res.json();
      setUploadedDocs(json.documents || []);
    } catch {
      // Backend might not be ready yet
    }
  };

  useEffect(() => {
    const placeholders = [
      "Latest breakthroughs in quantum error correction...",
      "Compare LangGraph and AutoGen for AI agents...",
      "How does RAG compare to fine-tuning...",
      "What are the implications of AGI in 2026..."
    ];
    let currentIdx = 0;
    let currentText = "";
    let isDeleting = false;
    let timeout;
    
    const type = () => {
      const fullText = placeholders[currentIdx];
      
      if (isDeleting) {
        currentText = fullText.substring(0, currentText.length - 1);
      } else {
        currentText = fullText.substring(0, currentText.length + 1);
      }
      
      setPlaceholderText(currentText);
      
      let typeSpeed = isDeleting ? 20 : 50;
      
      if (!isDeleting && currentText === fullText) {
        typeSpeed = 2500;
        isDeleting = true;
      } else if (isDeleting && currentText === "") {
        isDeleting = false;
        currentIdx = (currentIdx + 1) % placeholders.length;
        typeSpeed = 500;
      }
      
      timeout = setTimeout(type, typeSpeed);
    };
    
    timeout = setTimeout(type, 1000);
    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setHeadingWord(prev => prev === "Research" ? "Lumen" : "Research");
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  // Cleanup polling intervals on unmount
  useEffect(() => {
    return () => {
      pollIntervalsRef.current.forEach((intervalId) => clearInterval(intervalId));
      pollIntervalsRef.current.clear();
    };
  }, []);

  const startPolling = (taskId, filename) => {
    const intervalId = setInterval(async () => {
      try {
        const res = await authFetch(`/upload/status/${taskId}`);
        if (!res.ok) return;
        const task = await res.json();

        if (task.status === "ready") {
          clearInterval(intervalId);
          pollIntervalsRef.current.delete(taskId);
          setProcessingUploads((prev) => prev.filter((t) => t.task_id !== taskId));
          setUploadStatus({ type: "success", message: `${task.filename} — ${task.chunks} chunks indexed` });
          fetchDocuments();
        } else if (task.status === "failed") {
          clearInterval(intervalId);
          pollIntervalsRef.current.delete(taskId);
          setProcessingUploads((prev) => prev.filter((t) => t.task_id !== taskId));
          setUploadStatus({ type: "error", message: task.error || "Processing failed" });
        }
      } catch {
        // Polling error — keep trying
      }
    }, 2000);

    pollIntervalsRef.current.set(taskId, intervalId);
  };

  const handleUpload = async (file) => {
    if (!file) return;
    const allowed = [".pdf", ".txt", ".md", ".csv"];
    const ext = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();
    if (!allowed.includes(ext)) {
      setUploadStatus({ type: "error", message: `Unsupported file type: ${ext}. Use .pdf, .txt, .md, or .csv` });
      return;
    }

    setUploading(true);
    setUploadStatus(null);
    setUploadProgress(0);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const token = await getToken();
      
      const xhr = new XMLHttpRequest();
      xhr.open("POST", `${API_URL}/upload`);
      xhr.setRequestHeader("Authorization", `Bearer ${token}`);
      
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percentComplete = (event.loaded / event.total) * 100;
          setUploadProgress(percentComplete);
        }
      };

      xhr.onload = () => {
        setUploading(false);
        setUploadProgress(0);

        if (xhr.status >= 200 && xhr.status < 300) {
          const json = JSON.parse(xhr.responseText);
          // Backend now returns instantly with {task_id, filename, status: "processing"}
          const { task_id, filename: fname } = json;
          setProcessingUploads((prev) => [...prev, { task_id, filename: fname }]);
          setUploadStatus({ type: "processing", message: `Processing ${fname}...` });
          startPolling(task_id, fname);
        } else {
          let errorMsg = "Upload failed";
          try {
            const json = JSON.parse(xhr.responseText);
            errorMsg = json.detail?.message || json.detail || errorMsg;
          } catch (e) {}
          setUploadStatus({ type: "error", message: errorMsg });
        }
      };

      xhr.onerror = () => {
        setUploadStatus({ type: "error", message: "Network error — is the backend running?" });
        setUploading(false);
        setUploadProgress(0);
      };

      xhr.send(formData);
    } catch (err) {
      setUploadStatus({ type: "error", message: "Failed to initialize upload." });
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleClearDocs = async () => {
    try {
      await authFetch("/documents", { method: "DELETE" });
      setUploadedDocs([]);
      setUploadStatus({ type: "success", message: "All documents cleared" });
    } catch {
      setUploadStatus({ type: "error", message: "Failed to clear documents" });
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleUpload(file);
  };

  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!query.trim() || query.length < 10) {
      setError("invalid_input");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await authFetch("/research", {
        method:  "POST",
        body:    JSON.stringify({ query: query.trim() }),
      });

      if (res.ok) {
        const { thread_id } = await res.json();
        navigate(`/loading/${thread_id}`);
        return;
      }

      // Map error responses to ErrorScreen types
      const body = await res.json().catch(() => ({}));
      const errorCode = body?.detail?.error || body?.error || "pipeline_failed";

      const errorMap = {
        daily_limit_reached:        "daily_limit_reached",
        daily_upload_limit_reached: "daily_upload_limit_reached",
        query_in_flight:            "query_in_flight",
        rate_limit_exceeded:        "rate_limited",
        invalid_input:              "invalid_input",
      };

      setError(errorMap[errorCode] || "pipeline_failed");

    } catch {
      setError("network_error");
    } finally {
      setSubmitting(false);
    }
  };

  const steps = [
    { num: "01", icon: <IconSitemap size={20} stroke={1.5} />, label: "Orchestrator decomposes", desc: "Breaks your query into parallel sub-tasks" },
    { num: "02", icon: <IconWorldSearch size={20} stroke={1.5} />, label: "Agents retrieve", desc: "Searches the web & your uploaded documents" },
    { num: "03", icon: <IconBrain size={20} stroke={1.5} />, label: "Dual evaluation", desc: "FastEval metrics + LLM-as-judge scoring" },
    { num: "04", icon: <IconUserCheck size={20} stroke={1.5} />, label: "You approve", desc: "Review, revise, or approve the final report" },
  ];

  const EXAMPLE_QUERIES = [
    "LangGraph vs AutoGen: which is better for production AI agents?",
    "Breakthroughs in LLM reasoning and planning in 2025",
    "How does RAG compare to fine-tuning for enterprise knowledge bases?",
  ];

  if (error) {
    return <ErrorScreen type={error} onRetry={() => setError(null)} />;
  }

  return (
    <motion.div 
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="flex flex-col w-full relative overflow-hidden"
    >
      <AnimatePresence>
        {showColdStartBanner && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="glass-panel mx-auto max-w-xl px-6 py-2 text-[12px] text-gemini-cyan flex items-center justify-center gap-2 mt-4"
          >
            <i className="ti ti-clock animate-pulse" aria-hidden="true" />
            Backend is warming up — your first query may take an extra 30–60 seconds.
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Section */}
      <section className="flex flex-col items-center text-center pt-20 pb-16 px-6 relative z-10">
        <motion.div variants={staggerItem} className="inline-flex items-center px-4 py-1.5 glass-pill text-[11px] font-medium mb-8">
          <div className="pulse-orb mr-3"></div> Agentic AI · Multi-Agent · RAG · HITL
        </motion.div>
        
        <motion.div layout variants={staggerItem} className="flex justify-center items-center mb-6 overflow-hidden">
          <h1 className="text-[48px] sm:text-[56px] font-bold leading-[1.1] tracking-tight flex items-center justify-center">
            <span className="relative inline-flex overflow-hidden mr-3 h-[1.25em] items-center justify-center">
              <AnimatePresence mode="wait">
                <motion.span
                  key={headingWord}
                  initial={{ y: 30, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -30, opacity: 0 }}
                  transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                  className="text-gradient-shimmer whitespace-nowrap inline-block"
                >
                  {headingWord}
                </motion.span>
              </AnimatePresence>
            </span>
            <span className="text-gradient-shimmer whitespace-nowrap inline-block">
              anything.
            </span>
          </h1>
        </motion.div>
        <motion.h2 variants={staggerItem} className="text-[28px] sm:text-[36px] font-medium leading-[1.1] tracking-tight mb-6 text-text drop-shadow-md">
          Verified by AI, approved by you.
        </motion.h2>
        
        <motion.p variants={staggerItem} className="text-[16px] text-textMuted max-w-[540px] mb-10 leading-relaxed font-light drop-shadow-sm">
          Type a topic. Lumen deploys parallel agents to search the web, retrieve your documents, synthesize findings, and score its own confidence — before asking you to approve.
        </motion.p>

        <motion.form variants={staggerItem} onSubmit={handleSubmit} className="w-full max-w-[700px] relative mb-6">
          <div className="flex items-center gap-3 w-full">
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.txt,.md,.csv"
              className="hidden"
              onChange={(e) => handleUpload(e.target.files[0])}
            />
            <motion.button
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className={`h-[64px] w-[64px] shrink-0 flex items-center justify-center rounded-[20px] transition-colors border relative
                ${uploading ? "cursor-not-allowed border-transparent bg-[rgba(255,255,255,0.05)] text-textMuted" 
                  : "border-[rgba(255,255,255,0.05)] bg-[rgba(255,255,255,0.02)] backdrop-blur-md text-textMuted hover:text-text hover:bg-[rgba(255,255,255,0.05)]"}`}
              title="Attach Documents"
            >
              {uploading ? (
                <div className="relative w-8 h-8 flex items-center justify-center">
                  <svg className={`absolute inset-0 w-full h-full transform -rotate-90 ${uploadProgress === 100 ? 'animate-pulse' : ''}`} viewBox="0 0 36 36">
                    <circle cx="18" cy="18" r="16" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="3" />
                    <circle cx="18" cy="18" r="16" fill="none" stroke="#4285F4" strokeWidth="3" 
                      strokeDasharray="100" strokeDashoffset={100 - uploadProgress} 
                      className="transition-all duration-300 ease-out" />
                  </svg>
                  <span className="text-[10px] font-mono text-gemini-blue">{Math.round(uploadProgress)}</span>
                </div>
              ) : (
                <IconPaperclip size={24} stroke={1.5} />
              )}
            </motion.button>

            <motion.div 
              animate={{ 
                scale: isInputFocused ? 1.02 : 1,
                boxShadow: isInputFocused ? "0 0 30px rgba(66,133,244,0.3)" : "0 0 0px rgba(66,133,244,0)"
              }}
              transition={{ duration: 0.3 }}
              className="relative flex-1 rounded-[20px]"
            >
              <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none text-gemini-blue">
                <IconSearch size={22} stroke={2} />
              </div>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => setIsInputFocused(true)}
                onBlur={() => setIsInputFocused(false)}
                placeholder={placeholderText || "Latest breakthroughs in quantum error correction..."}
                className="w-full h-[64px] pl-16 pr-40 glass-panel text-[16px] text-text border-[rgba(255,255,255,0.05)] transition-all placeholder:text-textMuted/50 outline-none rounded-[20px]"
                disabled={submitting}
              />
              <div className="absolute inset-y-0 right-2 flex items-center">
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="submit" 
                  disabled={submitting || !query.trim() || processingUploads.length > 0}
                  title={processingUploads.length > 0 ? "Wait for document processing to complete" : undefined}
                  className="h-12 px-6 bg-gradient-primary text-white text-[14px] font-medium rounded-[16px] disabled:opacity-50 disabled:cursor-not-allowed flex items-center transition-shadow shadow-lg hover:shadow-xl"
                >
                  {processingUploads.length > 0 ? "Processing..." : "Research"} <IconArrowRight size={18} className="ml-2" stroke={2} />
                </motion.button>
              </div>
            </motion.div>
          </div>
          
          <AnimatePresence>
            {(uploadedDocs.length > 0 || uploadStatus) && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="w-full flex flex-col gap-2 mt-4 px-2"
              >
                {uploadedDocs.length > 0 && (
                  <div className="flex items-center gap-2 flex-wrap">
                    {uploadedDocs.map((doc, idx) => (
                      <div key={idx} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] bg-gemini-blue/10 border border-gemini-blue/20 text-gemini-blue max-w-[160px]">
                        <IconFile size={12} className="shrink-0" />
                        <span className="truncate">{doc.filename}</span>
                      </div>
                    ))}
                    
                    <button
                      type="button"
                      onClick={handleClearDocs}
                      className="text-textMuted hover:text-gemini-pink p-1.5 rounded-full hover:bg-[rgba(255,255,255,0.05)] transition-colors shrink-0"
                      title="Clear all documents"
                    >
                      <IconTrash size={14} />
                    </button>
                  </div>
                )}

                {uploadStatus && (
                  <div className={`text-[12px] text-left ${
                    uploadStatus.type === "success" ? "text-green-400" 
                    : uploadStatus.type === "processing" ? "text-gemini-cyan animate-pulse" 
                    : "text-red-400"
                  }`}>
                    {uploadStatus.type === "processing" && "⏳ "}{uploadStatus.message}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.form>

        <motion.div variants={staggerItem} className="flex gap-3 flex-wrap justify-center mb-8">
          {EXAMPLE_QUERIES.map((q) => (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              key={q}
              onClick={() => setQuery(q)}
              className="text-[12px] px-4 py-2 glass-pill text-textMuted hover:text-text transition-colors"
            >
              {q}
            </motion.button>
          ))}
        </motion.div>
      </section>



      {/* Animated Pipeline Strip */}
      <motion.section variants={fadeUp} className="w-full py-16 px-6 relative z-10">
        <div className="max-w-5xl mx-auto">
          <motion.div variants={staggerContainer} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {steps.map((step, idx) => (
              <motion.div 
                variants={staggerItem}
                key={idx} 
                className="glass-card p-6 flex flex-col items-start hover:shadow-[0_0_20px_rgba(255,255,255,0.05)] hover:border-[rgba(255,255,255,0.15)] transition-all"
              >
                <div className="w-full flex justify-between items-center mb-6">
                  <span className="text-[12px] font-mono text-gemini-cyan">{step.num}</span>
                  <div className="text-gemini-purple bg-[rgba(255,255,255,0.05)] p-2.5 rounded-xl border border-[rgba(255,255,255,0.05)]">{step.icon}</div>
                </div>
                <h3 className="text-[15px] font-medium text-text mb-2">{step.label}</h3>
                <p className="text-[13px] text-textMuted leading-relaxed font-light">{step.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* Tech Stack Strip */}
      <motion.section variants={fadeUp} className="w-full py-8 px-6 mt-auto">
        <div className="max-w-5xl mx-auto flex flex-wrap justify-center gap-12 items-center">
          {[
            { name: "LangGraph", logo: "https://cdn.simpleicons.org/langchain/white" },
            { name: "FastAPI", logo: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/fastapi/fastapi-original.svg" },
            { name: "ChromaDB", logo: "https://mintlify.s3-us-west-1.amazonaws.com/chroma/logo/dark.svg" },
            { name: "Gemini 2.5", logo: "https://www.gstatic.com/images/branding/googlelogo/svg/googlelogo_clr_74x24px.svg" },
            { name: "Tavily", icon: <IconWorldSearch size={36} className="text-gemini-cyan" /> },
            { name: "React", logo: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/react/react-original.svg" },
            { name: "SSE Streaming", icon: <IconActivity size={36} className="text-gemini-purple" /> },
            { name: "Docker", logo: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/docker/docker-original.svg" }
          ].map((tech) => (
            <div key={tech.name} className="flex flex-col items-center justify-center gap-3 opacity-60 hover:opacity-100 transition-opacity duration-300">
              {tech.logo ? (
                <img src={tech.logo} alt={tech.name} className="h-10 w-auto object-contain drop-shadow-md" />
              ) : (
                tech.icon
              )}
              <span className="text-[11px] text-textMuted font-mono uppercase tracking-wider">{tech.name}</span>
            </div>
          ))}
        </div>
      </motion.section>
    </motion.div>
  );
}
