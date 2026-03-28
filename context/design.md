# Design System — Aria AI Work Assistant

## Design Direction
Dark mode first. Clean. Minimal. Premium.
Confident, spacious, purposeful use of color.
Think: Linear.app meets iMessage meets a modern AI product.

Not: Colorful, busy, gradients everywhere, generic ChatGPT clone
Yes: Purposeful, alive, professional, fast feeling

---

## Color Palette

### Base Colors
```css
--background: #0a0a0a        /* main page background */
--surface-1: #111111         /* cards, sidebar */
--surface-2: #1a1a1a         /* input fields, hover states */
--surface-3: #222222         /* borders, dividers */
--border: rgba(255,255,255,0.08)  /* subtle borders everywhere */
```

### Text Colors
```css
--text-primary: #f5f5f5      /* main text */
--text-secondary: #a1a1aa    /* muted labels, timestamps */
--text-tertiary: #71717a     /* placeholder text, disabled */
```

### Accent Colors
```css
--accent: #7c3aed            /* primary interactive — electric violet */
--accent-hover: #6d28d9      /* accent hover state */
--accent-subtle: rgba(124,58,237,0.12)  /* accent backgrounds */
```

### Status Colors
```css
--success: #22c55e           /* connected, success states */
--warning: #f59e0b           /* rate limited, warning states */
--error: #ef4444             /* errors, disconnected states */
--success-subtle: rgba(34,197,94,0.12)
--warning-subtle: rgba(245,158,11,0.12)
--error-subtle: rgba(239,68,68,0.12)
```

### Chat Bubble Colors
```css
--bubble-user: #7c3aed       /* user messages — accent violet */
--bubble-user-text: #ffffff
--bubble-aria: #1a1a1a       /* Aria messages — surface color */
--bubble-aria-text: #f5f5f5
```

---

## Typography

### Font
- Primary: Inter (loaded via next/font/google)
- Monospace: JetBrains Mono (for code, token counts, model names)

### Scale
```css
--text-xs: 12px      /* timestamps, labels */
--text-sm: 14px      /* secondary text, sidebar items */
--text-base: 15px    /* body text, chat messages */
--text-lg: 17px      /* section headers */
--text-xl: 20px      /* page titles */
--text-2xl: 24px     /* dashboard stats */
```

### Weights
- Regular (400): body text, messages
- Medium (500): labels, sidebar items
- Semibold (600): headings, stat numbers
- Bold (700): logo, primary CTAs

---

## Spacing & Layout

### Page Layout
```
┌─────────────────────────────────────────┐
│  Sidebar (260px)  │  Main Content Area  │
│                   │                     │
│  fixed width      │  flex-1, fills rest │
│  full height      │  full height        │
└─────────────────────────────────────────┘
```

### Sidebar Structure
```
┌─────────────────┐
│  Aria Logo      │  24px padding
│  + name         │
├─────────────────┤
│  Gmail status   │  connection cards
│  Calendar status│
├─────────────────┤
│                 │  flex-1 empty space
│                 │
├─────────────────┤
│  Active model   │  bottom section
│  indicator      │
│  Dashboard link │
└─────────────────┘
```

### Chat Layout
```
┌─────────────────────────────┐
│  Chat header (user info)    │  56px height
├─────────────────────────────┤
│                             │
│  Message list               │  flex-1, scrollable
│  (bubbles)                  │
│                             │
├─────────────────────────────┤
│  Input bar                  │  72px height
└─────────────────────────────┘
```

### Border Radius
```css
--radius-sm: 8px     /* buttons, badges */
--radius-md: 12px    /* cards, input fields */
--radius-lg: 16px    /* sidebar, panels */
--radius-xl: 20px    /* chat bubbles */
--radius-full: 9999px /* pills, avatars */
```

---

## Components

