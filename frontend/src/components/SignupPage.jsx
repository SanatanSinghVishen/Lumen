import { SignUp } from "@clerk/clerk-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { fadeUp } from "../utils/motionVariants";

export default function SignupPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 relative overflow-hidden">
      <div className="bg-living-gradient"></div>

      <motion.div 
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        className="flex flex-col items-center z-10"
      >
        <Link to="/" style={{
          display: "flex", alignItems: "center", gap: "8px",
          marginBottom: "2rem", textDecoration: "none"
        }}>
          <div className="w-2.5 h-2.5 rounded-full bg-gemini-blue shadow-[0_0_10px_rgba(66,133,244,0.8)]" />
          <span className="text-[24px] font-semibold text-text tracking-wider hover:text-transparent hover:bg-clip-text hover:bg-gradient-to-r hover:from-gemini-blue hover:to-gemini-purple transition-all duration-300">LUMEN</span>
        </Link>

        <SignUp
          routing="path"
          path="/signup"
          signInUrl="/login"
          afterSignUpUrl="/"
        />
      </motion.div>
    </div>
  );
}
