"use client";
import { signIn } from "next-auth/react";

export function SignInButton() {
  return (
    <button
      style={{
        padding: "12px 32px",
        fontSize: "1.1rem",
        borderRadius: 8,
        border: "none",
        background: "#4285F4",
        color: "white",
        fontWeight: 600,
        cursor: "pointer",
        boxShadow: "0 2px 8px rgba(66,133,244,0.15)",
      }}
      onClick={() => signIn("google")}
    >
      Sign in with Google
    </button>
  );
} 