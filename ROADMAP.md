# Operator Console — Full Product Roadmap

## Updated: March 16, 2026
## Vision: AI content factory controlled by Opus via Telegram

---

## ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────┐
│                    YOU (Bobby)                               │
│              Telegram + Dashboard                            │
└─────────────┬───────────────────────────┬───────────────────┘
              │                           │
              ▼                           ▼
┌─────────────────────┐    ┌──────────────────────────┐
│   OPUS (Telegram)    │    │   Dashboard (Web App)     │
│   claude-opus-4-6    │    │   localhost:3001          │
│                      │    │                          │
│   • Reads Idea Bank  │    │   • View content         │
│   • Plans content    │    │   • Approve / Reject     │
│   • Triggers pipeline│    │   • Monitor agents       │
│   • Reviews output   │    │   • View analytics       │
│   • Notifies you     │    │   • Manage settings      │
│   • Pushes to post   │    │                          │
└─────────┬───────────┘    └──────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────┐
│                   RESEARCH LAYER                             │
│                                                              │
│   Trend Scanner (Sonnet + web search)                       │
│   • Twitter/X trending    • TikTok discover                 │
│   • YouTube trending      • Reddit hot posts                │
│   • Google Trends         • News/blogs                      │
│                                                              │
│   Content Aggregator                                        │
│   • Deduplicates          • Scores by virality              │
│   • Tags by niche         • Saves to Idea Bank              │
│                                                              │
│   Idea Bank (Notion API or local DB)                        │
│   • Trending topics with source links                       │
│   • Engagement data       • Niche tags                      │
│   • Opus reads weekly, picks winners                        │
└─────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────┐
│                   CONTENT PIPELINE                           │
│                                                              │
│   1. Sonnet → Script + Hook + Caption + Hashtags            │
│   2. Nano Banana → Scene images + Thumbnail (with text)     │
│   3. Veo 3.1 → Video (9:16 vertical, 8s)                   │
│   4. edge-tts → Voiceover                                   │
│   5. Kling → Lip sync (if speaking character)               │
│   6. FFmpeg → Final assembly                                │
│                                                              │
│   Specialized prompts for:                                  │
│   • Hooks (first 2 seconds / first line)                    │
│   • Thumbnails (click-worthy with text overlay)             │
│   • Platform-specific formatting (TikTok vs LinkedIn)       │
└─────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────┐
│                   OPUS REVIEW                                │
│                                                              │
│   Opus reads finished content:                              │
│   • Script quality       • Hook strength                    │
│   • Brand alignment      • Visual quality                   │
│   • Gives score 1-10                                        │
│                                                              │
│   If score >= 7 → Sends to you for approval                │
│   If score < 7 → Sends back to pipeline with notes          │
│                                                              │
│   Telegram notification:                                    │
│   "Content ready: [title] — Score 8.4/10, $0.05 total.     │
│    Approve in dashboard."                                    │
└─────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────┐
│                   YOUR APPROVAL (Dashboard)                  │
│                                                              │
│   • Preview video/image                                     │
│   • Read script + caption                                   │
│   • See cost breakdown                                      │
│   • Approve → queues for publishing                         │
│   • Reject → sends notes back to pipeline                   │
└─────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────┐
│                   PUBLISHING                                 │
│                                                              │
│   Chrome automation posts to platforms on schedule          │
│   Opus confirms on Telegram: "Posted to TikTok ✓"          │
│                                                              │
│   Post-publish monitoring:                                  │
│   • Track engagement (likes, comments, shares)              │
│   • Auto-reply to comments in your voice (Sonnet)           │
│   • Report engagement metrics to you on Telegram            │
└─────────────────────────────────────────────────────────────┘
```

---

## MODEL STACK

| # | Model | Role | API Key | Notes |
|---|-------|------|---------|-------|
| 1 | Claude Opus 4.6 | THE OPERATOR — Telegram bot, reviews content, orchestrates everything | ANTHROPIC_API_KEY | Head of the operation |
| 2 | Claude Sonnet 4.6 | Pipeline worker — scripts, hooks, captions, trend research, engagement replies | ANTHROPIC_API_KEY | Same key as Opus |
| 3 | Gemini Nano Banana 2 | Images — scenes, thumbnails | GEMINI_API_KEY | |
| 4 | Gemini Veo 3.1 | Video — 9:16 vertical clips | GEMINI_API_KEY | Same key |
| 5 | Kling Lip Sync | Lip sync — speaking characters | KLING_API_KEY (fal.ai) | Optional |
| 6 | edge-tts | Voiceover — Microsoft voices | FREE | Local CLI |
| 7 | FFmpeg | Assembly — combines everything | FREE | Local CLI |

**3 API keys total. Opus + Sonnet share the same Anthropic key.**

---

## BUILD PHASES

### Phase A: DONE — Shell + Infrastructure
- [x] All 12 pages rendered
- [x] 22 Prisma tables
- [x] 24+ API routes (all Prisma-backed)
- [x] BullMQ + Redis queues
- [x] Pipeline workers (all 6 stages)
- [x] Settings API + UI
- [x] SSE activity feed
- [x] Agent heartbeat + dispatcher
- [x] Social publisher worker
- [x] Schedule cron runner
- [x] All mock data killed

### Phase B: NEXT — The Brain (Opus as Operator)
- [ ] B1. Upgrade Telegram bot to Opus 4.6 with full operator system prompt
- [ ] B2. Telegram commands: /create, /status, /approve, /reject, /calendar, /trending
- [ ] B3. Pipeline completion → Opus notification flow
- [ ] B4. Opus AI review step (score 1-10, approve/reject/redo)
- [ ] B5. Approval UI in dashboard (Approve/Reject buttons + preview)
- [ ] B6. Post-approval → Opus triggers Chrome publishing
- [ ] B7. Agent personality prompts (soul for each agent type)

### Phase C: Research Layer
- [ ] C1. Trend Scanner — Sonnet + web search scrapes trending topics
- [ ] C2. Content Aggregator — deduplicates, scores, tags by niche
- [ ] C3. Idea Bank — store in DB (or Notion API integration)
- [ ] C4. Opus reads Idea Bank, picks winners, plans weekly calendar
- [ ] C5. Niche configuration — user sets which niches to track

### Phase D: Content Quality
- [ ] D1. Hook optimization — specialized prompt for viral hooks
- [ ] D2. Thumbnail generation — designed thumbnails with text overlay
- [ ] D3. Platform-specific formatting — different output for TikTok vs LinkedIn vs YouTube
- [ ] D4. A/B caption variants — generate 3 captions, Opus picks best
- [ ] D5. Content calendar view in dashboard

### Phase E: Engagement
- [ ] E1. Mention monitoring — active scraping across platforms
- [ ] E2. Auto-reply with Sonnet — replies in your voice/brand
- [ ] E3. Engagement tracking — likes, comments, shares per post
- [ ] E4. Performance reports — Opus sends weekly summary on Telegram

---

## RESUME INSTRUCTIONS
1. Read this file for the full vision
2. Read PROGRESS.md for what's already built
3. MCP memory: search_nodes("OperatorConsole")
4. Start with Phase B — the brain
