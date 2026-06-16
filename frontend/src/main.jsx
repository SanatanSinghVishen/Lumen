import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { ClerkProvider } from "@clerk/clerk-react";

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

// Dark theme to match LUMEN exactly
const clerkAppearance = {
  baseTheme: undefined,
  variables: {
    colorPrimary:        "#1A56DB",
    colorBackground:     "#0F1117",
    colorInputBackground:"#1A1D27",
    colorInputText:      "#F1F5F9",
    colorText:           "#F1F5F9",
    colorTextSecondary:  "#94A3B8",
    colorNeutral:        "#1E293B",
    colorDanger:         "#E24B4A",
    colorSuccess:        "#1D9E75",
    borderRadius:        "12px",
    fontFamily:          "Inter, sans-serif",
    fontSize:            "14px",
  },
  elements: {
    card:                "glassmorphism-card",
    headerTitle:         "clerk-header-title",
    headerSubtitle:      "clerk-header-subtitle",
    socialButtonsBlockButton: "clerk-social-btn",
    formButtonPrimary:   "clerk-primary-btn",
    footerActionLink:    "clerk-footer-link",
  },
};

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ClerkProvider
      publishableKey={PUBLISHABLE_KEY}
      appearance={clerkAppearance}
      afterSignInUrl="/"
      afterSignUpUrl="/"
      signInUrl="/login"
      signUpUrl="/signup"
    >
      <App />
    </ClerkProvider>
  </React.StrictMode>
);
