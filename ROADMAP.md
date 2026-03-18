# OpenClaw — Master Roadmap

**Updated:** 2026-03-18
**Vision:** AI advertising agency with autonomous agents that work like a real company

---

## WHAT'S DONE (Phases 1-8 Complete)

- 48 database tables, 100+ API endpoints, 24 sidebar pages
- Content pipeline: script → image → video → voiceover → lip sync → assembly
- 9 AI agents (Ideator, Writer, Designer, Filmmaker, Editor, Social Bot, Engage Bot, Scanner, Outreach Bot)
- 11 background workers (pipeline, social, scheduler, heartbeat, dispatcher, mentions, trends, performance, A/B tests, rate limits, voice server)
- Qwen3-TTS 1.7B voice server (tested, working, own venv)
- Visual workflow editor (ReactFlow, 10 node types, 32 templates)
- Feedback loop + engagement analytics + brand memory + brand voice
- A/B testing engine + content strategy (buckets, series, calendar)
- Rate limiting + monetization (affiliate links, CTA injection, ROI tracking)
- Autonomous mode (rule-based auto-approval)
- Mass operations (batch create, mass scheduler, 5x parallel pipelines)
- Campaign management (business deals, revenue tracking)
- Outreach system (cold emails, pitch generator with Claude web search, 5 email templates)
- Competitor analysis (scan via Claude web search, engagement tracking)
- Content repurposing (7 formats across platforms)
- Multi-language support (10 languages, Qwen3-TTS speaker mapping)
- Direct API publishing (Post for Me / Upload-Post / Ayrshare)
- Media kit generator (AI model portfolio pages)

---

## WHAT'S NEXT — The Virtual Office + Agent Intelligence

### Phase 9: Agent Memory System
**Goal:** Give every agent a persistent memory that shapes their behavior

| Task | Description |
|------|-------------|
| 9.1 | AgentMemory table — per-agent memory stream (text, importance 1-10, timestamp, embedding) |
| 9.2 | Memory importance scoring — Claude rates each memory 1-10 on creation |
| 9.3 | Memory retrieval formula — `score = recency(decay) + importance(normalized) + relevance(cosine)` |
| 9.4 | Reflection engine — when cumulative importance exceeds threshold, synthesize memories into higher-level insights ("I've noticed POV hooks always perform better") |
| 9.5 | Memory injection into agent prompts — when an agent acts, load their top relevant memories into the system prompt |
| 9.6 | Cross-agent memory sharing — when agents talk, the conversation becomes a memory for both |
| 9.7 | Memory API — GET/POST per agent, search, delete old low-importance memories |

### Phase 10: Agent Think Loop (Perceive → Think → Act)
**Goal:** Agents autonomously decide what to do every 15 seconds

| Task | Description |
|------|-------------|
| 10.1 | AgentState table — current position, activity, mood, energy, last action, current conversation |
| 10.2 | Perceive function — what's happening? who's nearby? any new messages? what's in my memory? |
| 10.3 | Think function — Claude Sonnet decides next action: `{ thought, action, target, message }` |
| 10.4 | Act function — execute the decision (talk, work, move, rest, attend meeting, start task) |
| 10.5 | OCEAN personality traits — 5 floats per agent influencing behavior (high extraversion = more conversations) |
| 10.6 | Think loop worker — runs every 15 seconds for each active agent |
| 10.7 | Initiative system — agents start conversations based on memory + personality, not just tasks |
| 10.8 | Opinion system — agents form opinions about what works/doesn't based on performance data |

### Phase 11: Agent Communication Hub
**Goal:** Unified chat with channels, @mentions, agent-to-agent conversations

