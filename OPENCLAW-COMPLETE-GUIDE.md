# OPENCLAW PLATFORM — COMPLETE SYSTEM DOCUMENTATION

## OVERVIEW

OpenClaw is a full-stack AI content factory that generates, reviews, and publishes short-form video content to 8+ social media platforms. It combines Claude Sonnet 4.6 for language tasks, Gemini (Nano Banana + Veo 3.1) for images and video, edge-tts for voiceover, Kling for lip sync, and FFmpeg for assembly.

**Tech Stack:**
- Frontend: Next.js 14, React 18, TypeScript, Tailwind CSS, shadcn/ui
- Backend: Node.js, Next.js API routes, Prisma ORM, PostgreSQL 16
- Job Queue: BullMQ + Redis 7
- Models: Claude Sonnet 4.6, Gemini Nano Banana 2, Veo 3.1, Kling, edge-tts, FFmpeg
- Notifications: Telegram Bot (Claude Opus 4.6 Operator)
- Browser Automation: Claude Code Chrome Extension

**Database:** PostgreSQL 16 (23 tables, Prisma v7)
**Running on:** Docker (OpenClaw db on port 5433, Redis on port 6380)
**Development Server:** Port 3001

---

## PART 1: FRONTEND PAGES (13 PAGES)

### 1. DASHBOARD (`/`) — Command Center
**What you see:** Real-time KPI cards (Active Agents, Posts Today, Tokens Used, Cost Today), Social Media Command Center with 8 platform cards, Content Queue, Model Routing status, Chrome Sessions, Agent Fleet table, Token Usage hourly chart, Task Distribution donut chart, Activity Feed, and Operator section showing Bobby Chen as admin.

**What it does:** Polls 4 API endpoints every 15 seconds to keep everything live. This is your home base — one glance tells you what's happening across the entire system.

**APIs called:** GET /api/dashboard, GET /api/social/posts?status=scheduled, GET /api/routing, GET /api/browser

---

### 2. IDEAS & RESEARCH (`/ideas`) — Trend Discovery
**What you see:** Filter bar (niche + status dropdowns), "Scan Now" button, grid of trending topic cards with virality scores, hooks, growth rates, audience demographics, and "Use for Content" buttons.

**What it does:** This is where the Trend Scanner saves its findings. Each card shows a trending topic from Twitter, TikTok, YouTube, Reddit, Instagram, LinkedIn, Google Trends, or news sites. The most important field is "Hook Used" — the exact first line or first 3 seconds that made people stop scrolling.

**How to use it:**
1. Click "Scan Now" → Claude Sonnet searches the internet for trending topics in each configured niche
2. Browse cards sorted by virality score (0-100)
3. Read "Why Viral" to understand what emotion/pattern is driving shares
4. Read "Content Angle" for a suggested twist to make YOUR version better
5. Click "Use for Content" → creates a Content Item in the Studio, ready for pipeline

**APIs called:** GET /api/research/trending, POST /api/research/scan, POST /api/content

---

### 3. CREATION STUDIO (`/studio`) — Content Production Pipeline
**What you see:** Content selector tabs at top, 5-stage pipeline visualization on the left (Prompt Writer → Image Generation → Video Generation → Voiceover → Final Assembly), stage detail panel in center showing input/output/cost, Pipeline Info sidebar on right with models and cost breakdown.

**What it does:** This is the factory floor. Each content item goes through 5 (or 6 with lip sync) stages:

| Stage | Model | What it produces | Cost |
|-------|-------|------------------|------|
| Prompt Writer | Claude Sonnet 4.6 | Script, hooks, captions, hashtags per platform | ~$0.003 |
| Image Generation | Gemini Nano Banana 2 | 1024x1024 scene/character image | ~$0.002 |
| Video Generation | Gemini Veo 3.1 | 8-second 9:16 vertical video | ~$0.050 |
| Voiceover | edge-tts | Audio narration from script | Free |
| Lip Sync (optional) | Kling | Mouth movements synced to audio | ~$0.020 |
| Final Assembly | FFmpeg | Combined video + audio → final MP4 | Free |

**How to use it:**
1. Select content from tabs
2. Click "Run Full Pipeline"
3. Watch stages progress (polls every 3 seconds while running)
4. When complete → Opus reviews quality → sends to you for approval
5. Approve/reject from the approval panel or via Telegram

**APIs called:** GET /api/content, GET /api/content/{id}, POST /api/content/{id}/pipeline/start, GET /api/characters

---

