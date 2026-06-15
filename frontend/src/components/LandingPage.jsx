import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { IconSitemap, IconWorldSearch, IconBrain, IconUserCheck, IconSearch, IconArrowRight, IconUpload, IconFile, IconCheck, IconX, IconTrash } from "@tabler/icons-react";
import { API_URL } from "../App";
import ErrorScreen from "./ErrorScreen";
import { motion, AnimatePresence } from "framer-motion";
import { fadeUp, staggerContainer, staggerItem, scaleIn } from "../utils/motionVariants";

export default function LandingPage() {
  const [query, setQuery] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showColdStartBanner, setShowColdStartBanner] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const navigate = useNavigate();

  // Animation states
  const [placeholderText, setPlaceholderText] = useState("");
  const [headingWord, setHeadingWord] = useState("Research");

  // RAG Upload state
  const [uploadedDocs, setUploadedDocs] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

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
      const res = await fetch(`${API_URL}/documents`);
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
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`${API_URL}/upload`, { method: "POST", body: formData });
      const json = await res.json();
      if (res.ok) {
        setUploadStatus({ type: "success", message: `${json.filename} — ${json.chunks} chunks indexed` });
        fetchDocuments();
      } else {
        setUploadStatus({ type: "error", message: json.detail || "Upload failed" });
      }
    } catch (err) {
      setUploadStatus({ type: "error", message: "Network error — is the backend running?" });
    } finally {
      setUploading(false);
    }
  };

  const handleClearDocs = async () => {
    try {
      await fetch(`${API_URL}/documents`, { method: "DELETE" });
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
      const res = await fetch(`${API_URL}/research`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
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
    { num: "03", icon: <IconBrain size={20} stroke={1.5} />, label: "Dual evaluation", desc: "RAGAS metrics + LLM-as-judge scoring" },
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
        
        <motion.h1 variants={staggerItem} className="text-[48px] sm:text-[56px] font-bold leading-[1.1] tracking-tight mb-6 flex justify-center items-center">
          <span className="relative inline-flex items-center justify-end overflow-hidden mr-3">
            <span className="invisible pointer-events-none">Research</span>
            <AnimatePresence mode="popLayout">
              <motion.span
                key={headingWord}
                initial={{ y: 50, opacity: 0, position: "absolute", right: 0 }}
                animate={{ y: 0, opacity: 1, position: "absolute", right: 0 }}
                exit={{ y: -50, opacity: 0, position: "absolute", right: 0 }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className="text-gradient-shimmer whitespace-nowrap"
              >
                {headingWord}
              </motion.span>
            </AnimatePresence>
          </span>
          <span className="text-gradient-shimmer">anything.</span>
        </motion.h1>
        <motion.h2 variants={staggerItem} className="text-[28px] sm:text-[36px] font-medium leading-[1.1] tracking-tight mb-6 text-text drop-shadow-md">
          Verified by AI, approved by you.
        </motion.h2>
        
        <motion.p variants={staggerItem} className="text-[16px] text-textMuted max-w-[540px] mb-10 leading-relaxed font-light drop-shadow-sm">
          Type a topic. Lumen deploys parallel agents to search the web, retrieve your documents, synthesize findings, and score its own confidence — before asking you to approve.
        </motion.p>

        <motion.form variants={staggerItem} onSubmit={handleSubmit} className="w-full max-w-[640px] relative mb-6">
          <motion.div 
            animate={{ 
              scale: isInputFocused ? 1.02 : 1,
              boxShadow: isInputFocused ? "0 0 30px rgba(66,133,244,0.3)" : "0 0 0px rgba(66,133,244,0)"
            }}
            transition={{ duration: 0.3 }}
            className="relative w-full rounded-[20px]"
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
                disabled={submitting || !query.trim()}
                className="h-12 px-6 bg-gradient-primary text-white text-[14px] font-medium rounded-[16px] disabled:opacity-50 disabled:cursor-not-allowed flex items-center transition-shadow shadow-lg hover:shadow-xl"
              >
                Research <IconArrowRight size={18} className="ml-2" stroke={2} />
              </motion.button>
            </div>
          </motion.div>
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

      {/* Document Upload Section */}
      <motion.section variants={fadeUp} className="w-full py-12 px-6 relative z-10 border-t border-[rgba(255,255,255,0.05)]">
        <div className="max-w-[640px] mx-auto glass-card p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-[16px] font-medium text-text mb-1">Knowledge Base</h2>
              <p className="text-[12px] text-textMuted">Upload documents for RAG retrieval alongside web search</p>
            </div>
            <AnimatePresence>
              {uploadedDocs.length > 0 && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleClearDocs}
                  className="text-[12px] px-3 py-1.5 glass-pill text-gemini-pink hover:bg-gemini-pink/10 flex items-center gap-1.5 transition-colors"
                >
                  <IconTrash size={14} stroke={1.5} /> Clear all
                </motion.button>
              )}
            </AnimatePresence>
          </div>

          {/* Drop Zone */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            animate={dragOver ? {
              boxShadow: ["0 0 0px rgba(66,133,244,0.1)", "0 0 20px rgba(66,133,244,0.3)", "0 0 0px rgba(66,133,244,0.1)"],
              transition: { repeat: Infinity, duration: 1.5 }
            } : {
              boxShadow: "0 0 0px rgba(66,133,244,0)"
            }}
            className={`w-full border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-300
              ${dragOver 
                ? "border-gemini-blue bg-gemini-blue/10" 
                : "border-[rgba(255,255,255,0.2)] bg-transparent hover:border-gemini-blue/50 hover:bg-[rgba(255,255,255,0.02)]"
              } ${uploading ? "opacity-50 pointer-events-none" : ""}`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.txt,.md,.csv"
              className="hidden"
              onChange={(e) => handleUpload(e.target.files[0])}
            />
            <IconUpload size={32} stroke={1.5} className={`mx-auto mb-3 transition-colors ${dragOver ? "text-gemini-blue" : "text-textMuted"}`} />
            <p className="text-[14px] text-text mb-1">
              {uploading ? "Chunking & embedding..." : "Drop a file here or click to browse"}
            </p>
            <p className="text-[12px] text-textMuted/70 font-mono">PDF · TXT · MD · CSV</p>
          </motion.div>

          {/* Upload Status */}
          <AnimatePresence>
            {uploadStatus && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={`mt-4 flex items-center gap-2 text-[13px] px-4 py-3 glass-pill
                ${uploadStatus.type === "success" 
                  ? "text-green-400 border-green-400/30 bg-green-400/10" 
                  : "text-red-400 border-red-400/30 bg-red-400/10"}`}
              >
                {uploadStatus.type === "success" ? <IconCheck size={16} /> : <IconX size={16} />}
                {uploadStatus.message}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Uploaded Files List */}
          <AnimatePresence>
            {uploadedDocs.length > 0 && (
              <motion.div 
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="mt-6 space-y-2"
              >
                {uploadedDocs.map((doc, idx) => (
                  <motion.div 
                    variants={scaleIn}
                    key={idx} 
                    className="flex items-center justify-between px-4 py-3 glass-panel hover:bg-[rgba(255,255,255,0.05)] transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <IconFile size={18} stroke={1.5} className="text-gemini-blue" />
                      <span className="text-[14px] text-text">{doc.filename}</span>
                    </div>
                    <span className="text-[12px] font-mono text-textMuted px-2 py-1 bg-black/30 rounded-md border border-[rgba(255,255,255,0.05)]">
                      {doc.chunks} chunks
                    </span>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.section>

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
        <div className="max-w-4xl mx-auto flex flex-wrap justify-center gap-3">
          {["LangGraph", "FastAPI", "ChromaDB", "Gemini 2.5 Flash", "Tavily", "RAGAS", "SSE Streaming", "Docker"].map((tech) => (
            <div key={tech} className="px-4 py-1.5 glass-pill text-[12px] text-textMuted hover:text-text transition-colors font-mono hover:border-gemini-blue/30 cursor-default">
              {tech}
            </div>
          ))}
        </div>
      </motion.section>
    </motion.div>
  );
}
