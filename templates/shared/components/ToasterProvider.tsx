"use client";

import { Toaster } from "react-hot-toast";

// Styled with the nextauthforge tokens (styles/authforge.css). The fallbacks
// keep it readable on projects that don't generate that file (--no-ui).
export function ToasterProvider() {
  return (
    <Toaster
      position="top-right"
      containerClassName="af"
      toastOptions={{
        duration: 4500,
        style: {
          background: "var(--af-surface-2, #18181b)",
          color: "var(--af-text, #f5f5f4)",
          border: "1px solid var(--af-border-strong, #71717a)",
          borderRadius: "var(--af-radius, 0.5rem)",
          fontSize: "0.875rem",
        },
        success: { iconTheme: { primary: "#6ee7a8", secondary: "#0a0a0a" } },
        error: { iconTheme: { primary: "#ff8a8a", secondary: "#0a0a0a" } },
      }}
    />
  );
}
