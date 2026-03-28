# Tech Stack — Aria AI Work Assistant

## Overview
Aria is a full-stack TypeScript application. Every layer of the stack
uses TypeScript. There is no Python anywhere in this project.

---

## Frontend

### Next.js 14+ (App Router)
- Main framework for the entire application
- Both frontend and backend live in the same Next.js project
- Use App Router exclusively — never use pages/ directory
- File based routing: app/page.tsx, app/dashboard/page.tsx etc
- Server components by default, client components only when needed
- Why: Industry standard for modern React apps, used by companies
  like Lindy, Vercel, and most modern startups

### React 18
- UI component library built into Next.js
- Every UI element is a React component written in TypeScript
- Use functional components only, never class components
- Use hooks for state and side effects (useState, useEffect, useCallback)
- Why: The most widely used frontend library in the industry

### TypeScript
- Used everywhere without exception
- Every variable, function parameter, and return type must be typed
- Never use `any` type — always define proper interfaces and types
- Create a types/ folder for shared type definitions
- Why: Lindy's entire codebase is TypeScript, shows production thinking

### Tailwind CSS
- Utility-first CSS framework
- Write styles directly in className attributes
- No separate CSS files except globals.css
- Use Tailwind's dark mode utilities (dark: prefix)
- Why: Fastest way to build clean, consistent UI in Next.js

### Zustand
- Lightweight global state management
- Single store file: store/useAriaStore.ts
- Stores in memory:
  - messages[] — current conversation messages
  - currentModelIndex — active model in rotation
  - isLoading — whether AI is thinking
  - user — current logged in user
  - gmailConnected — boolean
  - calendarConnected — boolean
- Never store sensitive data like tokens in Zustand
- Tokens always stay server-side in NextAuth session
- Why: Simpler than Redux, perfect for this scale, you already know it

### Recharts
- React chart library for the LLMOps dashboard
- Used for: model distribution pie chart, token usage over time line chart
- Why: Lightest React chart library, clean output, easy TypeScript integration

---

## Backend

### Next.js API Routes
- Backend endpoints live inside the same Next.js project
- Located in app/api/ directory
- Each route is a route.ts file with exported GET/POST functions
- All routes are TypeScript
- All routes must have try/catch error handling
- Routes:
  - app/api/auth/[...nextauth]/route.ts — NextAuth OAuth handler
  - app/api/chat/route.ts — main AI chat endpoint
  - app/api/gmail/route.ts — Gmail API operations
  - app/api/calendar/route.ts — Google Calendar API operations
  - app/api/dashboard/route.ts — LLMOps data for dashboard

### Node.js
- Next.js API routes run on Node.js runtime
- Use Node.js built-in modules where needed
- Why: Explicitly listed in Lindy's job description

---

## Authentication

### NextAuth.js (Auth.js v5)
- Handles entire Google OAuth flow
- Single Google Sign In connects everything in one shot:
  - Signs user in
  - Connects Gmail
  - Connects Calendar
- Stores and refreshes OAuth tokens automatically
- Tokens accessible server-side in API routes via getServerSession()
- Never expose tokens to the client/browser
- Config file: app/api/auth/[...nextauth]/route.ts
- Google OAuth scopes requested:
  - openid — basic sign in
  - email — get user email
  - profile — get user name and photo
  - https://www.googleapis.com/auth/gmail.readonly — read emails
  - https://www.googleapis.com/auth/gmail.compose — create drafts
  - https://www.googleapis.com/auth/calendar.readonly — read events
  - https://www.googleapis.com/auth/calendar.events — create/modify events
- Why: Industry standard auth for Next.js, handles token refresh automatically

---

## AI Layer

### Vercel AI SDK
- Core AI library for this project
- Replaces LangChain — do not install LangChain
- Handles: tool calling, streaming responses, model switching
- Key functions used:
  - streamText() — for streaming chat responses word by word
  - generateText() — for non-streaming AI calls
  - tool() — for defining agentic tools
- All AI calls go through lib/llm.ts which wraps Vercel AI SDK
- Why: Built specifically for Next.js, best TypeScript support,
  industry standard for AI apps in this stack

### Groq API
- Single API key, multiple models in rotation
- All models accessed via Vercel AI SDK's Groq provider
- Install: @ai-sdk/groq

### Model Rotation (lib/llm.ts)
Models tried in this exact order:
1. llama-3.3-70b-versatile — primary, most capable
2. meta-llama/llama-4-maverick-17b-128e-instruct — second
3. moonshotai/kimi-k2-instruct — third
4. qwen/qwen3-32b — fourth
5. llama-3.1-8b-instant — last resort, lightest

Rotation logic:
- Current active model index stored in Zustand
- On 429 rate limit error from Groq:
  - Read retry-after header for exact reset timestamp
  - Store reset timestamp in model_rate_limits table in Supabase
  - Increment model index → try next model
