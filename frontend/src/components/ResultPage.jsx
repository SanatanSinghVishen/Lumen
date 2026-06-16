import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Mermaid from "./Mermaid";
import { API_URL } from "../App";
import { IconDownload, IconPlus, IconCheck } from "@tabler/icons-react";
import { motion, AnimatePresence } from "framer-motion";
import { fadeUp, scaleIn, staggerContainer, staggerItem } from "../utils/motionVariants";

export default function ResultPage() {
  const { thread_id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function fetchReview() {
      try {
        const res = await fetch(`${API_URL}/review/${thread_id}`);
        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error(err);
      }
    }
    fetchReview();
  }, [thread_id]);

  const handleDownload = () => {
    if (!data?.final_report && !data?.draft_report) return;
    const content = data.final_report || data.draft_report;
    const blob = new Blob([content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `lumen-research-${thread_id.substring(0, 8)}.md`;
    a.click();
    URL.revokeObjectURL(url);

    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!data) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-[13px] text-textMuted h-full">
        <motion.div 
          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="pulse-orb mb-4" 
        />
        Loading result...
      </div>
    );
  }

  return (
    <motion.div 
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="flex flex-col flex-1 items-center relative overflow-hidden px-6 pb-24 z-10"
    >

      {/* Top action bar */}
      <motion.div variants={staggerItem} className="w-full max-w-[800px] flex flex-col sm:flex-row justify-between items-center py-6 mb-6">
        <div className="text-text font-mono text-[13px] mb-4 sm:mb-0 bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.05)] px-3 py-1.5 rounded-md">
          Result for <span className="text-gemini-blue font-bold">thread_{thread_id.substring(0,8)}</span>
        </div>
        <div className="flex space-x-3 relative">
          <motion.button 
            whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,0.1)" }}
            whileTap={{ scale: 0.95 }}
            onClick={handleDownload}
            className="h-10 px-5 glass-pill text-text text-[13px] font-medium hover:border-[rgba(255,255,255,0.2)] transition-colors flex items-center gap-2 relative overflow-hidden"
          >
            <AnimatePresence mode="wait">
              {copied ? (
                <motion.div key="check" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -20, opacity: 0 }} className="flex items-center gap-2 text-gemini-cyan">
                  <IconCheck size={16} /> Downloaded
                </motion.div>
              ) : (
                <motion.div key="download" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -20, opacity: 0 }} className="flex items-center gap-2">
                  <IconDownload size={16} className="text-gemini-cyan" /> Download Markdown
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>
          
          <motion.button 
            whileHover={{ scale: 1.05, boxShadow: "0 0 20px rgba(66,133,244,0.5)" }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate("/")}
            className="h-10 px-5 bg-gradient-primary text-white text-[13px] font-medium rounded-full shadow-[0_0_15px_rgba(66,133,244,0.3)] flex items-center gap-2"
          >
            New Research <IconPlus size={16} />
          </motion.button>
        </div>
      </motion.div>

      {/* Report Render */}
      <motion.div variants={scaleIn} className="w-full max-w-[800px] glass-card relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute top-[-100px] left-1/2 transform -translate-x-1/2 w-[400px] h-[200px] bg-gemini-blue/10 blur-[60px] pointer-events-none rounded-full"></div>
        
        <div className="p-8 sm:p-12 relative z-10">
          <div className="prose w-full max-w-none text-[15px] leading-relaxed markdown-body">
            <ReactMarkdown 
              remarkPlugins={[remarkGfm]}
              components={{
                code({node, inline, className, children, ...props}) {
                  const match = /language-(\w+)/.exec(className || '');
                  if (!inline && match && match[1] === 'mermaid') {
                    return <Mermaid chart={String(children).replace(/\n$/, '')} />
                  }
                  return <code className={className} {...props}>{children}</code>
                }
              }}
            >
              {data.final_report || data.draft_report || ""}
            </ReactMarkdown>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