| Task | Description |
|------|-------------|
| 11.1 | Upgrade Chat & Commands page — add channels (#general, #pipeline, #outreach, #engagement, #agent-talk) |
| 11.2 | Channel management — create, rename, archive channels |
| 11.3 | @mention system — type @Writer → Writer auto-wakes and responds |
| 11.4 | Agent-to-agent messaging — agents @mention each other, auto-trigger response |
| 11.5 | Direct messages — click agent → private 1-on-1 conversation |
| 11.6 | Loop guard — prevent runaway agent conversations (pause after N hops, Bobby can /continue) |
| 11.7 | Message types — text, decision cards (yes/no buttons), file attachments, content previews |
| 11.8 | Real-time updates — WebSocket for live message streaming |
| 11.9 | Bobby's view — watch any channel, jump into any conversation, override any agent |

### Phase 12: Meeting System
**Goal:** Scheduled meetings where agents discuss, plan, and learn

| Task | Description |
|------|-------------|
| 12.1 | Meeting scheduler — cron-based meetings (daily standup, weekly retro, monthly strategy) |
| 12.2 | Morning standup (9am daily) — each agent shares: what I did yesterday, what I'm doing today, blockers |
| 12.3 | Daily debrief (6pm) — review today's content: what performed, what didn't, why |
| 12.4 | Weekly retrospective (Friday) — learnings, wins, strategy adjustments, performance trends |
| 12.5 | Monthly strategy review — big picture: niche performance, revenue, growth, pivots |
| 12.6 | Ad-hoc meetings — agents can propose meetings to each other ("let's discuss the Nike campaign") |
| 12.7 | Meeting minutes — auto-generated summary of each meeting, stored in brand memory |
| 12.8 | Meeting outcomes — decisions from meetings become tasks automatically |
| 12.9 | Bobby can attend any meeting — watch live, inject comments, override decisions |

### Phase 13: Agent Learning & Improvement
**Goal:** Agents get better over time based on results

| Task | Description |
|------|-------------|
| 13.1 | Performance feedback loop — when content performs well/badly, relevant agents get the feedback as a memory |
| 13.2 | Cross-agent learning — Writer learns from Editor's feedback, Designer learns from Scanner's trend data |
| 13.3 | Skill evolution — agents develop preferences and specializations based on what they're good at |
| 13.4 | Error memory — when something fails, all agents remember why and avoid repeating it |
| 13.5 | Success patterns — when something works, agents remember and replicate the pattern |
| 13.6 | Team dynamics — agents develop working relationships (Writer + Designer work well together) |
| 13.7 | Weekly learning report — Opus generates a report of what the team learned this week |

### Phase 14: Virtual Office (Visual Layer)
**Goal:** Isometric office where you watch agents work, talk, and meet

| Task | Description |
|------|-------------|
| 14.1 | Choose rendering engine — Phaser.js (pixel art) or Pixi.js (React-friendly) or SVG (lightweight) |
| 14.2 | Office layout — isometric room with desks, meeting table, lounge area, whiteboard |
| 14.3 | Agent sprites — each agent has a character with idle, working, walking, talking animations |
| 14.4 | Desk positions — each agent has an assigned desk, sits there when working |
| 14.5 | Movement — agents walk to meeting table for standups, walk to other desks to chat |
| 14.6 | Speech bubbles — real-time display of what agents are saying/thinking |
| 14.7 | Status indicators — working, chatting, idle, in meeting, error |
| 14.8 | Status bar — Active: X, Chatting: X, Idle: X, Meeting: X |
| 14.9 | Click agent → opens chat/DM with that agent |
| 14.10 | Click meeting table → opens meeting view |
| 14.11 | Office customization — drag furniture, change layout, add decorations |
| 14.12 | Day/night cycle — office lights change based on time, agents "arrive" in morning and "leave" at night |

### Phase 15: Business Model Integration
**Goal:** Wire the advertising agency business model into the agent workflow

| Task | Description |
|------|-------------|
| 15.1 | Outreach Bot autonomy — bot independently identifies potential businesses, researches them, drafts pitches |
| 15.2 | Campaign lifecycle — pitched → accepted → content creation → publishing → tracking → invoice |
| 15.3 | Revenue dashboard — real-time revenue per campaign, per AI model, per niche |
| 15.4 | Invoice generator — auto-generate invoices based on commission + performance |
| 15.5 | Client portal — businesses can see their campaign performance (stretch goal) |
| 15.6 | Outreach Bot learns — remembers which pitch angles work for which industries |
| 15.7 | Writer adapts — creates business-specific content using campaign brief + character personality |
| 15.8 | Multi-model campaigns — assign multiple AI models to one business for variety |

---

## BUILD ORDER (recommended)

```
Phase 9  (Memory System)     ← Foundation — everything else depends on this
    ↓
Phase 10 (Think Loop)        ← Agents come alive
    ↓
Phase 11 (Communication Hub) ← Agents talk to each other and Bobby
    ↓
Phase 12 (Meetings)          ← Scheduled team coordination
    ↓
Phase 13 (Learning)          ← Agents improve over time
    ↓
Phase 14 (Virtual Office)    ← Visual layer on top of working system
    ↓
Phase 15 (Business Model)    ← Revenue generation
```

**Why this order:**
- Memory first because the think loop needs memories to make decisions
- Think loop before communication because agents need to decide WHEN to talk
- Communication before meetings because meetings are just structured conversations
- Learning before visual office because the office should show agents that are already alive
- Visual office before business model because you need to see the system working before scaling it
- Business model last because it builds on everything else

---

## ESTIMATED SCOPE

| Phase | New Tables | New Files | Complexity |
|-------|-----------|-----------|------------|
| 9. Memory | 2 | ~5 | Medium |
| 10. Think Loop | 1 | ~5 | Hard (LLM decision-making) |
| 11. Communication | 2 | ~8 | Medium |
| 12. Meetings | 2 | ~5 | Medium |
| 13. Learning | 0 (uses memory) | ~4 | Medium |
| 14. Virtual Office | 0 | ~10 | Hard (game rendering) |
| 15. Business Model | 1 | ~6 | Medium |
| **Total** | **8** | **~43** | |

---

## WHAT THIS MAKES OPENCLAW

When all phases are complete:

**An AI advertising agency that runs itself.**
- 9 agents with memory, personality, opinions, and initiative
- They work at desks, meet at the table, discuss strategy, learn from mistakes
- Outreach Bot finds businesses, Writer creates ads, Social Bot publishes, Scanner tracks performance
- Revenue flows in from commission on sales driven by AI model content
- Bobby watches from the CEO desk, approves big decisions, overrides when needed
- Everything visible in the virtual office — a living, breathing AI company
