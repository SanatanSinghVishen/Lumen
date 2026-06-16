import { SignIn } from "@clerk/clerk-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { fadeUp } from "../utils/motionVariants";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 relative overflow-hidden">
      <div className="bg-living-gradient"></div>

      <motion.div 
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        className="flex flex-col items-center z-10"
      >
        {/* LUMEN logo above the form */}
        <Link to="/" style={{
          display: "flex", alignItems: "center", gap: "8px",
          marginBottom: "2rem", textDecoration: "none"
        }}>
          <div className="w-2.5 h-2.5 rounded-full bg-gemini-blue shadow-[0_0_10px_rgba(66,133,244,0.8)]" />
          <span className="text-[24px] font-semibold text-text tracking-wider hover:text-transparent hover:bg-clip-text hover:bg-gradient-to-r hover:from-gemini-blue hover:to-gemini-purple transition-all duration-300">LUMEN</span>
        </Link>

        {/* Clerk's SignIn component — styled via clerkAppearance */}
        <SignIn
          routing="path"
          path="/login"
          signUpUrl="/signup"
          afterSignInUrl="/"
        />

        <p className="mt-8 text-[12px] text-textMuted text-center">
          By signing in you agree to LUMEN's terms of use.
          <br />Your research history is private and visible only to you.
        </p>
      </motion.div>
    </div>
  );
}
