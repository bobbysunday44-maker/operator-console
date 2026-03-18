# Project Rules — OpenClaw

> These rules extend the global ~/.claude/CLAUDE.md rules.
> Project-specific rules override global rules where they conflict.

Setup completed on 2026-03-17

---

## Project Context

**Name:** OpenClaw — Operator Console
**Description:** AI-powered autonomous content factory + social media manager + advertising agency platform. Creates content (script → image → video → voiceover → lip sync → assembly), manages multiple social media accounts across niches, has AI agents, trend scanning, A/B testing, brand memory, monetization tracking, autonomous mode, visual workflow editor, and Qwen3-TTS voice cloning.

**Tech Stack:**
- Frontend: Next.js 14, React 18, TypeScript, Tailwind CSS, shadcn/ui, ReactFlow
- Backend: Node.js, Next.js API routes, Prisma 7, PostgreSQL 16, Redis 7, BullMQ
- Voice: Qwen3-TTS 1.7B (Python 3.10, FastAPI, PyTorch + CUDA) — own venv at `voice/.venv/`
- AI Models: Claude Sonnet 4.6, Nano Banana 2, Veo 3.1, Kling 3.0, Qwen3-TTS 1.7B, FFmpeg
- Notifications: Telegram Bot (Claude Opus 4.6)

**Entry Point:** `src/app/page.tsx` (dashboard), `src/instrumentation.ts` (worker startup)

**Key Files:**
- `src/lib/pipeline/workers.ts` — pipeline stage processors (~730 lines)
- `src/lib/queue/startup.ts` — all background worker initialization
- `src/lib/voice/voice-launcher.ts` — spawns Python voice server
- `voice/server.py` — Qwen3-TTS FastAPI server
- `src/lib/agents/platform-strategies.ts` — platform-specific posting strategies
- `src/lib/visual-editor/templates.ts` — workflow templates
- `src/components/visual-editor/nodes.tsx` — ReactFlow custom nodes
- `prisma/schema.prisma` — 43 models
- `PROJECT.md` — full state + resume instructions
- `OPENCLAW-COMPLETE-GUIDE.md` — complete system documentation
- `COMPETITIVE-INTELLIGENCE.md` — 20 competitor analysis

**Database:** PostgreSQL 16 on Docker port 5433 (`openclaw-db`), 43 tables via Prisma 7
**Redis:** Port 6380 (`openclaw-redis`) for BullMQ job queues
**Dev Server:** Port 3001 (Next.js), Port 17500 (voice server)

**External APIs:**
- Anthropic (Claude Sonnet 4.6 + Opus 4.6) — scripts, reviews, chat, trend scanning
- Google (Gemini Nano Banana 2 + Veo 3.1) — images + video generation
- fal.ai (Kling 3.0) — lip sync
- Telegram Bot API — operator notifications

**Hosting:** Local development only (not deployed yet)

**Known Issues:**
- 19 API routes (newer features) missing try/catch on `request.json()` — need error handling
- Social publisher doesn't actually post — needs Chrome automation or platform APIs
- SoX not installed — voice server warns but works without it
- flash-attn not installed — optional, would speed up voice generation

---

## Project-Specific Rules

- **NO FAKE DATA.** Never seed fake "active" statuses, fake "connected" platforms, or demo content. All seed data must reflect real initial state (offline agents, disconnected platforms, empty content).
- **NO STUBS PRETENDING TO WORK.** If a feature isn't implemented, say so clearly in the UI. Don't mark posts as "posted" when nothing was posted. Don't hardcode quality scores.
- **Models are cloud APIs, not local.** Image gen (Nano Banana 2), video gen (Veo 3.1), lip sync (Kling 3.0) all run on cloud APIs — NOT on the local GPU. Only Qwen3-TTS runs locally.
- **FLUX is NOT in use.** Don't mention FLUX unless building LoRA training. Current image gen is Nano Banana 2.
- **Voice server has its own venv.** `voice/.venv/` — isolated from all other Python projects. Never install voice deps globally.
- **Python 3.10 for voice.** The voice server uses Python 3.10 specifically (at `C:/Users/bombo/AppData/Local/Programs/Python/Python310/python.exe`).
- **Pipeline intelligence injection.** When editing `workers.ts` processPrompt(), the system prompt includes: writer personality + platform strategy + performance learnings + brand memory + brand voice + character identity. Don't break this chain.
- **Niche dropdowns.** Currently hardcoded to AI/Fitness/Finance on strategy, brand, and batch pages. Should eventually be fetched from Settings.
- **Target platforms.** TikTok, YouTube, Facebook, Instagram are the priority. Twitter is NOT a priority.
- **Business model.** AI models advertise for businesses directly (commission per sale), not posting on TikTok for views. OpenClaw is an AI advertising agency platform.
- **All Python uses project venv.** Both Qwen3-TTS and edge-tts run from `voice/.venv/`. No system Python at runtime.
- **Docker dependency (MIGRATING).** Currently needs Docker for PostgreSQL + Redis. Plan: migrate to Supabase (Postgres) + Upstash (Redis) to remove Docker entirely. Just connection string changes, zero code changes.
- **Desktop launcher.** `launch.py` + `start.bat` + `launcher-venv/` (Python 3.10, pywebview). Same pattern as NEXUS Voice Command Center. Shortcut on `~/OneDrive/Desktop/`.
- **Launcher venv is separate.** `launcher-venv/` is NOT the voice venv. Voice = `voice/.venv/`, Launcher = `launcher-venv/`. Both Python 3.10.
- **Agent teams.** 161 agents installed at `~/.claude/agents/`. Enable `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` for multi-agent collaboration.

## Unbuilt Features (Next Session)

These were researched/discussed but NO code was written:
1. 25 content templates → visual editor (see `docs/workflow-templates-catalog.md`)
2. Competitor analysis / social listening (see `docs/competitor-analysis-research.md`)
3. Content repurposing (long → short)
4. Outreach Agent (9th agent — contacts businesses for advertising deals)
5. Campaign Manager (Business X → AI Model Y → Content Z → Revenue tracking)
6. Media Kit Generator (portfolio pages for AI models)
7. Multi-language support
8. Direct API publishing to TikTok/Instagram/YouTube/Facebook

Team for next session: Frontend Developer, Backend Architect, Outbound Strategist, Orchestrator (all from `~/.claude/agents/`)

---

## Deployment Notes

Not deployed yet. Development only.

**To start locally:**
Option A: Double-click OpenClaw desktop shortcut (auto-starts Docker + Next.js + opens native window)

Option B: Manual:
```bash
docker start openclaw-db openclaw-redis
cd ~/openclaw && npx next dev -p 3001
# Open http://localhost:3001
```

**Required env vars (set in Settings page, stored in DB):**
- ANTHROPIC_API_KEY
- GEMINI_API_KEY
- KLING_API_KEY (for lip sync via fal.ai)
- TELEGRAM_BOT_TOKEN
