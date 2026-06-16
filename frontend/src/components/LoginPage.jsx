import { SignIn } from "@clerk/clerk-react";
import { Link } from "react-router-dom";

export default function LoginPage() {
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

      {/* LUMEN logo above the form */}
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

      {/* Clerk's SignIn component — styled via clerkAppearance */}
      <SignIn
        routing="path"
        path="/login"
        signUpUrl="/signup"
        afterSignInUrl="/"
      />

      <p style={{
        marginTop: "1.5rem", fontSize: "12px",
        color: "#64748B", textAlign: "center"
      }}>
        By signing in you agree to LUMEN's terms of use.
        <br />Your research history is private and visible only to you.
      </p>
    </div>
  );
}
