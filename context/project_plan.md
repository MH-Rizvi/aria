# Project Plan — Aria AI Work Assistant
## Phased Task Breakdown

**Version:** 1.0
**Date:** March 2026
**Status:** Phase 0 Complete

---

## Build Philosophy
Ship infrastructure and auth first — establishing absolute database
and session stability before touching UI. Then build the chat interface,
connect real AI, layer in Gmail and Calendar tool calling, and wrap
everything in a production-grade LLMOps dashboard. Every phase must
be fully verified before moving to the next.

---

## Phase 0 — Project Setup ✅
*Goal: Next.js project scaffolded, GitHub connected, all context files written.*

- [x] **T001** — Scaffold Next.js 14 project with TypeScript, Tailwind, App Router
- [x] **T002** — Create GitHub repo, connect local, push to main
- [x] **T003** — Create dev branch, set as active working branch
- [x] **T004** — Write CLAUDE.md
- [x] **T005** — Write context/prd.md
- [x] **T006** — Write context/techstack.md
- [x] **T007** — Write context/design.md
- [x] **T008** — Write context/project_plan.md
- [x] **T009** — Write memory-bank/progress.md
- [x] **T010** — Update .gitignore

---

## Phase 1 — Infrastructure ✅
*Goal: Auth works, database works, user signs in with Google and gets
saved to Supabase. Nothing else. No UI beyond a test page.*

- [x] **T011** — YOU: Create Supabase project at supabase.com
- [x] **T012** — YOU: Get DATABASE_URL and DIRECT_URL from Supabase
- [x] **T013** — YOU: Create Google Cloud project named "aria"
- [x] **T014** — YOU: Enable Gmail API in Google Cloud Console
- [x] **T015** — YOU: Enable Google Calendar API in Google Cloud Console
- [x] **T016** — YOU: Create OAuth 2.0 credentials (Web Application type)
- [x] **T017** — YOU: Add authorized redirect URI:
                http://localhost:3000/api/auth/callback/google
- [x] **T018** — YOU: Add test users in OAuth consent screen
- [x] **T019** — YOU: Generate NEXTAUTH_SECRET via: openssl rand -base64 32
- [x] **T020** — YOU: Create .env.local with all environment variables
- [x] **T021** — Install all dependencies:
                next-auth @auth/prisma-adapter ai @ai-sdk/groq
                prisma @prisma/client googleapis zustand
                recharts lucide-react @types/node
- [x] **T022** — Initialize Prisma via npx prisma init
- [x] **T023** — Write complete Prisma schema in prisma/schema.prisma
                Tables: User, Conversation, Message, AiLog, ModelRateLimit
                All tables include userId, inputTokens/outputTokens split on AiLog
- [x] **T024** — Create lib/prisma.ts Prisma client singleton
- [x] **T025** — Run npx prisma db push to create all tables in Supabase
- [x] **T026** — Create app/api/auth/[...nextauth]/route.ts
                Google provider with all OAuth scopes:
                openid, email, profile,
                gmail.readonly, gmail.compose,
                calendar.readonly, calendar.events
                Prisma adapter connected
                Access token and refresh token stored in session
- [x] **T027** — Update app/layout.tsx with SessionProvider wrapper
- [x] **T028** — Create minimal app/page.tsx that shows sign in button
- [x] **T029** — Verify sign in flow works end to end
- [x] **T030** — Verify user row created in Supabase users table on first sign in

---

## Phase 2 — Core Chat UI
*Goal: Beautiful chat interface visible and working. No AI yet.
User can type messages and see them displayed. Layout matches design.md.*

- [ ] **T031** — Set up global CSS variables in app/globals.css
                All colors, typography, spacing from design.md
- [ ] **T032** — Load Inter font via next/font/google in app/layout.tsx
- [ ] **T033** — Create store/useAriaStore.ts
                Fields: messages[], currentModelIndex, isLoading,
                user, gmailConnected, calendarConnected
- [ ] **T034** — Create app/auth/signin/page.tsx
                Full screen centered sign in page
                Aria logo, tagline, Google Sign In button
                Matches design.md sign in page spec
- [ ] **T035** — Create app/page.tsx as protected route
                Redirect to /auth/signin if not authenticated
                Two column layout: sidebar (260px) + chat area (flex-1)
