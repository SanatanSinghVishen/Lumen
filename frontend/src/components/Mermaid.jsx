import React, { useEffect, useRef, useState } from "react";
import mermaid from "mermaid";

export default function Mermaid({ chart }) {
  const [svg, setSvg] = useState("");

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: "dark",
      securityLevel: "loose",
    });
    
    const renderChart = async () => {
      try {
        if (chart) {
          const id = `mermaid-chart-${Math.round(Math.random() * 1000000)}`;
          const { svg } = await mermaid.render(id, chart);
          setSvg(svg);
        }
      } catch (err) {
        console.error("Mermaid rendering error", err);
      }
    };
    
    renderChart();
  }, [chart]);

  return (
    <div 
      className="bg-[rgba(0,0,0,0.2)] p-4 rounded-lg my-4 flex justify-center overflow-x-auto" 
      dangerouslySetInnerHTML={{ __html: svg || chart }}
    />
  );
}
