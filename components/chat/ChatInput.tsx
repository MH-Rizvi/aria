"use client";

import { useAriaStore } from "@/store/useAriaStore";
import { ArrowUp } from "lucide-react";
import { useRef, useState, useCallback, KeyboardEvent } from "react";

export default function ChatInput() {
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { addMessage, isLoading } = useAriaStore();

  const adjustHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = Math.min(textarea.scrollHeight, 120) + "px";
    }
  }, []);

  const handleSend = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    addMessage({
      id: crypto.randomUUID(),
      role: "user",
      content: trimmed,
      createdAt: new Date(),
    });

    setInput("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }, [input, isLoading, addMessage]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const hasText = input.trim().length > 0;

  return (
    <div
      style={{
        background: "var(--surface-1)",
        borderTop: "1px solid var(--border)",
        padding: "14px 20px",
        display: "flex",
        alignItems: "flex-end",
        gap: 12,
      }}
    >
      <textarea
        ref={textareaRef}
        value={input}
        onChange={(e) => {
          setInput(e.target.value);
          adjustHeight();
        }}
        onKeyDown={handleKeyDown}
        placeholder="Message Aria..."
        rows={1}
        disabled={isLoading}
        style={{
          flex: 1,
          resize: "none",
          background: "var(--surface-2)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-md)",
          padding: "12px 16px",
          fontSize: "var(--text-base)",
          color: "var(--text-primary)",
          outline: "none",
          lineHeight: 1.5,
          maxHeight: 120,
          overflow: "auto",
          transition: "border-color 150ms ease",
          fontFamily: "inherit",
        }}
        onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
        onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
      />

      <button
        onClick={handleSend}
        disabled={!hasText || isLoading}
        style={{
          width: 40,
          height: 40,
          borderRadius: "var(--radius-sm)",
          background: hasText ? "var(--accent)" : "var(--surface-3)",
          border: "none",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: hasText ? "pointer" : "default",
          transition: "background 150ms ease",
          flexShrink: 0,
        }}
      >
        <ArrowUp size={18} color={hasText ? "#ffffff" : "var(--text-tertiary)"} />
      </button>
    </div>
  );
}
