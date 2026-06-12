import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { API_URL } from "../App";

export default function ResultPage() {
  const { thread_id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);

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
    if (!data?.final_report) return;
    const blob = new Blob([data.final_report], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `lumen-research-${thread_id.substring(0, 8)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!data) {
    return <div className="flex-1 p-6 text-[13px] text-[#888]">Loading...</div>;
  }

  return (
    <div className="flex flex-col flex-1 bg-[#000000] items-center relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-[-30%] left-1/2 transform -translate-x-1/2 w-[600px] h-[300px] bg-[#0070F3] opacity-[0.15] blur-[100px] rounded-full pointer-events-none"></div>

      {/* Top action bar */}
      <div className="w-full max-w-4xl flex justify-between items-center py-5 px-6 border-b border-[#222] mb-12 relative z-10">
        <div className="text-[#EDEDED] font-mono text-[12px]">
          Result for <span className="text-[#555]">thread_{thread_id.substring(0,8)}</span>
        </div>
        <div className="flex space-x-3">
          <button 
            onClick={handleDownload}
            className="h-9 px-4 bg-[#111] border border-[#333] text-[#EDEDED] text-[12px] font-medium rounded-lg hover:border-[#555] transition-colors"
          >
            Download Markdown ↓
          </button>
          <button 
            onClick={() => navigate("/")}
            className="h-9 px-4 bg-[#EDEDED] text-[#000] text-[12px] font-bold rounded-lg hover:bg-white transition-colors"
          >
            New Research +
          </button>
        </div>
      </div>

      {/* Report Render */}
      <div className="w-full max-w-[720px] px-6 pb-24 relative z-10">
        <div className="prose w-full max-w-none text-[15px] leading-relaxed">
          <ReactMarkdown>{data.final_report || data.draft_report || ""}</ReactMarkdown>
        </div>
      </div>
    </div>
  );
}
