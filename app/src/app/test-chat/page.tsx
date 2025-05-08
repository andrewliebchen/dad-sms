"use client";
import React, { useState } from "react";

interface Message {
  from: "user" | "ai";
  text: string;
}

export default function TestChatPage() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    setMessages((msgs) => [...msgs, { from: "user", text: input }]);
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/test-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessages((msgs) => [...msgs, { from: "ai", text: data.response }]);
      } else {
        setError(data.error || "Unknown error");
      }
    } catch (err) {
      setError("Network error");
    } finally {
      setLoading(false);
      setInput("");
    }
  };

  return (
    <div style={{ maxWidth: 500, margin: "2rem auto", fontFamily: "sans-serif" }}>
      <h2>Test Chat with AI</h2>
      <div style={{ border: "1px solid #ccc", borderRadius: 8, padding: 16, minHeight: 200, marginBottom: 16 }}>
        {messages.length === 0 && <div style={{ color: "#888" }}>No messages yet.</div>}
        {messages.map((msg, i) => (
          <div key={i} style={{ textAlign: msg.from === "user" ? "right" : "left", margin: "8px 0" }}>
            <span style={{ background: msg.from === "user" ? "#e0f7fa" : "#f1f8e9", padding: "6px 12px", borderRadius: 16, display: "inline-block" }}>
              {msg.text}
            </span>
          </div>
        ))}
      </div>
      <form onSubmit={sendMessage} style={{ display: "flex", gap: 8 }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
          style={{ flex: 1, padding: 8, borderRadius: 4, border: "1px solid #ccc" }}
          disabled={loading}
        />
        <button type="submit" disabled={loading || !input.trim()} style={{ padding: "8px 16px" }}>
          {loading ? "..." : "Send"}
        </button>
      </form>
      {error && <div style={{ color: "red", marginTop: 8 }}>{error}</div>}
    </div>
  );
} 