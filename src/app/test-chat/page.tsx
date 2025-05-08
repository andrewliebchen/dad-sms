"use client";
import React, { useState, useEffect } from "react";

interface Message {
  from: "user" | "ai";
  text: string;
}

// Define a type for the expected message shape from the API
interface ApiMessage {
  direction: 'INCOMING' | 'OUTGOING';
  content: string;
}

function isApiMessage(msg: unknown): msg is ApiMessage {
  return (
    typeof msg === 'object' &&
    msg !== null &&
    'direction' in msg &&
    (msg as { direction?: unknown }).direction !== undefined &&
    ((msg as { direction: unknown }).direction === 'INCOMING' || (msg as { direction: unknown }).direction === 'OUTGOING') &&
    'content' in msg &&
    typeof (msg as { content?: unknown }).content === 'string'
  );
}

interface JournalEntry {
  id: string;
  content: string;
  createdAt: string;
}

const TEST_PHONE = "+1555555555";

export default function TestChatPage() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch messages and journal entries on mount
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const res = await fetch(`/api/test-chat?from=${encodeURIComponent(TEST_PHONE)}`);
        const data = await res.json();
        if (res.ok && Array.isArray(data.messages)) {
          setMessages(
            data.messages.map((msg: unknown) => {
              if (isApiMessage(msg)) {
                return {
                  from: msg.direction === 'INCOMING' ? 'user' : 'ai',
                  text: msg.content,
                };
              }
              return { from: 'ai', text: '' };
            })
          );
          if (Array.isArray(data.journalEntries)) {
            setJournalEntries(data.journalEntries);
          }
        } else {
          setError(data.error || "Failed to load messages");
        }
      } catch {
        setError("Network error");
      }
    };
    fetchMessages();
  }, []);

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
        body: JSON.stringify({ message: input, from: TEST_PHONE }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessages((msgs) => [...msgs, { from: "ai", text: data.response }]);
      } else {
        setError(data.error || "Unknown error");
      }
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
      setInput("");
    }
  };

  return (
    <div
      style={{
        height: "100vh",
        width: "100vw",
        background: "#fff",
        display: "flex",
        alignItems: "stretch",
        justifyContent: "center",
        boxSizing: "border-box",
        flexDirection: "row",
      }}
    >
        {/* Chat Panel */}
        <div
          style={{
            flex: 1,
            background: "#fff",            
            display: "flex",
            flexDirection: "column",
            minWidth: 0,
          }}
        >
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              overflowX: "hidden",
              padding: 12,
            }}
          >
            {messages.length === 0 && <div style={{ color: "#888", padding: 16 }}>No messages yet.</div>}
            {messages.map((msg, i) => (
              <div
                key={i}
                style={{
                  textAlign: msg.from === "user" ? "right" : "left",
                  margin: "12px 0",
                  display: "flex",
                  justifyContent: msg.from === "user" ? "flex-end" : "flex-start",
                }}
              >
                <span
                  style={{
                    display: "inline-block",
                    background: msg.from === "user" ? "#dbeafe" : "#e7f6e7",
                    color: "#222",
                    borderRadius: 16,
                    padding: "10px 18px",
                    maxWidth: 320,
                    fontSize: 16,
                    boxShadow: msg.from === "user"
                      ? "0 1px 4px rgba(59,130,246,0.08)"
                      : "0 1px 4px rgba(34,197,94,0.08)",
                  }}
                >
                  {msg.text}
                </span>
              </div>
            ))}
          </div>
          <form onSubmit={sendMessage} style={{ display: "flex", gap: 8, padding: 12, borderTop: "1px solid #e3e7ee" }}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              style={{
                flex: 1,
                padding: 12,
                borderRadius: 6,
                border: "1px solid #cbd5e1",
                fontSize: 16,
                background: "#f8fafc",
              }}
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              style={{
                padding: "0 24px",
                fontSize: 16,
                borderRadius: 6,
                background: "#2563eb",
                color: "#fff",
                border: "none",
                fontWeight: 600,
                cursor: loading || !input.trim() ? "not-allowed" : "pointer",
                opacity: loading || !input.trim() ? 0.7 : 1,
                transition: "opacity 0.2s",
              }}
            >
              {loading ? "..." : "Send"}
            </button>
          </form>
          {error && <div style={{ color: "red", marginTop: 8 }}>{error}</div>}
        </div>
        {/* Journal Panel */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              background: "#f8fafc",
              borderLeft: "1px solid #e3e7ee",
              padding: 12,
            }}
          >
            {journalEntries.length === 0 && <div style={{ color: "#888", padding: 16 }}>No journal entries yet.</div>}
            {journalEntries.map((entry) => (
              <div
                key={entry.id}
                style={{
                  background: "#fff",
                  border: "1px solid #e5e7eb",
                  borderRadius: 8,
                  padding: 16,
                  marginBottom: 16,
                  boxShadow: "0 1px 4px rgba(0,0,0,0.03)",
                }}
              >
                <div style={{ fontSize: 13, color: "#64748b", marginBottom: 6 }}>
                  {new Date(entry.createdAt).toLocaleString()}
                </div>
                <div style={{ whiteSpace: "pre-line", fontSize: 16, color: "#222" }}>{entry.content}</div>
              </div>
            ))}
          </div>
        
      </div>
      {/* Responsive: stack vertically on small screens */}
      <style>{`
        @media (max-width: 900px) {
          div[style*='flex-direction: row'] {
            flex-direction: column !important;
            gap: 24px !important;
          }
          div[style*='height: 600px'] {
            height: 400px !important;
          }
        }
      `}</style>
    </div>
  );
} 