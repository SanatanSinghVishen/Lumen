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
    return <div className="flex-1 p-6 text-[13px] text-[#6B7280]">Loading...</div>;
  }

  return (
    <div className="flex flex-col flex-1 bg-white items-center">
      {/* Top action bar */}
      <div className="w-full max-w-4xl flex justify-end items-center py-4 px-6 border-custom border-b border-l-0 border-r-0 border-t-0 mb-8">
        <div className="flex space-x-3">
          <button 
            onClick={handleDownload}
            className="h-8 px-3 bg-white border-custom text-[#111827] text-[12px] font-medium rounded hover:bg-[#F9FAFB]"
          >
            Download Markdown ↓
          </button>
          <button 
            onClick={() => navigate("/")}
            className="h-8 px-3 bg-[#1A56DB] text-white text-[12px] font-medium rounded hover:bg-[#1546b5]"
          >
            New Research +
          </button>
        </div>
      </div>

      {/* Report Render */}
      <div className="w-full max-w-[720px] px-6 pb-20">
        <div className="prose w-full max-w-none">
          <ReactMarkdown>{data.final_report || data.draft_report || ""}</ReactMarkdown>
        </div>
      </div>
    </div>
  );
}
