"use client";

import { useAriaStore } from "@/store/useAriaStore";
import MessageBubble from "./MessageBubble";
import ChatInput from "./ChatInput";
import TypingIndicator from "./TypingIndicator";
import { Bot } from "lucide-react";
import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";

export default function ChatWindow() {
  const { messages, isLoading } = useAriaStore();
  const { data: session } = useSession();
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        animation: "fadeIn 300ms ease-out 100ms both",
      }}
    >
      {/* Chat header */}
      <div
        style={{
          height: 56,
          display: "flex",
          alignItems: "center",
          padding: "0 20px",
          borderBottom: "1px solid var(--border)",
          background: "var(--surface-1)",
          gap: 12,
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: "var(--radius-full)",
            background: "var(--accent-subtle)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Bot size={16} color="var(--accent)" />
        </div>
        <div>
          <div style={{ fontSize: "var(--text-base)", fontWeight: 600, color: "var(--text-primary)" }}>
            Aria
          </div>
          <div style={{ fontSize: "var(--text-xs)", color: "var(--text-secondary)" }}>
            AI Work Assistant
          </div>
        </div>
      </div>

      {/* Message list */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "20px",
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        {messages.length === 0 && !isLoading && (
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 16,
              animation: "fadeIn 400ms ease-out",
            }}
          >
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: "var(--radius-full)",
                background: "var(--accent-subtle)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Bot size={28} color="var(--accent)" />
            </div>
            <div style={{ textAlign: "center" }}>
              <h2 style={{ fontSize: "var(--text-lg)", fontWeight: 600, color: "var(--text-primary)", marginBottom: 6 }}>
                Hey{session?.user?.name ? `, ${session.user.name.split(" ")[0]}` : ""}! I&apos;m Aria
              </h2>
              <p style={{ fontSize: "var(--text-sm)", color: "var(--text-secondary)", maxWidth: 320, lineHeight: 1.6 }}>
                Your AI work assistant. I can help you read emails, draft replies, manage your calendar, and more.
              </p>
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <MessageBubble
            key={msg.id}
            message={msg}
            userImage={session?.user?.image}
            userName={session?.user?.name}
          />
        ))}

        {isLoading && <TypingIndicator />}

        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <ChatInput />
    </div>
  );
}
