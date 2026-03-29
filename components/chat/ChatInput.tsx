"use client";

import { ArrowUp } from "lucide-react";
import { useRef, useCallback, KeyboardEvent, useEffect } from "react";

interface ChatInputProps {
  input: string;
  setInput: (value: string) => void;
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  isLoading: boolean;
}

export default function ChatInput({ input, setInput, handleSubmit, isLoading }: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = Math.min(textarea.scrollHeight, 120) + "px";
    }
  }, []);

  useEffect(() => {
    adjustHeight();
  }, [input, adjustHeight]);

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if ((input ?? "").trim() && !isLoading) {
        handleSubmit(e as any);
      }
    }
  };

  const hasText = (input ?? "").trim().length > 0;

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
      <form
        onSubmit={handleSubmit}
        style={{ display: "flex", width: "100%", alignItems: "flex-end", gap: 12 }}
      >
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
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
          type="submit"
          disabled={!hasText || isLoading}
          style={{
            zIndex: 100,
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
      </form>
    </div>
  );
}
