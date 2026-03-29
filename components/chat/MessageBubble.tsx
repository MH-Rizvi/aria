"use client";

import { Message } from "@/store/useAriaStore";
import { Bot } from "lucide-react";
import { useState } from "react";

interface MessageBubbleProps {
  message: Message;
  userImage?: string | null;
  userName?: string | null;
}

export default function MessageBubble({ message, userImage, userName }: MessageBubbleProps) {
  const [showTimestamp, setShowTimestamp] = useState(false);
  const isUser = message.role === "user";

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div
      onMouseEnter={() => setShowTimestamp(true)}
      onMouseLeave={() => setShowTimestamp(false)}
      style={{
        display: "flex",
        flexDirection: isUser ? "row-reverse" : "row",
        alignItems: "flex-end",
        gap: 10,
        maxWidth: "70%",
        alignSelf: isUser ? "flex-end" : "flex-start",
        animation: "bubbleIn 200ms ease-out",
      }}
    >
      {/* Avatar */}
      {isUser ? (
        userImage ? (
          <img
            src={userImage}
            alt={userName || "User"}
            style={{
              width: 32,
              height: 32,
              borderRadius: "var(--radius-full)",
              flexShrink: 0,
              objectFit: "cover",
            }}
          />
        ) : (
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: "var(--radius-full)",
              background: "var(--surface-3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              fontSize: "var(--text-sm)",
              fontWeight: 600,
              color: "var(--text-primary)",
            }}
          >
            {userName?.charAt(0)?.toUpperCase() || "U"}
          </div>
        )
      ) : (
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: "var(--radius-full)",
            background: "var(--accent-subtle)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Bot size={16} color="var(--accent)" />
        </div>
      )}

      {/* Bubble + timestamp wrapper */}
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <div
          style={{
            background: isUser ? "var(--bubble-user)" : "var(--bubble-aria)",
            color: isUser ? "var(--bubble-user-text)" : "var(--bubble-aria-text)",
            border: isUser ? "none" : "1px solid var(--border)",
            borderRadius: isUser ? "20px 20px 4px 20px" : "20px 20px 20px 4px",
            padding: "12px 16px",
            fontSize: "var(--text-base)",
            lineHeight: 1.5,
            wordBreak: "break-word",
            whiteSpace: "pre-wrap",
          }}
        >
          {message.content || (message as any).parts?.[0]?.text || ""}
        </div>

        {/* Timestamp — show on hover */}
        <span
          style={{
            fontSize: "var(--text-xs)",
            color: "var(--text-tertiary)",
            textAlign: isUser ? "right" : "left",
            opacity: showTimestamp ? 1 : 0,
            transition: "opacity 150ms ease",
            paddingLeft: isUser ? 0 : 4,
            paddingRight: isUser ? 4 : 0,
          }}
        >
          {message.createdAt ? formatTime(message.createdAt) : ""}
        </span>
      </div>
    </div>
  );
}