### 4. SOCIAL MEDIA (`/social`) — Publishing & Engagement
**What you see:** KPI cards (Total Posts, Scheduled, Mentions, Unreplied, Posted), three tabs: Post Queue, Mentions, Platforms.

**Tab 1 — Post Queue:** All posts waiting to go out, currently posting, or already posted. Posts appear here AFTER you approve content. Each post has a status: draft → scheduled → posting → posted (or failed).

**Tab 2 — Mentions:** Comments, replies, and tags from your audience. The mention scanner runs every 30 minutes. Claude auto-drafts replies using platform-specific strategies. You review and approve before sending.

**Tab 3 — Platforms (6):** Your connected social media accounts. Each shows: platform name, handle, niche, connection status, follower count. This is where the multi-niche system lives — same platform (e.g. Twitter) can have different accounts for different niches.

**How content gets posted:**
1. You `/approve` a content item
2. System finds all platforms matching the content's niche
3. Creates a SocialPost for each platform
4. Social Worker picks up posts from queue
5. Chrome automation posts to each platform with platform-specific formatting
6. Status updates to "posted", engagement tracking begins

**APIs called:** GET /api/social/stats, GET /api/social/posts, GET /api/social/mentions, GET /api/platforms

---

### 5. CHAT & COMMANDS (`/chat`) — In-Browser Operator
**What you see:** Conversation sidebar (left), chat area (center) with message history, text input at bottom. Quick-start buttons: "Create a TikTok about AI", "How are my agents?", "What's the status?", "Help".

**What it does:** Same as Telegram bot but in-browser. You type natural language, Claude Sonnet responds and can execute commands. Conversation history saved per thread.

**Example commands:** "Create a reel about AI agents", "Show me trending topics", "What's the cost today?", "Approve content CNT-001"

**APIs called:** GET /api/chat/conversations, POST /api/chat/send

---

### 6. AGENT FLEET (`/agents`) — AI Worker Management
**What you see:** Stat cards (Active, Idle, Offline, Errors, Cost Today), filter tabs, agent table with columns: Agent, Status, Current Task, Tasks, Tokens, Cost. Expandable rows show personality + capabilities.

**The 8 agents:**

| Agent | Type | What it does | Capabilities |
|-------|------|-------------|-------------|
| Ideator | ideator | Finds trending topics, generates content ideas | research, trending, ideation |
| Writer | writer | Writes scripts, captions, hooks | content_gen, script_writing, caption |
| Designer | designer | Generates images, thumbnails | image_gen, thumbnail |
| Filmmaker | filmmaker | Creates videos, assembles final output | video_gen, assembly |
| Editor | editor | Reviews content quality | quality_review, approval |
| Social Bot | social | Posts to platforms | social_posting, scheduling |
| Engage Bot | engage | Drafts replies to mentions | reply_draft, engagement |
| Scanner | scanner | Monitors hashtags, tracks metrics | mention_scan, sentiment |

**How agents work:**
- Dispatcher runs every 15 seconds, finds idle agents + pending tasks
- Matches agent capabilities to task type
- Assigns task, marks agent "active"
- Heartbeat monitor checks every 30 seconds — marks offline if no heartbeat for 5 min
- When task completes, agent goes "idle" until next assignment

**APIs called:** GET /api/agents (polls every 10 seconds)

---

### 7. TASKS (`/tasks`) — Work Queue
**What you see:** Stat cards (Total, Running, Pending, Completed, Failed), filter tabs, task cards with status, priority, assigned agent, and creation time.

**What it does:** Shows all work items in the system. Tasks are created by the pipeline, scheduler, or Opus. Agents pick them up from here.

**Task statuses:** pending → in_progress → completed (or failed/cancelled)
**Priorities:** low, medium, high, urgent

---

### 8. SCHEDULES (`/schedules`) — Cron Jobs
**What you see:** Stat cards (Active, Total Runs, Total), schedule cards with toggle switches, cron expressions, next run countdown, last run time.

**What it does:** Manages recurring tasks. Each schedule has a cron expression (e.g., "0 9 * * *" = 9 AM daily) and a task type (pipeline, post, scan, report).

**How scheduling works:**
- Scheduler checks every 60 seconds
- If a schedule is due → executes the task
- Records ScheduleRun with success/failure
- Updates nextRunAt

---

### 9. ARCHIVE (`/archive`) — Content History
**What you see:** Search bar, filter tabs (All, Published, Review, In Progress, Failed), stat cards, 3-column grid of content cards.

**What it does:** Browse all historical content items. Search by title or tag. Filter by status. See total cost per item.

