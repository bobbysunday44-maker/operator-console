# OpenClaw — Project State

**Last updated:** 2026-03-18
**Last session:** March 18, 2026 (audit bugfixes + desktop launcher)
**Git:** Uncommitted changes — audit bugfixes + desktop launcher files
**Dev server:** port 3001 (Next.js) + port 17500 (Qwen3-TTS voice server)
**Docker:** openclaw-db (PostgreSQL 16, port 5433), openclaw-redis (Redis 7, port 6380)
**Desktop app:** `launch.py` + `start.bat` + `launcher-venv/` (pywebview, Python 3.10) — shortcut on Desktop

---

## Current Status: CORE BUILT — 8 FEATURES STILL UNBUILT

### What's DONE and committed:
- 43 database tables, 90+ API endpoints, 20 dashboard pages, 11 background workers
- Qwen3-TTS 1.7B voice server (tested working, own venv at voice/.venv/)
- Visual workflow editor (ReactFlow, 10 node types, 7 templates)
- 10 ChatGPT features (feedback loop, A/B testing, brand memory, strategy, rate limiting, monetization, autonomous mode, mass operations)
- Agency-agents repo integration (platform strategies)
- Multi-niche account system
- Enhanced crawler (13 deep intel fields)
- All audited — 9 bugs found and fixed, seed data cleaned (no fake statuses)
- Build clean, zero errors

