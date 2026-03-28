import { signIn } from "@/app/api/auth/[...nextauth]/route";
import { Bot } from "lucide-react";

export default function SignInPage() {
  return (
    <main
      className="flex items-center justify-center min-h-screen"
      style={{
        background: "var(--background)",
        animation: "fadeIn 300ms ease-out",
      }}
    >
      <div
        style={{
          maxWidth: 400,
          width: "100%",
          background: "var(--surface-1)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-lg)",
          padding: 48,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 24,
        }}
      >
        {/* Aria Logo */}
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: "var(--radius-full)",
            background: "var(--accent-subtle)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Bot size={32} color="var(--accent)" />
        </div>

        {/* App Name */}
        <h1
          style={{
            fontSize: "var(--text-2xl)",
            fontWeight: 600,
            color: "var(--text-primary)",
            margin: 0,
          }}
        >
          Aria
        </h1>

        {/* Tagline */}
        <p
          style={{
            fontSize: "var(--text-base)",
            color: "var(--text-secondary)",
            margin: 0,
          }}
        >
          Your AI work assistant
        </p>

        {/* Google Sign In Button */}
        <form
          action={async () => {
            "use server";
            await signIn("google", { redirectTo: "/" });
          }}
          style={{ width: "100%" }}
        >
          <button
            type="submit"
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 12,
              padding: "12px 20px",
              background: "var(--accent)",
              color: "#ffffff",
              border: "none",
              borderRadius: "var(--radius-sm)",
              fontSize: "var(--text-base)",
              fontWeight: 500,
              cursor: "pointer",
              transition: "background 150ms ease",
            }}
            onMouseOver={undefined}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path
                d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
                fill="#4285F4"
              />
              <path
                d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z"
                fill="#34A853"
              />
              <path
                d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.997 8.997 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"
                fill="#FBBC05"
              />
              <path
                d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
                fill="#EA4335"
              />
            </svg>
            Sign in with Google
          </button>
        </form>

        {/* Footer Text */}
        <p
          style={{
            fontSize: "var(--text-xs)",
            color: "var(--text-tertiary)",
            textAlign: "center",
            margin: 0,
            lineHeight: 1.5,
          }}
        >
          By signing in you connect Gmail and Google Calendar
        </p>
      </div>
    </main>
  );
}
