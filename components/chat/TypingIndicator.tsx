"use client";

export default function TypingIndicator() {
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 10, animation: "bubbleIn 200ms ease-out" }}>
      {/* Aria avatar */}
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
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 8V4H8" /><rect width="16" height="12" x="4" y="8" rx="2" /><path d="M2 14h2" /><path d="M20 14h2" /><path d="M15 13v2" /><path d="M9 13v2" />
        </svg>
      </div>

      {/* Bubble with dots */}
      <div
        style={{
          background: "var(--bubble-aria)",
          border: "1px solid var(--border)",
          borderRadius: "20px 20px 20px 4px",
          padding: "14px 18px",
          display: "flex",
          alignItems: "center",
          gap: 5,
        }}
      >
        {[0, 150, 300].map((delay) => (
          <div
            key={delay}
            style={{
              width: 7,
              height: 7,
              borderRadius: "var(--radius-full)",
              background: "var(--accent)",
              animation: `pulse 900ms infinite ${delay}ms`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
