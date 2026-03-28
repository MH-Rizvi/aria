# CLAUDE.md — Aria AI Work Assistant

## What Is This Project
Aria is a personal AI work assistant built as a portfolio showcase project.
It is a full-stack TypeScript application built with Next.js 14+ App Router.
It handles email drafting and calendar management through a clean iMessage-style
chat interface powered by agentic LLM tool calling.

This project is built to demonstrate full-stack TypeScript engineering,
real-world OAuth integrations, agentic AI with tool calling, and
production-grade LLMOps observability.

---

## Agent Instructions

You are an expert full-stack TypeScript engineer helping build Aria.

Before doing anything in a new session:
1. Read this file fully
2. Read context/prd.md
3. Read context/techstack.md
4. Read memory-bank/progress.md

Do not assume anything. Read the files first.

---

## Core Rules — Never Break These

- Always use TypeScript. Never write plain JavaScript.
- Always use the App Router pattern. Never use the pages/ directory.
- Never use Python. This is a TypeScript/Node.js project exclusively.
- Never install LangChain. Use Vercel AI SDK for all AI functionality.
- Never use localStorage for persistence. Use Supabase via Prisma.
- Never send emails directly. Use gmail.compose scope to create drafts only.
- Always handle errors. Every API route must have try/catch with proper
  error responses.
- Always log every AI call to the ai_logs table in Supabase via the
  logging middleware.
- Never reset model rotation on each new message. Persist the current
  active model index in Zustand and rotation state in Supabase.
- Never create a pages/ directory under any circumstance. App Router only.
- Never attempt YOU tasks from project_plan.md — these require 
  manual browser actions and real credentials that only the 
  developer can provide.

---

## Project Structure
```
aria/
├── CLAUDE.md
├── .gitignore
├── .env.local                  (never commit this)
├── .env.example                (commit this, no real values)
├── context/
│   ├── prd.md
│   └── techstack.md
├── memory-bank/
│   └── progress.md
├── prisma/
│   └── schema.prisma
├── app/
│   ├── layout.tsx
│   ├── page.tsx                (main chat interface)
│   ├── dashboard/
│   │   └── page.tsx            (LLMOps dashboard)
│   └── api/
│       ├── auth/
│       │   └── [...nextauth]/
│       │       └── route.ts    (NextAuth OAuth handler)
│       ├── chat/
│       │   └── route.ts        (main AI chat endpoint)
│       ├── gmail/
│       │   └── route.ts        (Gmail API operations)
│       └── calendar/
│           └── route.ts        (Google Calendar API operations)
├── components/
│   ├── chat/
│   │   ├── ChatWindow.tsx
│   │   ├── MessageBubble.tsx
│   │   └── ChatInput.tsx
│   ├── sidebar/
│   │   └── Sidebar.tsx
│   └── dashboard/
│       └── StatsCard.tsx
├── lib/
│   ├── llm.ts                  (model rotation logic)
│   ├── gmail.ts                (Gmail API helper functions)
│   ├── calendar.ts             (Google Calendar helper functions)
│   ├── logging.ts              (LLMOps middleware)
│   └── prisma.ts               (Prisma client singleton)
├── store/
│   └── useAriaStore.ts         (Zustand global state)
└── tools/
    ├── gmailTools.ts           (Vercel AI SDK tool definitions for Gmail)
    └── calendarTools.ts        (Vercel AI SDK tool definitions for Calendar)
```

---

## Environment Variables Needed
```
# AI
GROQ_API_KEY=

# Google OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# NextAuth
NEXTAUTH_SECRET=
NEXTAUTH_URL=

# Supabase
DATABASE_URL=
DIRECT_URL=
```

---

## How The AI Layer Works

### Model Rotation (lib/llm.ts)
Models are tried in this exact order:
1. llama-3.3-70b-versatile (primary)
2. meta-llama/llama-4-maverick-17b-128e-instruct
3. moonshotai/kimi-k2-instruct
4. qwen/qwen3-32b
5. llama-3.1-8b-instant (last resort)

All models use a single GROQ_API_KEY.

Rotation rules:
- On 429 rate limit error → move to next model in list
- Stay on current model until it hits rate limit (do not reset per message)
- Read retry-after header from Groq's 429 response to get exact reset timestamp
- Store reset timestamp per model in Supabase (model_rate_limits table)
- At start of every request: check if any earlier model's reset time has
  passed → if yes, move back to that model
- If all 5 models are rate limited → return graceful error to user:
  "Aria is taking a breather, please try again shortly"
- Current active model index stored in Zustand for fast access

### How Tool Calling Works
- Tools defined in tools/gmailTools.ts and tools/calendarTools.ts
- Vercel AI SDK handles tool calling via generateText() or streamText()
- LLM decides which tool to call based on user message
- Tool executes → result returns to LLM → LLM responds to user
- This is a ReAct agentic pattern implemented in TypeScript using Vercel AI SDK

### How OAuth Works
- NextAuth.js handles entire Google OAuth flow
- Scopes: gmail.compose, gmail.readonly, calendar.events, calendar.readonly
- Tokens stored securely via NextAuth, accessible server-side in API routes
- App stays in Google test mode — add specific emails in Google Cloud Console

### How Persistence Works
- Zustand: in-memory state for fast UI updates + current model index
- Supabase via Prisma: persistence across sessions
- On page load → fetch conversation history from Supabase → populate Zustand
- On new message → update Zustand instantly + save to Supabase in background

---

## Database Tables

- conversations — stores each chat session
- messages — stores every message (role, content, timestamp)
- ai_logs — stores every AI call (model used, tokens, latency, success/fail)
- model_rate_limits — stores rate limit reset timestamps per model

---

## Key Commands
```bash
pnpm dev           # start development server
pnpm build         # build for production
pnpm lint          # run linter
npx prisma studio  # open database GUI
npx prisma db push # push schema changes to Supabase
```

---

## After Every Session

Update memory-bank/progress.md with:
- What was completed this session
- What is broken or incomplete
- What the next session should tackle first