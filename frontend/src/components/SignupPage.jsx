import { SignUp } from "@clerk/clerk-react";
import { Link } from "react-router-dom";

export default function SignupPage() {
  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "2rem",
      background: "var(--color-bg-primary)",
    }}>
      <Link to="/" style={{
        display: "flex", alignItems: "center", gap: "8px",
        marginBottom: "2rem", textDecoration: "none"
      }}>
        <div style={{
          width: "10px", height: "10px", borderRadius: "50%",
          background: "#1A56DB"
        }} />
        <span style={{
          fontSize: "20px", fontWeight: 500, color: "#F1F5F9",
          letterSpacing: "0.04em"
        }}>LUMEN</span>
      </Link>

      <SignUp
        routing="path"
        path="/signup"
        signInUrl="/login"
        afterSignUpUrl="/"
      />
    </div>
  );
}