---

### 10. BROWSER SESSIONS (`/browser`) — Chrome Automation
**What you see:** Stat cards (Total, Active, Errors), session cards showing site URL, current action, status, tab ID. Info box with Chrome extension version and connection status.

**What it does:** Monitors live Chrome automation. When Social Bot posts to Instagram, you see the browser session here — what site it's on, what action it's performing, success/failure.

---

### 11. MODEL ROUTING (`/routing`) — AI Model Configuration
**What you see:** Three tabs: Routing Table, LLM Observatory, Usage Stats.

**Routing Table:** Maps task types to models (e.g., content_gen → Claude Sonnet, image_gen → Nano Banana). Toggle routes on/off.

**LLM Observatory:** Traces every LLM API call — model used, latency, cost, input/output. For debugging slow or expensive calls.

**Usage Stats:** Per-model breakdown of requests, tokens, cost, average latency.

---

### 12. ANALYTICS (`/analytics`) — Performance Metrics
**What you see:** KPIs (Total Content, Content Today, Total Posts, Completion Rate), AI Usage (Requests, Tokens, Cost), Posts by Platform table, Tasks Overview.

**What it does:** High-level performance overview. See how much content you're producing, what it costs, which platforms get the most posts.

---

### 13. SETTINGS (`/settings`) — System Configuration
**What you see:** API key inputs (4), general settings (TTS voice, archive path, model), notification toggles (4), platform connections (8), content niches (add/remove), model pipeline status.

**What you configure here:**
- **API Keys:** ANTHROPIC_API_KEY, GEMINI_API_KEY, KLING_API_KEY, TELEGRAM_BOT_TOKEN
- **Platforms:** Connect/disconnect accounts with handles, assign niches
- **Niches:** Add "AI", "Fitness", "Finance" — whatever niches you want to track
- **Notifications:** Toggle alerts for pipeline completion, quality failures, errors, budget warnings
- **TTS Voice:** Choose from 5 voices (Jenny, Guy, Aria, Davis, Sonia)

---

## PART 2: BACKEND SYSTEMS

### API ROUTES (42 endpoints)

**Content (8 endpoints):**
- GET /api/content — List content items
- POST /api/content — Create new content
- GET /api/content/{id} — Get content details + pipeline runs
- PATCH /api/content/{id} — Update content
- POST /api/content/{id}/pipeline/start — Start pipeline
- POST /api/content/{id}/approve — Approve for publishing
- POST /api/content/{id}/reject — Reject with notes
- GET /api/content/{id}/pipeline — Pipeline run history

**Social (5 endpoints):**
- GET /api/social/posts — List posts
- POST /api/social/posts — Create post
- GET /api/social/mentions — List mentions
- POST /api/social/mentions — Scan + draft replies
- GET /api/social/stats — Statistics

**Agents (4 endpoints):**
- GET /api/agents — List agents
- POST /api/agents — Create agent
- POST /api/agents/{id}/heartbeat — Agent heartbeat
- GET /api/agents/personalities — List personalities

**Tasks (4 endpoints):**
- GET /api/tasks — List tasks
- POST /api/tasks — Create task
- POST /api/tasks/{id} — Retry failed task
- PATCH /api/tasks/{id} — Update task

**Schedules (4 endpoints):**
- GET /api/schedules — List schedules
- POST /api/schedules — Create schedule
- PATCH /api/schedules/{id} — Toggle enabled
- DELETE /api/schedules/{id} — Delete schedule

**Research (3 endpoints):**
- GET /api/research/trending — List trending topics
- POST /api/research/scan — Start trend scan
- POST /api/research/plan — Plan content from trends

**Other:**
- GET /api/dashboard — Dashboard KPIs
- GET /api/routing — Model routes + traces + usage
- PATCH /api/routing/{id} — Toggle route
- GET /api/analytics — Analytics summary
- GET /api/archive — Archived content
- GET /api/browser — Browser sessions
- GET /api/platforms — Platform list
- PATCH /api/platforms/{id} — Connect/disconnect platform
- GET /api/settings — Load settings
- POST /api/settings — Save settings
- GET /api/chat/conversations — List conversations
- POST /api/chat/conversations — Create conversation
- GET /api/chat/conversations/{id} — Get messages
- POST /api/chat/send — Send message
- POST /api/telegram — Telegram webhook
- POST /api/files — Upload file
- GET /api/characters — List characters
- GET /api/activity — Activity log

---

### BACKGROUND WORKERS (6 systems)

