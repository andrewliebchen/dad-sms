"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import styles from "./SimulatorPage.module.css";
import { signOut } from "next-auth/react";

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

export function SimulatorClient() {
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
  const rootRef = useRef<HTMLDivElement>(null);

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
        setJournalEntries(reset
          ? data.journalEntries
          : (entries) => {
              const existingIds = new Set(entries.map((e: JournalEntry) => e.id));
              const newUnique = data.journalEntries.filter((e: JournalEntry) => !existingIds.has(e.id));
              return [...entries, ...newUnique];
            }
        );
        setJournalHasMore((data.totalJournalEntries || 0) > ((reset ? 0 : journalOffset) + data.journalEntries.length));
        if (reset) setJournalOffset(data.journalEntries.length);
        else setJournalOffset((prev) => prev + data.journalEntries.length);
      }
    } catch {
      setError("Network error");
    }
  }, []);

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

  // System dark mode detection
  useEffect(() => {
    const updateDarkClass = () => {
      if (rootRef.current) {
        if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
          rootRef.current.classList.add('dark');
        } else {
          rootRef.current.classList.remove('dark');
        }
      }
    };
    updateDarkClass();
    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    mql.addEventListener('change', updateDarkClass);
    return () => mql.removeEventListener('change', updateDarkClass);
  }, []);

  return (
    <div
      ref={rootRef}
      className={styles.simulatorRoot}
    >
      {/* Chat Panel */}
      <div className={styles.chatPanel}>
        {/* User Switcher */}
        <div className={styles.userSwitcher}>
          <select
            id="user-select"
            value={selectedUser}
            onChange={e => setSelectedUser(e.target.value)}
            className={styles.userSelect}
          >
            {users.map(u => (
              <option key={u.id} value={u.phoneNumber}>{u.phoneNumber}</option>
            ))}
          </select>
          <button
            onClick={() => signOut()}
            className={styles.deleteButton}
            title="Sign out"
            style={{ marginLeft: 8 }}
          >
            🚪
          </button>
        </div>
        <div
          ref={chatRef}
          className={styles.chatMessages}
          onScroll={handleChatScroll}
        >
          {msgLoadingMore && <div style={{ textAlign: 'center', color: '#888' }}>Loading more...</div>}
          {messages.length === 0 && <div style={{ color: "#888", padding: 16 }}>No messages yet.</div>}
          {messages.map((msg, i) => (
            <div
              key={i}
              className={styles.messageRow}
              style={{ justifyContent: msg.from === "user" ? "flex-end" : "flex-start" }}
            >
              <span
                className={
                  styles.messageBubble + (msg.from === "user" ? ` user` : "")
                }
              >
                {msg.text}
              </span>
            </div>
          ))}
        </div>
        <form onSubmit={sendMessage} className={styles.inputForm}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            className={styles.inputBox}
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className={styles.sendButton}
          >
            {loading ? "..." : "Send"}
          </button>
        </form>
        {error && <div className={styles.error}>{error}</div>}
      </div>
      {/* Journal Panel */}
      <div className={styles.journalPanel}>
        <div
          className={styles.journalEntries}
          onScroll={handleJournalScroll}
        >
          {journalEntries.length === 0 && <div style={{ color: "#888", padding: 16 }}>No journal entries yet.</div>}
          {journalEntries.map((entry) => (
            <div
              key={entry.id}
              className={styles.journalEntry}
            >
              <div className={styles.journalEntryDate}>
                {new Date(entry.createdAt).toLocaleString()}
                <button
                onClick={() => handleDeleteJournalEntry(entry.id)}
                disabled={deletingId === entry.id}
                className={styles.deleteButton}
                title="Delete journal entry"
              >
                {deletingId === entry.id ? '...' : '🗑️'}
              </button>
              </div>
              <div className={styles.journalEntryContent}>{entry.content}</div>
              
            </div>
          ))}
          {journalLoadingMore && <div style={{ textAlign: 'center', color: '#888' }}>Loading more...</div>}
        </div>
      </div>
    </div>
  );
} 