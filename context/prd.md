# PRD — Aria AI Work Assistant

## What Is Aria
Aria is a personal AI work assistant that lives in the browser.
Users interact with Aria through a clean iMessage-style chat interface.
Aria can read emails, draft replies, manage calendar events, and handle
proactive work tasks — all through natural conversation.

This is a portfolio showcase project built to demonstrate full-stack
TypeScript engineering, real-world OAuth integrations, agentic AI with
tool calling, and production-grade LLMOps observability.

---

## Target User
A professional who wants to manage their email and calendar through
a conversational AI interface without switching between multiple apps.

Primary users are professionals who want to manage email and calendar
through conversational AI. For launch, app runs in Google test mode —
specific emails whitelisted via Google Cloud Console. Any whitelisted
user can sign in with their real Google account and use Aria with
their own data.

---

## Core Features

### Feature 1: AI Chat Interface
The heart of the app. Everything happens through a single chat window.

User experience:
- Clean iMessage-style bubbles (user on right, Aria on left)
- Aria's messages stream in word by word (not all at once)
- Input bar at the bottom with send button
- Aria shows a typing indicator while thinking
- Chat history persists across page refreshes
- Mobile responsive

What the user can type:
- "What emails do I need to reply to today?"
- "Schedule a meeting with John on Thursday at 3pm"
- "Draft a reply to Sarah's email saying I'll be late"
- "Do I have any conflicts this week?"
- "Summarize my last 5 emails"

---

### Feature 2: Gmail Integration
Aria connects to the user's real Gmail account via Google OAuth.

What it does:
- Reads emails from the user's inbox
- Understands email content and context
- Drafts replies and saves them to Gmail drafts folder
- Never sends emails directly — always creates a draft for user review

OAuth scope used:
- gmail.readonly — to read emails
- gmail.compose — to create drafts only (not gmail.send)

User flow:
1. User clicks "Connect Gmail" button in sidebar
2. Google OAuth screen opens
3. User grants permission
4. Aria can now read inbox and create drafts
5. Connection status shows in sidebar

Example interactions:
- "What are my unread emails?"
- "Draft a reply to John's meeting request saying Tuesday works"
- "Summarize the email from my manager"

---

### Feature 3: Google Calendar Integration
Aria connects to the user's real Google Calendar via the same OAuth flow.

What it does:
- Reads upcoming events
- Creates new events
- Checks for scheduling conflicts
- Suggests available time slots

OAuth scope used:
- calendar.readonly — to read events
- calendar.events — to create and modify events

Example interactions:
- "What's on my calendar this week?"
- "Schedule a coffee chat with Sarah next Tuesday at 2pm"
- "Do I have anything on Friday afternoon?"
- "Move my 3pm meeting to 4pm"

---

### Feature 4: Agentic Tool Calling
Aria doesn't just answer questions — it takes actions.

How it works:
- User sends a message
- LLM reads the message and decides which tool to call
- Tool executes (Gmail API or Calendar API)
- Result returns to LLM
- LLM responds naturally to user in chat

Tools available to the LLM:
- getEmails — fetch emails from Gmail inbox
- createDraft — create a draft reply in Gmail
- getCalendarEvents — fetch upcoming calendar events
- createCalendarEvent — create a new calendar event
- checkConflicts — check for scheduling conflicts

agentic pattern built and implemented in TypeScript using Vercel AI SDK.

---

### Feature 5: Model Rotation (LLM Layer)
Aria uses a single Groq API key with multiple models in rotation.

Model priority order:
1. llama-3.3-70b-versatile (primary)
2. meta-llama/llama-4-maverick-17b-128e-instruct
3. moonshotai/kimi-k2-instruct
4. qwen/qwen3-32b
5. llama-3.1-8b-instant (last resort)

Rotation rules:
- Start every session on the current active model (not always model[0])
- On 429 rate limit error → move to next model
- Read retry-after header from Groq response
- Store reset timestamp per model in Supabase
- When reset time passes → move back to earliest available model
- All 5 models rate limited → show user a friendly error message
- Current active model index persisted in Zustand

---

### Feature 6: LLMOps Dashboard
A separate page at /dashboard showing live AI observability data.

What it shows:
- Current active model
- Which models are rate limited and their reset times
- Total AI calls made (all time and today)
- Average response latency (ms)
- Model distribution chart (what % each model has been used)
- Token usage over time (input tokens and output tokens tracked separately)
- Success vs failure rate
- A log of recent AI calls with model, tokens, latency, timestamp

This data comes from the ai_logs and model_rate_limits tables in Supabase.
Charts built with Recharts.

---

## Pages

### / (Home — Chat Interface)
- Full screen chat window
- Sidebar on left showing:
  - Aria logo and name
  - Gmail connection status (connected/disconnected)
  - Calendar connection status (connected/disconnected)
  - Connect buttons for each
  - Current active AI model indicator
- Chat window taking up remaining space
- Message input bar at bottom

### /dashboard (LLMOps Dashboard)
- Header with Aria logo
- Stats cards (total calls, avg latency, success rate)
- Model distribution chart
- Rate limit status per model
- Recent AI calls log table

---

## User Flows

### Authentication Flow
1. User visits Aria
2. Clicks "Sign in with Google"
3. Google OAuth handles sign in AND connects Gmail + Calendar in one flow
4. Account created automatically in Supabase
5. User lands on chat interface with Gmail and Calendar already connected
6. All their data is scoped to their account only

### Returning User
1. Opens Aria
2. On page load — immediately fetch last 50 messages from Supabase for this userId and hydrate Zustand
3. Gmail and Calendar already connected via stored tokens
4. Continues conversation where they left off

NOTE FOR AGENT: Implement conversation hydration on page load in the
very first session. Do not leave this for later. Pattern is:
page loads → fetch messages from Supabase by userId → populate Zustand → render chat

### Rate Limit Hit During Conversation
1. User sends message
2. Current model hits rate limit
3. Aria silently switches to next model
4. Response comes back normally
5. Dashboard shows the model switch in logs
6. User never sees an interruption

---

## In Scope (Building This)
- Multi-user support via Google Sign In
- Each user sees only their own emails, calendar, and chat history
- All user data scoped to their account in Supabase
- Dashboard restricted to admin account only (your email hardcoded as admin)

## Out of Scope (Not Building)
- Real email sending (drafts only via gmail.compose)
- Google app verification (test mode only)
- Mobile app (browser only, mobile responsive)
- Payment or subscription features
- Multiple conversation threads per user

---

## Success Criteria
- App is live on Vercel with a public URL
- Gmail OAuth works end to end
- Calendar OAuth works end to end
- AI can read emails and create drafts via tool calling
- AI can read and create calendar events via tool calling
- Model rotation works and is logged
- LLMOps dashboard shows real data
- Chat history persists on refresh
- Clean GitHub repo with good commit history
- README with live demo link and Loom video walkthrough

## Critical Implementation Rules

### userId Filter — Never Skip This
Every database table that stores user data must have a userId column.
Every database query must filter by userId.
No exceptions.

Tables that need userId:
- conversations (userId)
- messages (userId via conversationId)
- ai_logs (userId)

If a query is missing a userId filter, one user will see another
user's data. This is a critical bug. Agent must add userId to every
table schema and every Prisma query from day one, not as an afterthought.