| Worker | Interval | What it does |
|--------|----------|-------------|
| Pipeline Worker | On-demand | Processes 6-stage content creation via BullMQ |
| Social Worker | On-demand | Posts to platforms via Chrome automation |
| Scheduler | Every 60s | Checks cron schedules, dispatches due jobs |
| Heartbeat Monitor | Every 30s | Marks agents offline if no heartbeat for 5 min |
| Agent Dispatcher | Every 15s | Assigns idle agents to pending tasks |
| Mention Scanner | Every 30 min | Scans social mentions, drafts replies |
| Trend Scanner | Every 6 hours | Searches internet for trending topics per niche |

All workers start when the Next.js server boots (`src/instrumentation.ts` → `src/lib/queue/startup.ts`).

---

### DATABASE (23 TABLES)

| Table | Purpose | Key Fields |
|-------|---------|-----------|
| agents | AI worker roster | name, type, status, personality, currentTask, lastHeartbeat |
| agent_logs | Agent action audit trail | agentId, action, details |
| content_items | Core content pieces | title, niche, status, targetPlatforms, script, finalOutput, totalCost |
| content_assets | Generated files | contentItemId, type (image/video/audio), filePath, mimeType |
| pipeline_runs | Stage execution tracking | contentItemId, stage, model, status, tokensIn, tokensOut, cost, duration |
| characters | AI personas | name, stylePrompt, niche, referenceImages |
| platforms | Social media accounts | name, handle, niche, connected, credentials, followers |
| social_posts | Posts to platforms | platformId, contentItemId, content, status, scheduledAt, publishedAt, engagement |
| mentions | Social mentions/comments | platformId, author, content, sentiment, isReplied, replyText |
| conversations | Chat threads | title, model, source (dashboard/telegram) |
| messages | Chat messages | conversationId, role, content, tokensIn, tokensOut, cost |
| tasks | Work items for agents | title, status, priority, assigneeId, taskType |
| schedules | Cron-based recurring tasks | name, cronExpr, taskType, taskConfig, enabled, nextRunAt |
| schedule_runs | Schedule execution history | scheduleId, status, output, error |
| browser_sessions | Chrome automation tracking | site, tabId, action, status |
| model_routes | Task type → model mapping | taskType, modelName, priority, enabled |
| model_usage_log | Every API call logged | model, taskType, tokensIn, tokensOut, cost, latency |
| obs_traces | LLM call traces | name, model, totalCost, totalMs |
| obs_spans | Nested spans within traces | traceId, name, type, input, output, cost, duration |
| analytics_snapshots | Time-series metrics | metricType, platform, value, capturedAt |
| activity_log | System-wide audit log | type, message, source, metadata |
| settings | Config key-value pairs | key, value, encrypted |
| trending_topics | Trend scanner findings | title, niche, viralityScore, hookUsed, whyViral, contentAngle, audienceDemo |

---

## PART 3: COMPLETE WORKFLOWS

### WORKFLOW 1: From Idea to Published Post

```
Step 1: DISCOVER
  You click "Scan Now" on Ideas page (or /scan on Telegram)
  → Claude Sonnet searches internet for trending topics
  → Finds 8-15 topics per niche with virality scores, hooks, analysis
  → Topics appear as cards on Ideas page

Step 2: CHOOSE
  You browse topics, filter by niche
  → Click "Use for Content" on a winning topic
  → Creates ContentItem in DB (status: "idea")
  → Content appears in Creation Studio

Step 3: PRODUCE
  You click "Run Full Pipeline" in Studio
  → Stage 1: Claude Sonnet writes script, hooks, captions, hashtags
  → Stage 2: Nano Banana generates image from script
  → Stage 3: Veo 3.1 generates 8-second video
  → Stage 4: edge-tts generates voiceover audio
  → Stage 5: FFmpeg combines everything into final MP4
  → Total time: 2-5 minutes, cost: ~$0.06

Step 4: REVIEW
  Pipeline finishes → status becomes "review"
  → Opus (Claude Opus 4.6) scores quality 1-10
  → If score >= 7: sends Telegram alert "Content ready for approval"
  → If score < 7: rejects with feedback, returns to pipeline

Step 5: APPROVE
  You receive Telegram alert
  → Type "/approve CNT-001"
  → System finds all platforms matching content's niche
  → Creates SocialPost for each platform (TikTok, Instagram, Twitter, etc.)
  → Posts enter the queue

Step 6: PUBLISH
  Social Worker picks up each post
  → Loads platform-specific strategy (TikTok Strategist, Instagram Curator, etc.)
  → Chrome automation opens platform, pastes caption, uploads media, clicks Post
  → Status: "posted", engagement tracking begins

Step 7: ENGAGE
  Mention scanner runs every 30 minutes
  → Finds comments, replies, tags on your posts
  → Engage Bot drafts replies using platform-specific voice
  → You review and approve replies on Social page
```

