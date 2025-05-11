"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";

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

interface User {
  id: string;
  phoneNumber: string;
}

export default function SimulatorPage() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>("");
  const chatRef = useRef<HTMLDivElement>(null);
  const [msgOffset, setMsgOffset] = useState(0);
  const [msgHasMore, setMsgHasMore] = useState(true);
  const [msgLoadingMore, setMsgLoadingMore] = useState(false);
  const [journalOffset, setJournalOffset] = useState(0);
  const [journalHasMore, setJournalHasMore] = useState(true);
  const [journalLoadingMore, setJournalLoadingMore] = useState(false);
  const MSG_LIMIT = 20;
  const JOURNAL_LIMIT = 10;

  // Fetch users on mount
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch("/api/simulator?users=1");
        const data = await res.json();
        if (res.ok && Array.isArray(data.users)) {
          setUsers(data.users);
          // Default to TEST_PHONE if present, else first user
          const defaultUser = data.users.find((u: User) => u.phoneNumber === "+1555555555") || data.users[0];
          if (defaultUser) setSelectedUser(defaultUser.phoneNumber);
        }
      } catch {}
    };
    fetchUsers();
  }, []);

  // Fetch paginated messages and journal entries
  const fetchMessagesAndJournal = useCallback(async (user: string, reset = false) => {
    try {
      const res = await fetch(`/api/simulator?from=${encodeURIComponent(user)}&msgLimit=${MSG_LIMIT}&msgOffset=${reset ? 0 : msgOffset}&journalLimit=${JOURNAL_LIMIT}&journalOffset=${reset ? 0 : journalOffset}`);
      const data = await res.json();
      if (res.ok && Array.isArray(data.messages)) {
        const newMessages = data.messages.map((msg: unknown) => {
          if (isApiMessage(msg)) {
            return {
              from: msg.direction === 'INCOMING' ? 'user' : 'ai',
              text: msg.content,
            };
          }
          return { from: 'ai', text: '' };
        });
        setMessages(reset ? newMessages : (msgs) => [...newMessages, ...msgs]);
        setMsgHasMore((data.totalMessages || 0) > ((reset ? 0 : msgOffset) + newMessages.length));
        if (reset) setMsgOffset(newMessages.length);
        else setMsgOffset((prev) => prev + newMessages.length);
      } else {
        setError(data.error || "Failed to load messages");
      }
      if (Array.isArray(data.journalEntries)) {
        setJournalEntries(reset ? data.journalEntries : (entries) => [...entries, ...data.journalEntries]);
        setJournalHasMore((data.totalJournalEntries || 0) > ((reset ? 0 : journalOffset) + data.journalEntries.length));
        if (reset) setJournalOffset(data.journalEntries.length);
        else setJournalOffset((prev) => prev + data.journalEntries.length);
      }
    } catch {
      setError("Network error");
    }
  }, [msgOffset, journalOffset]);

  // Fetch on user change (reset offsets)
  useEffect(() => {
    if (!selectedUser) return;
    setMsgOffset(0);
    setJournalOffset(0);
    setMessages([]);
    setJournalEntries([]);
    setMsgHasMore(true);
    setJournalHasMore(true);
    fetchMessagesAndJournal(selectedUser, true);
  }, [selectedUser]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !selectedUser) return;
    setMessages((msgs) => [...msgs, { from: "user", text: input }]);
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/simulator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input, from: selectedUser }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessages((msgs) => [...msgs, { from: "ai", text: data.response }]);
        // Re-fetch messages and journal entries after sending a message
        await fetchMessagesAndJournal(selectedUser);
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

  const handleDeleteJournalEntry = async (id: string) => {
    setDeletingId(id);
    setError(null);
    try {
      const res = await fetch('/api/journal', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (res.ok) {
        setJournalEntries((entries) => entries.filter((entry) => entry.id !== id));
      } else {
        setError(data.error || 'Failed to delete journal entry');
      }
    } catch {
      setError('Network error');
    } finally {
      setDeletingId(null);
    }
  };

  // Infinite scroll for messages (chat)
  const handleChatScroll = async (e: React.UIEvent<HTMLDivElement>) => {
    if (msgLoadingMore || !msgHasMore) return;
    const el = e.currentTarget;
    if (el.scrollTop < 60) {
      setMsgLoadingMore(true);
      await fetchMessagesAndJournal(selectedUser);
      setMsgLoadingMore(false);
    }
  };

  // Infinite scroll for journal entries
  const handleJournalScroll = async (e: React.UIEvent<HTMLDivElement>) => {
    if (journalLoadingMore || !journalHasMore) return;
    const el = e.currentTarget;
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 60) {
      setJournalLoadingMore(true);
      await fetchMessagesAndJournal(selectedUser);
      setJournalLoadingMore(false);
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
        {/* User Switcher */}
      <div style={{ padding: 12, borderBottom: '1px solid #e3e7ee' }}>
        <select
          id="user-select"
          value={selectedUser}
          onChange={e => setSelectedUser(e.target.value)}
          style={{ padding: '6px 12px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 15 }}
        >
          {users.map(u => (
            <option key={u.id} value={u.phoneNumber}>{u.phoneNumber}</option>
          ))}
        </select>
      </div>
        <div
          ref={chatRef}
          style={{
            flex: 1,
            overflowY: "auto",
            overflowX: "hidden",
            padding: 12,
          }}
          onScroll={handleChatScroll}
        >
          {msgLoadingMore && <div style={{ textAlign: 'center', color: '#888' }}>Loading more...</div>}
          {messages.length === 0 && <div style={{ color: "#888", padding: 16 }}>No messages yet.</div>}
          {messages.map((msg, i) => (
            <div
              key={i}
              style={{
                margin: "12px 0",
                display: "flex",
                justifyContent: msg.from === "user" ? "flex-end" : "flex-start",
              }}
            >
              <span
                style={{
                  display: "inline-block",
                  background: msg.from === "user" ? "rgba(0,0,0,0.05)" : "#e7f6e7",
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
          onScroll={handleJournalScroll}
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
                marginBottom: 8,
                boxShadow: "0 1px 4px rgba(0,0,0,0.03)",
                position: 'relative',
              }}
            >
              <div style={{ fontSize: 13, color: "#64748b", marginBottom: 6 }}>
                {new Date(entry.createdAt).toLocaleString()}
              </div>
              <div style={{ whiteSpace: "pre-line", fontSize: 16, color: "#222" }}>{entry.content}</div>
              <button
                onClick={() => handleDeleteJournalEntry(entry.id)}
                disabled={deletingId === entry.id}
                style={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  background: 'rgba(0,0,0,0.05)',
                  border: 'none',
                  borderRadius: 4,
                  padding: '2px 10px',
                  fontSize: 13,
                  cursor: deletingId === entry.id ? 'not-allowed' : 'pointer',
                  opacity: deletingId === entry.id ? 0.6 : 1,
                  transition: 'opacity 0.2s',
                }}
                title="Delete journal entry"
              >
                {deletingId === entry.id ? '...' : '🗑️'}
              </button>
            </div>
          ))}
          {journalLoadingMore && <div style={{ textAlign: 'center', color: '#888' }}>Loading more...</div>}
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