### March 18, 2026 — Audit Bugfixes + Desktop Launcher:
**Audit bugfixes (from previous session's 3-agent audit):**
1. `opus-review.ts` — Changed from saving review as pipeline run to activity log (was confusing image/video workers)
2. `telegram/route.ts` — Admin chat ID lockdown (first msg sets admin, non-admin msgs ignored)
3. `outreach-engine.ts` — Removed double-increment of followUpCount
4. `workers.ts` — Lip sync file paths now construct public URLs for fal.ai (`videoInput`/`audioInput`)
5. `settings/route.ts` — Added TELEGRAM_CHAT_ID to allowed keys
6. `meeting-engine.ts` — Fixed date range off-by-1 (was +2 instead of +1)
7. `feedback-engine.ts` — Fixed avg calculation to exclude zero-view posts
8. `detail-panel.tsx` — Removed fake Pause/Cancel buttons, changed "+ Add" to informational label
9. `voice/server.py` — Made upload_profile endpoint actually accept audio data
10. `schema.prisma` — Updated table count comment (22 → 53)

**Desktop launcher (pywebview):**
- `launch.py` — Starts Docker + Next.js, opens native EdgeChromium window + system tray
- `start.bat` — Invokes launcher via `launcher-venv/`
- `launcher-venv/` — Python 3.10 venv with pywebview, pystray, Pillow
- `icon.ico` + `icon.png` — App icon (claw + orb design)
- Desktop shortcut at `~/OneDrive/Desktop/OpenClaw.lnk`
- Same pattern as NEXUS Voice Command Center

**Planned (not done yet):**
- Migrate Docker PostgreSQL → Supabase free tier (just change DATABASE_URL)
- Migrate Docker Redis → Upstash Redis free tier (just change REDIS_URL)
- Remove Docker dependency entirely

### What's NOT DONE (next session):
1. **25 content templates** — researched (docs/workflow-templates-catalog.md) but NOT added to visual editor code
2. **Competitor analysis / social listening** — researched (docs/competitor-analysis-research.md) but NOT built
3. **Content repurposing (long → short)** — researched but NOT built
4. **Outreach Agent** — discussed (9th agent for contacting businesses) but NOT built
5. **Campaign Manager** — discussed (Business X → AI Model Y → Content Z tracking) but NOT built
6. **Media Kit Generator** — discussed (portfolio pages for AI models) but NOT built
7. **Multi-language support** — not started
8. **Direct API publishing (TikTok/IG/YT/FB)** — not started, currently using Chrome automation stub

### Business Model (discussed, not coded):
- AI models advertise for businesses directly (commission per sale)
- OpenClaw bot does outreach to businesses, pitches AI model advertising services
- Cut out TikTok/Instagram as revenue source — they're just distribution channels
- Revenue: commission per buyer from businesses that accept the outreach

### Next Session Plan:
- Enable `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` for multi-agent collaboration
- Assemble team: Frontend Developer, Backend Architect, Outbound Strategist, Orchestrator
- Build all 8 unbuilt features
- Agents from `~/.claude/agents/` (161 available, already loaded)

### What was built this session:

#### Phase 1: Core Platform (built in prior sessions)
- 13 dashboard pages, 42 API endpoints, 23 DB tables
- Content pipeline: prompt → image → video → voiceover → lip sync → assembly
- 8 AI agents: Ideator, Writer, Designer, Filmmaker, Editor, Social Bot, Engage Bot, Scanner
- BullMQ workers: pipeline, social posting, scheduler, heartbeat, dispatcher, mention scanner
- Telegram bot operator (Claude Opus 4.6)
- Chat & Commands in-browser interface

#### Phase 2: Agency-Agents Repo Integration
- Platform-specific strategies from msitarzewski/agency-agents (8 platforms)
- File: `src/lib/agents/platform-strategies.ts` (206 lines)
- Wired into: pipeline prompt stage, auto-reply, social publisher, agent dispatcher
- Platforms covered: TikTok, Instagram, Twitter/X, YouTube, Reddit, LinkedIn, Facebook, Threads

#### Phase 3: Multi-Niche System
- `niche` field added to Platform model
- Niche-aware content routing on approval (content niche → matching platform accounts)
- Niche management in Settings page

#### Phase 4: Enhanced Crawler
- 13 new fields on TrendingTopic: sourceAuthor, sourceFollowers, growthRate, contentFormat, hookUsed, whyViral, contentAngle, audienceDemo, competitorsCovering, opusNotes
- Deep intel prompt for Claude Sonnet web search
- Auto-scan every 6 hours + initial scan 2min after startup

#### Phase 5: ChatGPT's 10 Missing Features (ALL BUILT)

| # | Feature | Backend | API Routes | Frontend Page | Wired Into |
|---|---------|---------|------------|---------------|------------|
| 1 | Feedback Loop | `src/lib/analytics/performance-tracker.ts`, `feedback-engine.ts` | `/api/analytics/performance`, `/learnings` | Analytics page | Pipeline prompt (learnings injection), startup (2hr interval) |
| 2 | Engagement Analytics | `src/lib/analytics/engagement-analyzer.ts` | `/api/analytics/performance` | Analytics page | Performance tracker |
| 3 | A/B Testing | `src/lib/testing/ab-test-engine.ts` | `/api/testing`, `/api/testing/[id]` | `/ab-testing` | Startup (4hr auto-check) |
| 4 | Character Consistency | `src/lib/characters/character-engine.ts` | `/api/characters/[id]/profile` | Settings | Pipeline prompt (character injection) |
| 5 | Brand Memory + Voice | `src/lib/memory/brand-memory.ts`, `brand-voice.ts` | `/api/brand/memory`, `/api/brand/voice` | `/brand` | Pipeline prompt (memory + voice injection), startup (2hr learning) |
| 6 | Content Strategy | `src/lib/strategy/content-planner.ts`, `series-manager.ts` | `/api/strategy/calendar`, `/buckets`, `/series` | `/strategy` | Calendar generation |
| 7 | Speed Optimization | Pipeline concurrency bumped to 5 | — | — | Pipeline worker |
| 8 | Rate Limiting | `src/lib/social/rate-limiter.ts` | `/api/platforms/[id]/rate-limit` | Settings | Social publisher (pre-post check, human delays) |
| 9 | Monetization | `src/lib/monetization/affiliate-manager.ts` | `/api/monetization/links`, `/cta`, `/revenue`, `/roi` | `/monetization` | Social publisher (CTA injection) |
| 10 | Autonomous Mode | `src/lib/autonomous/decision-engine.ts`, `auto-publisher.ts` | `/api/autonomous/rules`, `/decisions`, `/override` | `/autonomous` | Opus review flow |

#### Phase 6: Mass Operations
- `src/lib/batch/batch-creator.ts` — batch from trending, calendar, or manual
- `src/lib/batch/mass-scheduler.ts` — auto-create posting schedules per niche
- API: `/api/batch`, `/api/batch/status`, `/api/batch/schedule`
- Frontend: `/batch` page with 3 tabs (Batch Create, Batch Status, Mass Schedule)
- Pipeline concurrency: 5 simultaneous pipelines

#### Phase 7: Qwen3-TTS 1.7B Voice Server
- `voice/server.py` — FastAPI server, loads Qwen3-TTS-12Hz-1.7B-CustomVoice
- `voice/.venv/` — dedicated Python 3.10 venv (isolated from other projects)
- `voice/requirements.txt` — torch, qwen-tts, fastapi, uvicorn, soundfile
- `voice/profiles/` — drop .wav reference audio files here for voice cloning
- `voice/output/` — generated audio files
- Auto-launches with OpenClaw via `src/lib/voice/voice-launcher.ts`
- Available speakers: aiden, dylan, eric, ono_anna, ryan, serena, sohee, uncle_fu, vivian
- Pipeline voiceover stage: tries Qwen3-TTS first → falls back to edge-tts
- **TESTED AND WORKING** — generated real audio file (169KB WAV)
- Port: 17500
- VRAM: ~3.5GB on RTX 4070 (8GB total)

#### Phase 8: Visual Workflow Editor (ComfyUI-style)
- `src/app/visual-editor/page.tsx` — ReactFlow canvas with drag/drop/zoom/pan
- `src/components/visual-editor/nodes.tsx` — 10 custom node types
- `src/lib/visual-editor/templates.ts` — 7 workflow templates from ComfyUI
- `src/app/api/workflows/` — CRUD + run API
- DB: `Workflow` + `WorkflowRun` tables
- Node types: Content Input, Character, Script Writer, Image Gen, Video Gen, Voice, Lip Sync, Assembly, Preview, Batch
- Templates: Full Pipeline, Talking Head (Kling Avatar), Scene/B-Roll, Dual Character, Dance/Motion (Seedance), FLUX Multi-Reference, Batch Factory
- Sidebar: node palette + template picker + saved workflows

---

## Tech Stack

| Component | Technology |
|-----------|-----------|
| Frontend | Next.js 14, React 18, TypeScript, Tailwind CSS, shadcn/ui, ReactFlow |
| Backend | Node.js, Next.js API routes, Prisma 7, PostgreSQL 16, Redis 7, BullMQ |
| Voice | Qwen3-TTS 1.7B (Python 3.10, FastAPI, PyTorch + CUDA) |
| Script/Language | Claude Sonnet 4.6 (Anthropic API) |
| Images | Gemini Nano Banana 2 (Google API) |
| Video | Gemini Veo 3.1 (Google API) |
| Lip Sync | Kling 3.0 (fal.ai API) |
| Assembly | FFmpeg (local) |
| Notifications | Telegram Bot (Claude Opus 4.6) |
| Browser Automation | Claude Code Chrome Extension |

---

## Database: 40 Tables

**Original (23):** agents, agent_logs, content_items, content_assets, pipeline_runs, characters, platforms, social_posts, mentions, conversations, messages, tasks, schedules, schedule_runs, browser_sessions, model_routes, model_usage_log, obs_traces, obs_spans, analytics_snapshots, activity_log, settings, trending_topics

**New (17):** content_performance, performance_learning, engagement_snapshots, ab_tests, ab_test_variants, character_profiles, brand_memory, brand_voice, content_buckets, content_series, content_calendar, platform_rate_limits, posting_log, affiliate_links, cta_templates, revenue_events, autonomous_rules, autonomous_decisions, workflows, workflow_runs

---

## API Endpoints: 90+

See OPENCLAW-COMPLETE-GUIDE.md for full list. New endpoints from this session:
- `/api/analytics/performance`, `/api/analytics/learnings`
- `/api/testing`, `/api/testing/[id]`
- `/api/brand/memory`, `/api/brand/voice`
- `/api/strategy/calendar`, `/api/strategy/buckets`, `/api/strategy/series`, `/api/strategy/series/[id]`
- `/api/characters/[id]/profile`
- `/api/platforms/[id]/rate-limit`
- `/api/monetization/links`, `/api/monetization/links/[id]`, `/api/monetization/cta`, `/api/monetization/revenue`, `/api/monetization/roi`
- `/api/autonomous/rules`, `/api/autonomous/rules/[id]`, `/api/autonomous/decisions`, `/api/autonomous/decisions/[id]/override`
- `/api/batch`, `/api/batch/status`, `/api/batch/schedule`
- `/api/workflows`, `/api/workflows/[id]`, `/api/workflows/[id]/run`

---

## Sidebar Navigation (20 items)

Overview, Ideas & Research, Creation Studio, **Visual Editor**, Social Media, **Content Strategy**, Chat & Commands, Agent Fleet, **A/B Testing**, **Brand & Memory**, **Monetization**, **Autonomous Mode**, **Mass Operations**, Tasks, Schedules, Archive, Browser Sessions, Model Routing, Analytics, Settings

---

## Background Workers (startup.ts)

| Worker | Interval | Purpose |
|--------|----------|---------|
| Pipeline Worker | On-demand (BullMQ) | 6-stage content pipeline, concurrency 5 |
| Social Worker | On-demand (BullMQ) | Post to platforms with rate limiting |
| Scheduler | Every 60s | Cron job execution |
| Heartbeat Monitor | Every 30s | Mark agents offline if stale |
| Agent Dispatcher | Every 15s | Assign tasks to idle agents |
| Mention Scanner | Every 30 min | Scan social mentions, draft replies |
| Trend Scanner | Every 6 hours | Search internet for trending topics |
| Performance Tracker | Every 2 hours | Track post performance, generate learnings |
| A/B Test Checker | Every 4 hours | Evaluate running tests, scale winners |
| Rate Limit Reset | Every 60s (midnight check) | Reset daily post counts |
| Voice Server | On startup | Spawn Python Qwen3-TTS process |

---

## Production Model Stack

| Job | Model | Where | Cost |
|-----|-------|-------|------|
| Script/captions | Claude Sonnet 4.6 | Cloud (Anthropic) | ~$0.003 |
| Images | Nano Banana 2 / FLUX + LoRA (future) | Cloud (Google / fal.ai) | ~$0.003 |
| Video | Veo 3.1 | Cloud (Google) | ~$0.05 |
| Lip sync + talking head | Kling 3.0 | Cloud (fal.ai) | ~$0.12-0.15/sec |
| Voice cloning | Qwen3-TTS 1.7B | Local (RTX 4070) | Free |
| Assembly | FFmpeg | Local | Free |
| Trend scanning | Claude Sonnet 4.6 + web search | Cloud | ~$0.01 |
| Opus operator | Claude Opus 4.6 | Cloud | ~$0.02 |

**Est. cost per content piece:** ~$1.00-1.25
**Est. daily cost (25 posts/5 niches):** ~$25-30

---

## Pipeline Intelligence Injection

When the Writer agent generates a script, the system prompt now includes ALL of:
1. **Writer personality** (from personalities.ts)
2. **Platform strategies** (from platform-strategies.ts — per target platform)
3. **Performance learnings** (from feedback-engine.ts — what worked before)
4. **Brand memory** (from brand-memory.ts — DO more / AVOID)
5. **Brand voice** (from brand-voice.ts — tone, vocabulary, style)
6. **Character identity** (from character-engine.ts — traits, catchphrases, visual style)

---

## What's NOT done yet

| Item | Status | Notes |
|------|--------|-------|
| LoRA training pipeline | Not started | Needs characters + reference images first |
| FLUX image generation | Not wired | Currently using Nano Banana 2, FLUX for when LoRA is needed |
| Niche configuration | Empty | No niches chosen yet — system is flexible |
| Platform connections | Not connected | No real social accounts connected |
| API keys | Not set | Need ANTHROPIC_API_KEY, GEMINI_API_KEY in Settings |
| Docker → Supabase + Upstash | PLANNED | Remove Docker dependency, use cloud Postgres + Redis |
| Desktop launcher testing | NEEDS RESTART | Icon cache may need PC restart to show properly |
| End-to-end test | NEEDED | Haven't run full pipeline with real APIs |
| SoX installation | Missing | Voice server warns but works without it |
| flash-attn | Not installed | Optional, speeds up voice generation |

---

## How to Resume Next Session

**Option A: Desktop App (preferred)**
Double-click the OpenClaw shortcut on Desktop — it auto-starts Docker, Next.js, and opens a native window.

**Option B: Manual**
```bash
# 1. Start Docker (PostgreSQL + Redis)
docker start openclaw-db openclaw-redis

# 2. Start dev server (auto-starts voice server too)
cd ~/openclaw && npx next dev -p 3001

# 3. Open http://localhost:3001
```

**Next steps when resuming:**
1. Test desktop launcher after PC restart (icon cache should be fresh)
2. Migrate Docker → Supabase + Upstash (remove Docker dependency)
3. Then build the 8 unbuilt features with agent team

---

## Key Files to Know

| Purpose | File |
|---------|------|
| Pipeline workers | `src/lib/pipeline/workers.ts` (~730 lines) |
| Pipeline orchestrator | `src/lib/pipeline/orchestrator.ts` |
| All background workers | `src/lib/queue/startup.ts` |
| Platform strategies | `src/lib/agents/platform-strategies.ts` |
| Agent personalities | `src/lib/agents/personalities.ts` |
| Voice server | `voice/server.py` |
| Voice launcher | `src/lib/voice/voice-launcher.ts` |
| Visual editor | `src/app/visual-editor/page.tsx` |
| Workflow templates | `src/lib/visual-editor/templates.ts` |
| Batch operations | `src/lib/batch/batch-creator.ts` |
| Rate limiter | `src/lib/social/rate-limiter.ts` |
| Feedback engine | `src/lib/analytics/feedback-engine.ts` |
| Brand memory | `src/lib/memory/brand-memory.ts` |
| Decision engine | `src/lib/autonomous/decision-engine.ts` |
| Database schema | `prisma/schema.prisma` (40 tables) |
| Full docs | `OPENCLAW-COMPLETE-GUIDE.md` |

---

## Environment

- **OS:** Windows 11 Pro
- **GPU:** NVIDIA RTX 4070 Laptop (8GB VRAM)
- **Python:** 3.10.11 (voice venv at `voice/.venv/`)
- **Node:** v24.13.0
- **Shell:** bash via Git Bash
- **Docker:** openclaw-db (port 5433), openclaw-redis (port 6380)
