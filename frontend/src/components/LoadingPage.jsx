import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { IconSitemap, IconWorldSearch, IconBrain, IconCheck } from "@tabler/icons-react";
import { API_URL } from "../App";
import ErrorScreen from "./ErrorScreen";

export default function LoadingPage() {
  const { thread_id } = useParams();
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [error, setError] = useState(null);

  // Poll for status
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${API_URL}/review/${thread_id}`);
        
        if (res.status === 404) {
          setError("session_expired");
          return;
        }

        const data = await res.json();
        
        if (data.status === "thread_not_found" || data.detail === "thread_not_found") {
          setError("session_expired");
          return;
        }

        if (data.status === "error") {
          setError("pipeline_failed");
          return;
        }

        if (data.status === "awaiting_review") {
          navigate(`/review/${thread_id}`);
          return;
        } else if (data.status === "complete") {
          navigate(`/result/${thread_id}`);
          return;
        }
      } catch (err) {
        console.error("Polling error:", err);
        setError("network_error");
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [thread_id, navigate]);

  // Simulate pipeline progress visually (cycles every 6s)
  useEffect(() => {
    const cycle = setInterval(() => {
      setActiveStep((prev) => (prev < 3 ? prev + 1 : prev));
    }, 6000);
    return () => clearInterval(cycle);
  }, []);

  const nodes = [
    { icon: <IconSitemap size={20} />, label: "Orchestrating..." },
    { icon: <IconWorldSearch size={20} />, label: "Searching the web..." },
    { icon: <IconCheck size={20} />, label: "Retrieving documents..." },
    { icon: <IconBrain size={20} />, label: "Synthesising report..." }
  ];

  if (error) {
    return <ErrorScreen type={error} onRetry={() => navigate("/")} />;
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 bg-white min-h-[calc(100vh-120px)]">
      <div className="w-full max-w-[400px] flex justify-between items-center relative mb-12">
        {/* Connecting lines */}
        <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-[0.5px] bg-[var(--color-border)] z-0"></div>
        
        {nodes.map((node, i) => {
          const isCompleted = i < activeStep;
          const isActive = i === activeStep;
          
          let circleClasses = "w-10 h-10 rounded-full flex items-center justify-center z-10 transition-all duration-500 bg-white ";
          let iconColor = "";

          if (isCompleted) {
            circleClasses += "bg-[#EBF2FF] border-transparent";
            iconColor = "#1A56DB";
            node.icon = <IconCheck size={20} />; // Replace icon with checkmark
          } else if (isActive) {
            circleClasses += "border-2 border-[#1A56DB] animate-pulse-ring";
            iconColor = "#1A56DB";
          } else {
            circleClasses += "border-custom text-[#9CA3AF]";
            iconColor = "#9CA3AF";
          }

          return (
            <div key={i} className="relative z-10 flex flex-col items-center">
              <div className={circleClasses} style={{ color: iconColor }}>
                {node.icon}
              </div>
            </div>
          );
        })}
      </div>

      <div className="text-center">
        <h2 className="text-[15px] text-[#6B7280] font-medium mb-1 transition-all">
          {nodes[activeStep].label}
        </h2>
        <p className="text-[11px] text-[#9CA3AF]">
          Your results will appear here automatically — no need to refresh
        </p>
      </div>
    </div>
  );
}
