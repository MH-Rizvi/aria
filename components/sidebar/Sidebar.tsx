"use client";

import { useAriaStore } from "@/store/useAriaStore";
import { useSession, signOut } from "next-auth/react";
import { Bot, Mail, Calendar, Zap, BarChart2, LogOut, Menu, X, Plus } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const MODEL_NAMES = [
  "llama-3.3-70b",
  "llama-4-maverick",
  "kimi-k2",
  "qwen3-32b",
  "llama-3.1-8b",
];

export default function Sidebar() {
  const { gmailConnected, calendarConnected, currentModelIndex, modelStatus, clearMessages, setConversationId } = useAriaStore();
  const { data: session } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showNewChatConfirm, setShowNewChatConfirm] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  const handleNewChat = async () => {
    setIsClearing(true);
    try {
      await fetch("/api/messages", { method: "DELETE" });
      clearMessages();
      setConversationId(null);
      
      const res = await fetch("/api/messages");
      if (res.ok) {
        const data = await res.json();
        setConversationId(data.conversationId);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsClearing(false);
      setShowNewChatConfirm(false);
    }
  };

  const modelStatusColor = 
    modelStatus === "rate-limited" ? "var(--warning)" :
    modelStatus === "exhausted" ? "var(--error)" : 
    "var(--success)";

  const sidebarContent = (
    <>
      {/* Logo section */}
      <div style={{ padding: 24, display: "flex", alignItems: "center", gap: 12 }}>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: "var(--radius-full)",
            background: "var(--accent-subtle)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Bot size={20} color="var(--accent)" />
        </div>
        <span style={{ fontSize: "var(--text-lg)", fontWeight: 700, color: "var(--text-primary)" }}>
          Aria
        </span>
      </div>

      {/* Connection cards */}
      <div style={{ padding: "0 16px", display: "flex", flexDirection: "column", gap: 8 }}>
        
        {/* New Chat Button */}
        <div style={{ paddingBottom: 8 }}>
          {!showNewChatConfirm ? (
            <button
              onClick={() => setShowNewChatConfirm(true)}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                padding: "10px",
                background: "transparent",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-md)",
                color: "var(--text-secondary)",
                fontSize: "var(--text-sm)",
                cursor: "pointer",
                transition: "all 150ms ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "var(--text-primary)";
                e.currentTarget.style.borderColor = "var(--text-tertiary)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "var(--text-secondary)";
                e.currentTarget.style.borderColor = "var(--border)";
              }}
            >
              <Plus size={16} />
              New Chat
            </button>
          ) : (
            <div
              style={{
                background: "var(--surface-2)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-md)",
                padding: "12px",
                display: "flex",
                flexDirection: "column",
                gap: 12,
              }}
            >
              <div style={{ fontSize: "var(--text-xs)", color: "var(--text-primary)", textAlign: "center" }}>
                Start a new conversation? This will clear your current chat.
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={() => setShowNewChatConfirm(false)}
                  disabled={isClearing}
                  style={{
                    flex: 1,
                    padding: "6px",
                    background: "transparent",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius-sm)",
                    color: "var(--text-secondary)",
                    fontSize: "var(--text-xs)",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleNewChat}
                  disabled={isClearing}
                  style={{
                    flex: 1,
                    padding: "6px",
                    background: "var(--warning)",
                    border: "none",
                    borderRadius: "var(--radius-sm)",
                    color: "#000",
                    fontSize: "var(--text-xs)",
                    fontWeight: 600,
                    cursor: "pointer",
                    opacity: isClearing ? 0.7 : 1,
                  }}
                >
                  {isClearing ? "Clearing..." : "Confirm"}
                </button>
              </div>
            </div>
          )}
        </div>
        {/* Gmail card */}
        <div
          style={{
            background: "var(--surface-2)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-md)",
            padding: 12,
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: "var(--radius-full)",
              background: gmailConnected ? "var(--success)" : "var(--error)",
              flexShrink: 0,
            }}
          />
          <Mail size={16} color="var(--text-secondary)" />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: "var(--text-sm)", fontWeight: 500, color: "var(--text-primary)" }}>
              Gmail
            </div>
            <div style={{ fontSize: "var(--text-xs)", color: "var(--text-secondary)" }}>
              {gmailConnected ? "Connected" : "Not connected"}
            </div>
          </div>
        </div>

        {/* Calendar card */}
        <div
          style={{
            background: "var(--surface-2)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-md)",
            padding: 12,
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: "var(--radius-full)",
              background: calendarConnected ? "var(--success)" : "var(--error)",
              flexShrink: 0,
            }}
          />
          <Calendar size={16} color="var(--text-secondary)" />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: "var(--text-sm)", fontWeight: 500, color: "var(--text-primary)" }}>
              Calendar
            </div>
            <div style={{ fontSize: "var(--text-xs)", color: "var(--text-secondary)" }}>
              {calendarConnected ? "Connected" : "Not connected"}
            </div>
          </div>
        </div>
      </div>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Bottom section */}
      <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12, borderTop: "1px solid var(--border)" }}>
        {/* Active model indicator */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Zap size={14} color="var(--accent)" />
          <div
            style={{
              width: 6,
              height: 6,
              borderRadius: "var(--radius-full)",
              background: modelStatusColor,
              animation: "statusPulse 2000ms infinite",
            }}
          />
          <span
            style={{
              fontSize: "var(--text-xs)",
              color: "var(--text-secondary)",
              fontFamily: "var(--font-jetbrains-mono), monospace",
            }}
          >
            {MODEL_NAMES[currentModelIndex] || MODEL_NAMES[0]}
          </span>
        </div>

        {/* Dashboard link */}
        <Link
          href="/dashboard"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontSize: "var(--text-sm)",
            color: "var(--text-secondary)",
            textDecoration: "none",
            padding: "8px 0",
            transition: "color 150ms ease",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-primary)")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-secondary)")}
        >
          <BarChart2 size={16} />
          Dashboard
        </Link>

        {/* User + sign out */}
        {session?.user && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, paddingTop: 8, borderTop: "1px solid var(--border)" }}>
            {session.user.image ? (
              <img
                src={session.user.image}
                alt={session.user.name || "User"}
                style={{ width: 28, height: 28, borderRadius: "var(--radius-full)", objectFit: "cover" }}
              />
            ) : (
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: "var(--radius-full)",
                  background: "var(--surface-3)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "var(--text-xs)",
                  fontWeight: 600,
                  color: "var(--text-primary)",
                }}
              >
                {session.user.name?.charAt(0)?.toUpperCase() || "U"}
              </div>
            )}
            <span style={{ flex: 1, fontSize: "var(--text-xs)", color: "var(--text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {session.user.name || session.user.email}
            </span>
            <button
              onClick={() => signOut()}
              title="Sign out"
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "var(--text-tertiary)",
                padding: 4,
                display: "flex",
                alignItems: "center",
                transition: "color 150ms ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "var(--error)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-tertiary)")}
            >
              <LogOut size={14} />
            </button>
          </div>
        )}
      </div>
    </>
  );

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="sidebar-mobile-toggle"
        style={{
          position: "absolute",
          top: 10,
          left: 16,
          zIndex: 60,
          width: 36,
          height: 36,
          borderRadius: "var(--radius-sm)",
          background: "var(--surface-2)",
          border: "1px solid var(--border)",
          display: "none",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          color: "var(--text-primary)",
        }}
      >
        {mobileOpen ? <X size={18} /> : <Menu size={18} />}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="sidebar-overlay"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            zIndex: 40,
            display: "none",
          }}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`sidebar ${mobileOpen ? "sidebar-open" : ""}`}
        style={{
          width: 260,
          height: "100%",
          background: "var(--surface-1)",
          borderRight: "1px solid var(--border)",
          display: "flex",
          flexDirection: "column",
          flexShrink: 0,
          animation: "slideInLeft 300ms ease-out",
          overflow: "hidden",
        }}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
