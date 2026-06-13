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

        {/* Floating Glass Navbar */}
        <motion.nav 
          initial={{ y: -50, x: "-50%", opacity: 0 }}
          animate={{ y: 0, x: "-50%", opacity: 1 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
          className="fixed top-6 left-1/2 w-[90%] max-w-4xl glass-pill z-50 px-6 h-14 flex items-center justify-between shadow-lg"
        >
          <div className="flex items-center space-x-3 group cursor-pointer">
            <motion.div 
              whileHover={{ scale: 1.2 }}
              className="w-2.5 h-2.5 rounded-full bg-gemini-blue shadow-[0_0_10px_rgba(66,133,244,0.8)] group-hover:animate-pulse" 
            />
            <Link to="/" className="font-semibold text-sm tracking-wider text-text group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-gemini-blue group-hover:to-gemini-purple transition-all duration-300">
              LUMEN
            </Link>
          </div>
          <div className="flex items-center space-x-6 text-sm text-textMuted">
            <Link to="/how-it-works" className="hover:text-text transition-colors relative group">
              How it works
              {location.pathname === "/how-it-works" && (
                <motion.span layoutId="nav-underline" className="absolute -bottom-1 left-0 w-full h-[1px] bg-gemini-blue" />
              )}
              {location.pathname !== "/how-it-works" && (
                <span className="absolute -bottom-1 left-0 w-0 h-[1px] bg-gradient-to-r from-gemini-blue to-gemini-purple transition-all group-hover:w-full" />
              )}
            </Link>
            <Link to="/architecture" className="hover:text-text transition-colors relative group">
              Architecture
              {location.pathname === "/architecture" && (
                <motion.span layoutId="nav-underline" className="absolute -bottom-1 left-0 w-full h-[1px] bg-gemini-purple" />
              )}
              {location.pathname !== "/architecture" && (
                <span className="absolute -bottom-1 left-0 w-0 h-[1px] bg-gradient-to-r from-gemini-blue to-gemini-purple transition-all group-hover:w-full" />
              )}
            </Link>
            <a href="https://github.com/SanatanSinghVishen/Lumen" target="_blank" rel="noopener noreferrer" className="hover:text-text transition-colors flex items-center group">
              GitHub <span className="opacity-0 -ml-2 group-hover:opacity-100 group-hover:ml-1 transition-all text-gemini-blue">↗</span>
            </a>
          </div>
        </motion.nav>

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
