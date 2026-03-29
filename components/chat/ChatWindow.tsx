"use client";

import { useAriaStore } from "@/store/useAriaStore";
import MessageBubble from "./MessageBubble";
import ChatInput from "./ChatInput";
import TypingIndicator from "./TypingIndicator";
import { Bot, AlertCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";

export default function ChatWindow() {
  const { setMessages: setStoreMessages, conversationId, setConversationId } = useAriaStore();
  const [isInitializing, setIsInitializing] = useState(true);

  // Fetch initial messages on mount
  useEffect(() => {
    async function fetchMessages() {
      try {
        const res = await fetch("/api/messages");
        if (res.ok) {
          const data = await res.json();
          setConversationId(data.conversationId);
          setStoreMessages(data.messages);
        }
      } catch (err) {
        console.error("Failed to fetch messages:", err);
      } finally {
        setIsInitializing(false);
      }
    }
    fetchMessages();
  }, [setConversationId, setStoreMessages]);

  if (isInitializing || !conversationId) {
    return (
      <div style={{ display: "flex", height: "100%", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16 }}>
        <Bot size={48} color="var(--border)" style={{ animation: "statusPulse 2s infinite" }} />
        <div style={{ color: "var(--text-secondary)", fontSize: "var(--text-sm)", animation: "statusPulse 2s infinite", fontFamily: "var(--font-jetbrains-mono), monospace" }}>
           Hydrating Aria...
        </div>
      </div>
    );
  }

  return <ActiveChat />;
}

function ActiveChat() {
  const { messages: storeMessages, setMessages: setStoreMessages, conversationId, setCurrentModelIndex, setModelStatus } = useAriaStore();
  const { data: session } = useSession();
  const bottomRef = useRef<HTMLDivElement>(null);
  const [input, setInput] = useState("");

  const [messages, setMessages] = useState<any[]>(storeMessages);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement> | React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = { id: Date.now().toString(), role: "user" as const, content: input.trim() };
    setMessages([...messages, userMessage] as any);
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          conversationId,
        }),
      });

      if (!res.ok) throw new Error("Failed to send");

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let assistantContent = "";
      const assistantId = Date.now().toString() + "-assistant";

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;
        assistantContent += decoder.decode(value, { stream: true });
        setMessages([
          ...messages,
          userMessage,
          { id: assistantId, role: "assistant" as const, content: assistantContent }
        ] as any);
      }
    } catch (err) {
      console.error("Send failed:", err);
      setError(err instanceof Error ? err : new Error("Unknown error"));
    } finally {
      setIsLoading(false);
    }
  };


  // Hydration is handled explicitly by ActiveChat's delayed mount

  // Keep store in sync
  useEffect(() => {
    if (messages.length > 0) {
      setStoreMessages(messages as any);
    }
  }, [messages, setStoreMessages]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading, error]);

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

        {messages.map((msg: any) => (
          <MessageBubble
            key={msg.id}
            message={msg}
            userImage={session?.user?.image}
            userName={session?.user?.name}
          />
        ))}

        {isLoading && <TypingIndicator />}

        {error && (
          <div
            style={{
              background: "var(--error-subtle)",
              border: "1px solid var(--error)",
              borderRadius: "var(--radius-md)",
              padding: "16px",
              color: "var(--text-primary)",
              fontSize: "var(--text-sm)",
              display: "flex",
              alignItems: "flex-start",
              gap: 12,
              animation: "fadeIn 300ms ease-out",
              alignSelf: "center",
              maxWidth: "80%",
            }}
          >
            <AlertCircle size={18} color="var(--error)" style={{ flexShrink: 0, marginTop: 2 }} />
            <div>
              <div style={{ fontWeight: 600, color: "var(--error)", marginBottom: 4 }}>
                Failed to send message
              </div>
              <div style={{ color: "var(--text-secondary)", lineHeight: 1.5 }}>
                {error.message || "Aria encountered an error. Please try sending your message again."}
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <ChatInput
        input={input}
        handleInputChange={handleInputChange}
        handleSubmit={handleSubmit}
        isLoading={isLoading}
      />
    </div>
  );
}
