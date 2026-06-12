import { BrowserRouter, Routes, Route } from "react-router-dom";
import QueryPage from "./components/QueryPage";
import ReviewPage from "./components/ReviewPage";

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-background flex flex-col items-center">
        <header className="w-full max-w-5xl px-6 py-8 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-primary rounded-sm shadow-[0_0_10px_rgba(74,222,128,0.5)]" />
            <h1 className="font-mono font-medium tracking-tight text-lg text-text">LUMEN</h1>
          </div>
          <div className="text-xs font-mono text-textMuted uppercase tracking-widest">
            Agentic Research
          </div>
        </header>
        
        <main className="w-full max-w-5xl px-6 py-12 flex-1 flex flex-col">
          <Routes>
            <Route path="/" element={<QueryPage />} />
            <Route path="/review/:threadId" element={<ReviewPage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