### Chat Bubbles
User bubble (right aligned):
- Background: --accent (#7c3aed)
- Text: white
- Border radius: 20px 20px 4px 20px
- Max width: 70% of chat area
- Padding: 12px 16px
- Fade in from right on appear

Aria bubble (left aligned):
- Background: --surface-2 (#1a1a1a)
- Text: --text-primary
- Border: 1px solid --border
- Border radius: 20px 20px 20px 4px
- Max width: 70% of chat area
- Padding: 12px 16px
- Fade in from left on appear

Timestamp:
- Below each bubble
- --text-tertiary
- --text-xs
- Only show on hover

### Typing Indicator
- Three dots inside an Aria bubble
- Each dot pulses with a staggered animation
- Dot color: --accent
- Shows while AI is thinking

### Input Bar
- Background: --surface-1
- Border top: 1px solid --border
- Input field:
  - Background: --surface-2
  - Border: 1px solid --border
  - Border radius: --radius-md
  - Padding: 12px 16px
  - Placeholder: "Message Aria..."
  - Expands vertically as user types (textarea not input)
  - Max height: 120px then scrolls
- Send button:
  - Background: --accent when text present
  - Background: --surface-3 when empty (disabled state)
  - Icon: arrow up (lucide-react ArrowUp icon)
  - Border radius: --radius-sm
  - Smooth color transition

### Sidebar Connection Cards
Gmail card and Calendar card:
- Background: --surface-2
- Border: 1px solid --border
- Border radius: --radius-md
- Padding: 12px
- Left colored dot indicating status:
  - Green (--success) when connected
  - Red (--error) when disconnected
- Service name and status text
- Connect/Disconnect button (small, subtle)

### Active Model Indicator
- Bottom of sidebar
- Shows current model name in monospace font
- Small colored dot:
  - Green when model is healthy
  - Yellow when approaching rate limit
  - Red when rate limited
- Subtle pulse animation on the dot

### Dashboard Stats Cards
- Background: --surface-1
- Border: 1px solid --border
- Border radius: --radius-lg
- Padding: 24px
- Large number in --text-2xl semibold
- Label in --text-sm --text-secondary
- Small trend indicator (up/down arrow with percentage)

### Buttons
Primary:
- Background: --accent
- Text: white
- Border radius: --radius-sm
- Padding: 10px 20px
- Hover: --accent-hover
- Transition: all 150ms ease

Secondary:
- Background: transparent
- Border: 1px solid --border
- Text: --text-secondary
- Hover: background --surface-2

Danger:
- Background: --error-subtle
- Text: --error
- Border: 1px solid --error (at 30% opacity)

---

## Animations

### Principles
- Fast: 150ms for micro interactions (hover, focus)
- Medium: 250ms for component transitions (sidebar, modals)
- Slow: 400ms for page transitions
- Easing: ease-out for entrances, ease-in for exits
- Never animate things that don't need it
- Motion should feel responsive not decorative

### Specific Animations

Message bubble appear:
```css
@keyframes bubbleIn {
  from {
    opacity: 0;
    transform: translateY(8px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
duration: 200ms ease-out
```

Typing indicator dots:
```css
@keyframes pulse {
  0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
  30% { transform: translateY(-4px); opacity: 1; }
}
stagger: dot1 0ms, dot2 150ms, dot3 300ms
duration: 900ms infinite
```

Sidebar connection status dot:
```css
@keyframes statusPulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}
duration: 2000ms infinite
only plays when model is rate limited (warning state)
```

Page load:
- Sidebar slides in from left (translateX(-20px) → 0)
- Chat area fades in (opacity 0 → 1)
- Duration: 300ms ease-out
- Staggered: sidebar first, chat 100ms later

---

## Icons
- Library: lucide-react (already in package list)
- Size: 16px for inline, 20px for sidebar, 24px for headers
- Color: inherit from parent text color
- Key icons used:
  - Mail — Gmail
  - Calendar — Google Calendar
  - Send / ArrowUp — send message
  - Bot — Aria avatar
  - User — user avatar
  - BarChart2 — dashboard link
  - Zap — model indicator
  - CheckCircle — success states
  - AlertCircle — error states
  - Clock — rate limit timer

---

## Aria Avatar
- Small circular avatar next to Aria's chat bubbles
- Background: --accent-subtle
- Icon: Bot (lucide-react) in --accent color
- Size: 32px circle
- Never use a photo — keep it abstract and AI feeling

## User Avatar
- Small circular avatar next to user's chat bubbles
- Show Google profile photo from OAuth session
- Fallback: first letter of user's name on --surface-3 background
- Size: 32px circle

---

## Sign In Page
- Full screen centered layout
- Background: --background
- Card in center:
  - Background: --surface-1
  - Border: 1px solid --border
  - Border radius: --radius-lg
  - Padding: 48px
  - Max width: 400px
- Aria logo + name at top
- Tagline: "Your AI work assistant"
- Google Sign In button (standard Google button styling)
- Subtle footer text: "By signing in you connect Gmail and Google Calendar"

---

## Dashboard Page
- Same sidebar as chat page
- Main area:
  - Page title: "LLMOps Dashboard"
  - Stats cards row (4 cards): total calls, avg latency, success rate, tokens used
  - Two charts side by side:
    - Model distribution (pie/donut chart)
    - Token usage over time (line chart)
  - Model rate limit status table
  - Recent AI calls log table

---

## Responsive Behavior
- Desktop (1024px+): sidebar visible, full layout
- Tablet (768px-1024px): sidebar collapses to icon-only mode
- Mobile (below 768px): sidebar hidden, hamburger menu to open as overlay
- Chat bubbles max-width adjusts per breakpoint:
  - Desktop: 70%
  - Tablet: 80%
  - Mobile: 85%

---

## Do Not
- No light mode (dark only for this project)
- No gradients on backgrounds (subtle gradients on buttons only)
- No shadows (use borders instead — cleaner on dark backgrounds)
- No Comic Sans, no system fonts — Inter only
- No full width buttons everywhere — respect whitespace
- No loading spinners — use skeleton screens instead
- No alert() or confirm() — use inline UI feedback
- No generic blue (#3b82f6) as accent — use the violet (#7c3aed)