- On every request start:
  - Check model_rate_limits table for each earlier model
  - If reset timestamp has passed → move back to that model
- If all 5 models rate limited → return friendly error to user
- Never reset to model[0] on each new message
- Persist current index across messages until rate limit resets

### Agentic Tool Calling
- Tools defined using Vercel AI SDK's tool() function
- Located in tools/gmailTools.ts and tools/calendarTools.ts
- LLM decides which tool to call based on user message
- Tool executes → result returns to LLM → LLM responds to user
- ReAct agentic pattern implemented in TypeScript

Gmail tools:
- getEmails — fetches emails from Gmail inbox
- createDraft — creates a draft reply in Gmail drafts folder

Calendar tools:
- getCalendarEvents — fetches upcoming events
- createCalendarEvent — creates a new event
- checkConflicts — checks for scheduling conflicts at a given time

---

## Database

### Supabase
- Hosted PostgreSQL database
- Free tier: 500MB storage, more than enough
- Used for: user data, chat history, AI logs, rate limit tracking
- Connection string stored in DATABASE_URL environment variable
- Why: Generous free tier, production grade PostgreSQL,
  excellent TypeScript support via Prisma

### Prisma ORM
- Sits between TypeScript code and Supabase
- Type-safe database queries — no raw SQL
- Schema defined in prisma/schema.prisma
- Single client instance in lib/prisma.ts
- Key commands:
  - npx prisma db push — push schema to Supabase
  - npx prisma studio — visual database browser
  - npx prisma generate — regenerate TypeScript types after schema change

Database schema:
```prisma
model User {
  id            String         @id @default(cuid())
  email         String         @unique
  name          String?
  image         String?
  createdAt     DateTime       @default(now())
  conversations Conversation[]
  aiLogs        AiLog[]
}

model Conversation {
  id        String    @id @default(cuid())
  userId    String
  user      User      @relation(fields: [userId], references: [id])
  messages  Message[]
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
}

model Message {
  id             String       @id @default(cuid())
  conversationId String
  conversation   Conversation @relation(fields: [conversationId], references: [id])
  role           String       // "user" or "assistant"
  content        String
  createdAt      DateTime     @default(now())
}

model AiLog {
  id           String   @id @default(cuid())
  userId       String
  user         User     @relation(fields: [userId], references: [id])
  model        String
  inputTokens  Int
  outputTokens Int
  latency      Int      // milliseconds
  success      Boolean
  error        String?
  createdAt    DateTime @default(now())
}

model ModelRateLimit {
  id         String   @id @default(cuid())
  modelId    String   @unique
  resetAt    DateTime
  updatedAt  DateTime @updatedAt
}
```

---

## External APIs

### Gmail API
- Package: googleapis (npm)
- Used in: lib/gmail.ts and tools/gmailTools.ts
- Operations: list emails, get email by id, create draft
- Tokens accessed server-side via NextAuth session
- Never call Gmail API from the browser

### Google Calendar API
- Package: googleapis (same package as Gmail)
- Used in: lib/calendar.ts and tools/calendarTools.ts
- Operations: list events, create event, check conflicts
- Tokens accessed server-side via NextAuth session
- Never call Calendar API from the browser

---

## Deployment

### Vercel
- Hosting platform for the Next.js app
- Connect GitHub repo → auto deploys on every push to main
- Environment variables set in Vercel dashboard
- Free hobby tier is sufficient
- Live URL shared with contact and in README

### GitHub
- Version control
- Two branches:
  - main — production, only merge when feature is complete and tested
  - dev — active development branch, all work happens here
- Commit often with meaningful messages:
  - feat: add Gmail OAuth integration
  - fix: handle rate limit on model rotation
  - chore: update environment variables
- Clean README with live demo link and Loom video

---

## Package List

Core:
- next — framework
- react, react-dom — UI
- typescript — language
- tailwindcss — styling
- zustand — state management

Auth:
- next-auth — Google OAuth
- @auth/prisma-adapter — connects NextAuth to Prisma

AI:
- ai — Vercel AI SDK core
- @ai-sdk/groq — Groq provider for Vercel AI SDK

Database:
- prisma — ORM
- @prisma/client — Prisma client

Google APIs:
- googleapis — Gmail and Calendar API client

UI:
- recharts — charts for dashboard
- lucide-react — icons

---

## Environment Variables
```
# Groq
GROQ_API_KEY=

# Google OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# NextAuth
NEXTAUTH_SECRET=
NEXTAUTH_URL=http://localhost:3000

# Supabase
DATABASE_URL=
DIRECT_URL=
```

---

## What Not To Use
- LangChain — use Vercel AI SDK instead
- Python — this is TypeScript only
- localStorage — use Supabase via Prisma
- pages/ directory — use App Router only
- gmail.send scope — use gmail.compose only
- any type in TypeScript — always define proper types
- Redux — use Zustand instead
- Express — use Next.js API routes instead