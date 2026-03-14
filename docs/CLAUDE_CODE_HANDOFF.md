# OpenClaw Platform — Claude Code Handoff Guide

## What You're Building
A full-scale AI operations platform called OpenClaw. It's a Next.js web app
with 10 modules, running on a single Windows machine with Docker.

## Reference Files (Read These First)

### 1. Architecture Document
**File:** `OpenClaw_Master_Plan_v3_FINAL.docx`
This is the master plan. It contains:
- Platform vision and all architectural decisions
- The 6-model stack (Claude Sonnet, Qwen, Gemini Nano Banana, Gemini Veo 3.1, edge-tts, FFmpeg)
- All 10 modules with detailed specs
- The content creation technique (3-phase: character → scene → video)
- Character consistency system
- Quality control and approval flow
- Database schema (22 tables)
- 8 build phases with deliverables
- Cost projections and security considerations

**Read the full document before writing any code.**

### 2. Design System
**File:** `DESIGN_SYSTEM.md`
The exact color palette, typography, component patterns, and layout rules.
Bobby specifically loved this design style. Do not deviate from it.
Key points:
- Warm cream background (#F8F7F4), not cold white
- DM Sans for text, JetBrains Mono for data/timestamps
- Clean, professional, editorial warmth
- No generic SaaS aesthetics

### 3. Dashboard Reference (Visual Style)
**File:** `openclaw-dashboard-v2.jsx`
A working React component showing the operator dashboard with:
- Sidebar navigation
- KPI cards with sparklines
- Agent fleet table
- Social media command center
- Content queue
- Model routing panel
- Chrome session monitor
- Activity log
- User management

This is the EXACT visual style Bobby wants. Match it precisely.

### 4. Creation Studio Reference (Pipeline Viewer)
**File:** `creation-studio.jsx`
A working React component showing the content creation pipeline:
- Left panel: pipeline steps (vertical flow, clickable cards)
- Center: detail view (input prompt, output preview, actions)
- Right sidebar: models, costs, archive info

This replaces ComfyUI. It's a built-in pipeline viewer where Bobby
sees every generation step with live previews.

## Tech Stack
- **Framework:** Next.js 14+ (App Router)
- **Styling:** Tailwind CSS + shadcn/ui
- **Database:** PostgreSQL (Docker)
- **Queue:** Redis + BullMQ (Docker)
- **Real-time:** Server-Sent Events (SSE) or Socket.io
- **APIs:** Anthropic (Claude), Google Gemini (Nano Banana + Veo 3.1)
- **Local tools:** edge-tts, FFmpeg
- **Browser automation:** Claude Code + Chrome Extension

## Build Order
Follow the 8 phases in the master plan document:
1. Foundation Shell (Next.js + Docker + DB + Navigation)
2. Agent Fleet + Live Feed
3. Creation Studio (the core pipeline)
4. Chat & Command Center (+ Telegram bot)
5. Social Media Automation
6. Tasks + Schedules
7. Model Routing + Observatory
8. Analytics + Polish

**Build each phase completely before moving to the next.**

## Key Design Decisions to Remember
- NO ComfyUI. All image/video generation through Gemini API.
- NO local GPU dependency for content creation.
- Character consistency via Gemini's reference image system, not LoRA/IP-Adapter.
- Human-in-the-loop approval before publishing (Tier 2 quality control).
- Telegram bot for remote control and content approval.
- Full content archive with audit trail for every generated asset.
- Multi-account support (multiple YouTube/IG/TikTok accounts per niche).

## Docker Compose (Minimal)
```yaml
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://openclaw:openclaw@db:5432/openclaw
      - REDIS_URL=redis://redis:6379
    depends_on:
      - db
      - redis

  db:
    image: postgres:16
    environment:
      POSTGRES_USER: openclaw
      POSTGRES_PASSWORD: openclaw
      POSTGRES_DB: openclaw
    volumes:
      - pgdata:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

volumes:
  pgdata:
```

## File Structure (Suggested)
```
openclaw/
├── docker-compose.yml
├── .env                          # API keys (never commit)
├── package.json
├── next.config.js
├── tailwind.config.js
├── prisma/
│   └── schema.prisma             # 22 tables
├── src/
│   ├── app/
│   │   ├── layout.tsx            # Root layout with sidebar
│   │   ├── page.tsx              # Overview dashboard
│   │   ├── studio/               # Creation Studio
│   │   ├── social/               # Social Media
│   │   ├── chat/                 # Chat & Commands
│   │   ├── agents/               # Agent Fleet
│   │   ├── tasks/                # Task Manager
│   │   ├── schedules/            # Scheduled Tasks
│   │   ├── archive/              # File & Content Archive
│   │   ├── browser/              # Browser Monitor
│   │   ├── routing/              # Model Routing + Observatory
│   │   ├── analytics/            # Analytics & Reporting
│   │   ├── settings/             # Settings + API Keys
│   │   └── api/                  # API routes
│   │       ├── agents/
│   │       ├── content/
│   │       ├── social/
│   │       ├── chat/
│   │       ├── tasks/
│   │       ├── schedules/
│   │       ├── browser/
│   │       ├── routing/
│   │       ├── analytics/
│   │       ├── activity/         # SSE stream
│   │       └── telegram/         # Webhook
│   ├── components/
│   │   ├── ui/                   # shadcn/ui components
│   │   ├── layout/               # Sidebar, Header
│   │   ├── dashboard/            # KPI cards, sparklines
│   │   ├── studio/               # Pipeline viewer components
│   │   ├── social/               # Platform cards, post queue
│   │   └── shared/               # Badges, status dots, progress bars
│   ├── lib/
│   │   ├── gemini/               # Nano Banana + Veo 3.1 clients
│   │   ├── claude/               # Claude API client
│   │   ├── qwen/                 # Ollama/Qwen client
│   │   ├── tts/                  # edge-tts wrapper
│   │   ├── ffmpeg/               # FFmpeg wrapper
│   │   ├── browser/              # Chrome automation helpers
│   │   ├── telegram/             # Telegram bot
│   │   ├── queue/                # BullMQ job definitions
│   │   ├── events/               # EventBus + SSE
│   │   └── db/                   # Prisma client + helpers
│   └── styles/
│       └── globals.css
├── content-archive/              # Generated assets (gitignored)
└── docs/
    ├── OpenClaw_Master_Plan_v3_FINAL.docx
    ├── DESIGN_SYSTEM.md
    └── CLAUDE_CODE_HANDOFF.md
```

## Important Notes for Claude Code
- Translate the inline React styles from the reference JSX files into
  Tailwind utility classes. The visual result must look identical.
- Use Prisma as the ORM for PostgreSQL.
- Use BullMQ with Redis for task queues and scheduled jobs.
- All real-time updates via SSE (Server-Sent Events) for simplicity.
- The content archive lives at /content-archive/ on the local filesystem.
- API keys go in .env and are accessed via process.env.
- Start Phase 1 by getting the Docker stack running and the dashboard
  shell rendering with working navigation. No data needed yet.
