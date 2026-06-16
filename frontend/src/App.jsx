import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { SignedIn, SignedOut, RedirectToSignIn } from "@clerk/clerk-react";
import Layout from "./components/Layout";
import LandingPage from "./components/LandingPage";
import LoadingPage from "./components/LoadingPage";
import ReviewPage from "./components/ReviewPage";
import ResultPage from "./components/ResultPage";
import HowItWorksPage from "./components/HowItWorksPage";
import ArchitecturePage from "./components/ArchitecturePage";
import LoginPage from "./components/LoginPage";
import SignupPage from "./components/SignupPage";
import HistoryPage from "./components/HistoryPage";

export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

// Protected route wrapper — redirects to /login if not signed in
function ProtectedRoute({ children }) {
  return (
    <>
      <SignedIn>{children}</SignedIn>
      <SignedOut><RedirectToSignIn /></SignedOut>
    </>
  );
}

function AnimatedRoutes() {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Public auth routes outside Layout to avoid navbar on login/signup pages */}
        <Route path="/login/*" element={<LoginPage />} />
        <Route path="/signup/*" element={<SignupPage />} />
        
        <Route element={<Layout />}>
          {/* Public routes */}
          <Route path="/how-it-works" element={<HowItWorksPage />} />
          <Route path="/architecture" element={<ArchitecturePage />} />

          {/* App routes - accessible anonymously */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/loading/:thread_id" element={<LoadingPage />} />
          <Route path="/review/:thread_id" element={<ReviewPage />} />
          <Route path="/result/:thread_id" element={<ResultPage />} />
          
          {/* Protected routes */}
          <Route path="/history" element={<ProtectedRoute><HistoryPage /></ProtectedRoute>} />
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