### WORKFLOW 2: Telegram Commands

```
/status      → System overview: agents, content, posts, pipelines running
/agents      → Full agent fleet status with current tasks
/cost        → Today's spend: tokens, API calls, cost breakdown
/create <desc> → Create content + start pipeline automatically
/approve <id>  → Approve content for publishing to all platforms
/reject <id>   → Reject content with feedback
/review      → Show 10 items awaiting approval
/scan        → Start trend scan across all niches
/plan [N]    → Pick N best topics and create content items
/ideas       → Show top 5 trending topics right now
/mentions    → Scan for mentions + generate reply drafts
/calendar    → Show 15 upcoming scheduled posts
/report      → Generate weekly engagement report
```

### WORKFLOW 3: Multi-Niche Content Routing

```
Settings → Add niche "AI"
Settings → Connect @ai_operator (Twitter) → niche: "AI"
Settings → Connect @ai.operator (Instagram) → niche: "AI"
Settings → Connect @ai_operator (TikTok) → niche: "AI"

Settings → Add niche "Fitness"
Settings → Connect @fit_grind (Twitter) → niche: "Fitness"
Settings → Connect @fit.grind (Instagram) → niche: "Fitness"

You: "/create AI reel about autonomous agents"
  → Content niche = "AI"
  → Pipeline runs
  → You approve
  → System finds: which platforms have niche "AI"?
  → Found: @ai_operator (Twitter), @ai.operator (Instagram), @ai_operator (TikTok)
  → Creates 3 SocialPosts (one per platform)
  → Each post formatted with platform-specific strategy
  → Posted to all 3 AI accounts only — fitness accounts untouched
```

---

## PART 4: MODELS & COSTS

| Model | Used For | Est. Cost Per Use |
|-------|----------|-------------------|
| Claude Sonnet 4.6 | Scripts, replies, scanning, chat | ~$0.003 |
| Claude Opus 4.6 | Telegram operator, quality review | ~$0.02 |
| Gemini Nano Banana 2 | Image generation | ~$0.002 |
| Gemini Veo 3.1 | Video generation (8 sec) | ~$0.050 |
| Kling | Lip sync (optional) | ~$0.020 |
| edge-tts | Text-to-speech | Free |
| FFmpeg | Video assembly | Free |

**Estimated cost per content piece:** ~$0.06 (without lip sync), ~$0.08 (with lip sync)

---

## PART 5: INFRASTRUCTURE

```
Docker Containers:
  openclaw-db    → PostgreSQL 16 on port 5433
  openclaw-redis → Redis 7 on port 6380

Dev Server:
  Next.js 14     → port 3001

File Storage:
  ./content-archive/{contentId}/  → Generated files per content item

External Services:
  Anthropic API  → Claude Sonnet + Opus
  Google AI      → Gemini Nano Banana + Veo 3.1
  Kling API      → Lip sync
  Telegram API   → Bot webhook + notifications
  Chrome Extension → Browser automation for posting
```

---

## PART 6: AGENCY-AGENTS REPO INTEGRATION

Platform-specific strategies from msitarzewski/agency-agents are loaded at runtime:

| Repo Agent | Our System | Where It's Used |
|------------|-----------|----------------|
| TikTok Strategist | Pipeline Prompt Writer | Hook-in-3-seconds, 40/30/20/10 content mix, 5-8 hashtags |
| Instagram Curator | Pipeline Prompt Writer | 1/3 content rule, grid planning, 15-20 hashtags |
| Twitter Engager | Auto-Reply + Posting | Under 280 chars, thread hooks, witty tone |
| SEO Specialist | Pipeline Prompt Writer | YouTube titles <60 chars, description optimization |
| Reddit Community Builder | Auto-Reply | No self-promotion, value-first, subreddit culture |
| LinkedIn Content Creator | Pipeline Prompt Writer | Professional tone, thought leadership |
| Social Media Strategist | Posting + Reply | Facebook community building, Threads conversational tone |

**Code locations:**
- `src/lib/agents/platform-strategies.ts` — Platform-specific strategies (206 lines)
- `src/lib/agents/personalities.ts` — Agent personalities (106 lines)
- Called in: pipeline workers, auto-reply, social publisher, agent dispatcher
