import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import Layout from "./components/Layout";
import LandingPage from "./components/LandingPage";
import LoadingPage from "./components/LoadingPage";
import ReviewPage from "./components/ReviewPage";
import ResultPage from "./components/ResultPage";
import HowItWorksPage from "./components/HowItWorksPage";
import ArchitecturePage from "./components/ArchitecturePage";

export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

function AnimatedRoutes() {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route element={<Layout />}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/how-it-works" element={<HowItWorksPage />} />
          <Route path="/architecture" element={<ArchitecturePage />} />
          <Route path="/loading/:thread_id" element={<LoadingPage />} />
          <Route path="/review/:thread_id" element={<ReviewPage />} />
          <Route path="/result/:thread_id" element={<ResultPage />} />
        </Route>
      </Routes>
    </AnimatePresence>
  );
}

function App() {
  return (
    <Router>
      <AnimatedRoutes />
    </Router>
  );
}

export default App;