- [ ] **T036** — Create components/sidebar/Sidebar.tsx
                Aria logo and name at top
                Gmail connection card (disconnected state)
                Calendar connection card (disconnected state)
                Active model indicator placeholder at bottom
                Dashboard link at bottom
- [ ] **T037** — Create components/chat/ChatWindow.tsx
                Chat header with user avatar and name
                Scrollable message list
                Empty state welcome message from Aria
- [ ] **T038** — Create components/chat/MessageBubble.tsx
                User bubble: right aligned, accent color (#7c3aed)
                Aria bubble: left aligned, surface color (#1a1a1a)
                Border radius: user 20px 20px 4px 20px,
                aria 20px 20px 20px 4px
                Timestamp visible on hover
                Fade in animation on appear (bubbleIn keyframe)
- [ ] **T039** — Create components/chat/ChatInput.tsx
                Textarea expanding as user types
                Max height 120px then scrolls
                Send button: accent when text present, disabled when empty
                Enter to send, Shift+Enter for new line
- [ ] **T040** — Create components/chat/TypingIndicator.tsx
                Three pulsing dots inside an Aria bubble
                Staggered animation: dot1 0ms, dot2 150ms, dot3 300ms
- [ ] **T041** — Wire ChatInput to Zustand store
                Sending message adds to messages[] instantly
                No AI response yet — just user messages displayed
- [ ] **T042** — Implement responsive layout
                Desktop: sidebar visible full width
                Tablet: sidebar icon-only mode
                Mobile: sidebar hidden, hamburger menu overlay

---

## Phase 3 — AI Chat Core
*Goal: User sends message, real AI responds via Groq with streaming.
Model rotation works. Messages persist in Supabase.*

- [ ] **T043** — Create lib/llm.ts with full model rotation logic
                Models array in priority order:
                llama-3.3-70b-versatile
                meta-llama/llama-4-maverick-17b-128e-instruct
                moonshotai/kimi-k2-instruct
                qwen/qwen3-32b
                llama-3.1-8b-instant
                On 429: read retry-after header, store reset timestamp
                in ModelRateLimit table, increment model index
                On each request: check reset timestamps, move back
                to earliest available model automatically
                Graceful error message when all models exhausted
- [ ] **T044** — Create lib/logging.ts
                Saves every AI call to AiLog table in Supabase
                Captures: userId, model, inputTokens, outputTokens,
                latency in ms, success boolean, error string
- [ ] **T045** — Create app/api/chat/route.ts
                POST endpoint accepting messages[] and userId
                Calls lib/llm.ts for model selection
                Uses Vercel AI SDK streamText()
                Streams response back to frontend
                Calls lib/logging.ts after every AI call
                Full try/catch with proper error responses
- [ ] **T046** — Connect ChatInput to /api/chat
                POST on send, stream response into Aria bubble
                Show TypingIndicator while waiting
                Handle errors gracefully in UI
- [ ] **T047** — Save messages to Supabase
                Every user message saved to messages table with userId
                Every AI response saved to messages table with userId
                Via conversationId foreign key
- [ ] **T048** — Load chat history on page mount
                Fetch last 50 messages from Supabase for current userId
                Hydrate Zustand messages[] on load
                Chat resumes after page refresh
- [ ] **T049** — Update active model indicator in sidebar
                Shows current model name from Zustand
                Green dot when healthy
                Yellow dot when approaching rate limit
                Red dot when rate limited
                Updates in real time when rotation happens

---

## Phase 4 — Gmail Integration
*Goal: Aria reads real Gmail inbox and creates drafts via tool calling.*

- [ ] **T050** — Create lib/gmail.ts
                getEmails(accessToken, maxResults) — fetch inbox
                getEmailById(accessToken, id) — fetch single email
                createDraft(accessToken, to, subject, body) — create draft
                Full TypeScript interfaces for all return types
- [ ] **T051** — Create tools/gmailTools.ts
                Vercel AI SDK tool() definitions
                getEmails tool with clear LLM description
                createDraft tool with clear LLM description
                Tools import execution logic from lib/gmail.ts
- [ ] **T052** — Update app/api/chat/route.ts
                Add Gmail tools to streamText() call
                Retrieve access token from NextAuth session server side
                Pass token to Gmail tools securely
                Never expose token to client
- [ ] **T053** — Create app/api/gmail/route.ts
                GET endpoint for direct email fetching
                Full try/catch error handling
- [ ] **T054** — Update sidebar Gmail connection card
                Show real connected state from NextAuth session
                Connected immediately after Google Sign In

---

## Phase 5 — Google Calendar Integration
*Goal: Aria reads and creates real calendar events via tool calling.*

- [ ] **T055** — Create lib/calendar.ts
                getEvents(accessToken, timeMin, timeMax) — fetch events
                createEvent(accessToken, event) — create new event
                checkConflicts(accessToken, start, end) — check availability
                Full TypeScript interfaces for all return types
- [ ] **T056** — Create tools/calendarTools.ts
                Vercel AI SDK tool() definitions
                getCalendarEvents tool with clear LLM description
                createCalendarEvent tool with clear LLM description
                checkConflicts tool with clear LLM description
                Tools import execution logic from lib/calendar.ts
- [ ] **T057** — Update app/api/chat/route.ts
                Add Calendar tools to streamText() call alongside Gmail tools
                Retrieve access token from NextAuth session server side
- [ ] **T058** — Create app/api/calendar/route.ts
                GET and POST endpoints for direct calendar operations
                Full try/catch error handling
- [ ] **T059** — Update sidebar Calendar connection card
                Show real connected state from NextAuth session

---

## Phase 6 — LLMOps Dashboard
*Goal: Admin only dashboard showing live AI observability data
pulled from Supabase AiLog and ModelRateLimit tables.*

- [ ] **T060** — Create middleware.ts
                Protect /dashboard route
                Check if logged in user email matches hardcoded admin email
                Redirect non-admin users to home page
- [ ] **T061** — Create app/api/dashboard/route.ts
                GET endpoint returning aggregated stats from Supabase:
                Total AI calls all time and today
                Average latency
                Success rate
                Model distribution percentages
                Token usage over time
                Rate limit status per model
                Recent 50 AI call logs
- [ ] **T062** — Create app/dashboard/page.tsx
                Admin only page
                Stats cards row: total calls, avg latency,
                success rate, total tokens
                Model distribution donut chart (Recharts)
                Token usage over time line chart (Recharts)
                Model rate limit status table with reset timers
                Recent AI calls log table with pagination
- [ ] **T063** — Create components/dashboard/StatsCard.tsx
                Large number display
                Label and trend indicator
                Matches design.md dashboard spec
- [ ] **T064** — Wire dashboard to real Supabase data
                Auto refreshes every 30 seconds
                Shows live data not mocked values

---

## Phase 7 — Polish + Deploy
*Goal: App is live on Vercel, looks professional, README is clean,
Loom video recorded. Ready to share.*

- [ ] **T065** — Audit entire UI against design.md
                Every color, spacing, animation verified
                No generic defaults left anywhere
- [ ] **T066** — Add loading skeleton screens
                Chat history loading skeleton
                Dashboard stats loading skeleton
                Never use spinners
- [ ] **T067** — Add error boundaries
                Graceful UI for API failures
                Inline error messages not alerts
- [ ] **T068** — Add Aria system prompt polish
                Aria introduces itself on first message
                Aria confirms actions before executing them
                Aria is concise, professional, helpful
- [ ] **T069** — YOU: Create Vercel project at vercel.com
                Connect GitHub repo
                Set all environment variables in Vercel dashboard
                Add production redirect URI to Google Cloud Console:
                https://yourdomain.vercel.app/api/auth/callback/google
- [ ] **T070** — YOU: Deploy to Vercel and verify live URL works
- [ ] **T071** — Write clean README.md
                Project description and motivation
                Live demo link
                Tech stack section
                Features list
                Setup instructions for local development
                .env.example with all variable names
- [ ] **T072** — Create .env.example file with empty values
- [ ] **T073** — Audit GitHub commit history
                Meaningful commit messages throughout
                No giant single commits
                Clean branch structure
- [ ] **T074** — YOU: Record Loom video walkthrough
                Show sign in flow
                Show Gmail reading and draft creation
                Show Calendar event creation
                Show model rotation in action
                Show LLMOps dashboard with real data
- [ ] **T075** — Add Loom video link to README.md

---
_END OF ROADMAP_