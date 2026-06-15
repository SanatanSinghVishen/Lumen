import { Outlet, Link, useLocation } from "react-router-dom";
import { ReactLenis } from "lenis/react";
import { motion, AnimatePresence } from "framer-motion";
import { fadeUp, fadeIn } from "../utils/motionVariants";

export default function Layout() {
  const location = useLocation();
  const isStreaming = location.pathname.startsWith("/loading");

  return (
    <ReactLenis root options={{ lerp: 0.08, smoothWheel: true }}>
      <div className="min-h-screen flex flex-col font-sans selection:bg-gemini-blue selection:text-white relative">
        {/* Living Gradient Background */}
        <motion.div 
          className={`bg-living-gradient ${isStreaming ? "active" : ""}`}
          animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
          transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
        />

        {/* Header Navigation */}
        <motion.header 
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
          className="fixed top-0 left-0 w-full z-50 px-8 py-6 flex items-center justify-between pointer-events-none"
        >
          <div className="flex items-center space-x-3 group cursor-pointer pointer-events-auto">
            <motion.div 
              whileHover={{ scale: 1.2 }}
              className="w-2.5 h-2.5 rounded-full bg-gemini-blue shadow-[0_0_10px_rgba(66,133,244,0.8)] group-hover:animate-pulse" 
            />
            <Link to="/" className="font-semibold text-sm tracking-wider text-text group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-gemini-blue group-hover:to-gemini-purple transition-all duration-300">
              LUMEN
            </Link>
          </div>
          <nav className="flex items-center space-x-2 text-sm pointer-events-auto">
            <Link to="/how-it-works" className="nav-pill">
              How it works
            </Link>
            <Link to="/architecture" className="nav-pill">
              Architecture
            </Link>
            <a href="https://github.com/SanatanSinghVishen/Lumen" target="_blank" rel="noopener noreferrer" className="nav-pill flex items-center group">
              GitHub <span className="opacity-0 w-0 group-hover:w-auto group-hover:opacity-100 group-hover:ml-1 transition-all text-gemini-blue overflow-hidden">↗</span>
            </a>
          </nav>
        </motion.header>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col pt-28 pb-10">
          {/* We wrap the Outlet in a motion.div to apply page transitions */}
          <motion.div
            key={location.pathname}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="flex flex-col flex-1"
          >
            <Outlet />
          </motion.div>
        </main>

        {/* Footer */}
        <motion.footer 
          variants={fadeIn}
          initial="hidden"
          animate="visible"
          className="w-full py-6 px-6 mt-auto"
        >
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between text-[11px] sm:text-xs text-textMuted">
            <div className="mb-4 sm:mb-0">
              Built by <span className="font-medium text-text">Sanatan Singh</span> · IIIT Nagpur · B.Tech CSE 2027
            </div>
            <div className="flex items-center space-x-5">
               <a href="https://www.linkedin.com/in/sanatan-singh-55b3502a3/" target="_blank" rel="noopener noreferrer" className="hover:text-gemini-blue transition-colors">
                LinkedIn
              </a>
              <a href="https://github.com/SanatanSinghVishen/Lumen" target="_blank" rel="noopener noreferrer" className="hover:text-gemini-purple transition-colors">
                GitHub
              </a>
            </div>
          </div>
        </motion.footer>
      </div>
    </ReactLenis>
  );
}
