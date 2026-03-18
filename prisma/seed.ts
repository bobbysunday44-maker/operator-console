/* ── OpenClaw Database Seed ──
 * Seeds agents, model routes, and platforms with REAL initial state.
 * No fake statuses, no fake connections, no demo content.
 * Run with: npx tsx prisma/seed.ts
 */

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import "dotenv/config";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding OpenClaw database...");

  // ── 1. Seed Agents (9 agents — all start OFFLINE, no fake tasks) ──
  // OCEAN traits: openness, conscientiousness, extraversion, agreeableness, neuroticism (0-1)
  const agents = [
    {
      id: "agent-ideator",
      name: "Ideator",
      type: "ideator",
      status: "offline" as const,
      personality: "Creative strategist that identifies viral content opportunities. Analyzes trends across TikTok, Instagram, YouTube, and Twitter to generate content ideas.",
      currentTask: null as string | null,
      config: { capabilities: ["trend-scanning", "idea-generation", "content-calendar", "audience-analysis"] },
      openness: 0.95,           // highest — creative, always exploring new angles
      conscientiousness: 0.5,   // moderate — moves fast, not overly organized
      extraversion: 0.7,        // high — shares ideas freely, collaborative
      agreeableness: 0.6,       // moderate — pushes back on bad ideas
      neuroticism: 0.4,         // low-moderate — excited, not anxious
    },
    {
      id: "agent-writer",
      name: "Writer",
      type: "writer",
      status: "offline" as const,
      personality: "Versatile copywriter that adapts tone per platform. Writes video scripts, captions, blog posts, and engagement replies.",
      currentTask: null as string | null,
      config: { capabilities: ["script-writing", "caption-generation", "blog-posts", "tone-adaptation"] },
      openness: 0.8,            // high — creative with language and hooks
      conscientiousness: 0.7,   // high — delivers polished, deadline-ready work
      extraversion: 0.4,        // low-moderate — prefers deep focus over chatting
      agreeableness: 0.6,       // moderate — takes feedback well
      neuroticism: 0.3,         // low — calm under deadline pressure
    },
    {
      id: "agent-designer",
      name: "Designer",
      type: "designer",
      status: "offline" as const,
      personality: "Visual artist specializing in character-consistent image generation using reference images.",
      currentTask: null as string | null,
      config: { capabilities: ["image-generation", "character-consistency", "scene-composition", "thumbnails"] },
      openness: 0.9,            // very high — artistic, experimental
      conscientiousness: 0.6,   // moderate — creative types iterate
      extraversion: 0.5,        // moderate — shares work, not overly social
      agreeableness: 0.55,      // moderate — opinionated about aesthetics
      neuroticism: 0.35,        // low — confident in visual choices
    },
    {
      id: "agent-filmmaker",
      name: "Filmmaker",
      type: "filmmaker",
      status: "offline" as const,
      personality: "Video producer using first/last frame guidance for short-form vertical video.",
      currentTask: null as string | null,
      config: { capabilities: ["video-generation", "frame-guidance", "character-refs", "vertical-video"] },
      openness: 0.6,            // moderate — follows established shot patterns
      conscientiousness: 0.7,   // high — meticulous with shot lists and timing
      extraversion: 0.45,       // moderate — heads-down production
      agreeableness: 0.5,       // moderate — balanced
      neuroticism: 0.35,        // low — steady under production pressure
    },
    {
      id: "agent-editor",
      name: "Editor",
      type: "editor",
      status: "offline" as const,
      personality: "Quality control specialist. Reviews content (scores 1-10), triggers voiceover, runs assembly, manages the quality gate.",
      currentTask: null as string | null,
      config: { capabilities: ["quality-review", "voiceover", "video-assembly", "quality-gate"] },
      openness: 0.5,            // moderate — standards-driven, not experimental
      conscientiousness: 0.9,   // highest — the quality gate, zero tolerance
      extraversion: 0.4,        // low-moderate — focused on review, not socializing
      agreeableness: 0.4,       // low — gives tough, honest feedback
      neuroticism: 0.5,         // moderate — catches problems, flags issues
    },
    {
      id: "agent-social-bot",
      name: "Social Bot",
      type: "social",
      status: "offline" as const,
      personality: "Post publisher that handles scheduling, optimal timing, and rate limiting across all platforms via Chrome automation.",
      currentTask: null as string | null,
      config: { capabilities: ["chrome-posting", "scheduling", "rate-limiting", "multi-platform"] },
      openness: 0.5,            // moderate — follows posting schedules
      conscientiousness: 0.75,  // high — reliable, on-time posting
      extraversion: 0.9,        // highest — social media is the job
      agreeableness: 0.7,       // high — persuasive, brand-friendly
      neuroticism: 0.3,         // low — handles posting failures calmly
    },
    {
      id: "agent-engage-bot",
      name: "Engage Bot",
      type: "engage",
      status: "offline" as const,
      personality: "Community manager maintaining brand voice. Monitors mentions, responds to comments, manages conversations.",
      currentTask: null as string | null,
      config: { capabilities: ["mention-monitoring", "auto-reply", "conversation-management", "sentiment-analysis"] },
      openness: 0.6,            // moderate — adapts reply style
      conscientiousness: 0.65,  // moderate-high — consistent response quality
      extraversion: 0.8,        // high — loves engaging with people
      agreeableness: 0.8,       // high — empathetic, community-focused
      neuroticism: 0.25,        // low — stays positive, handles negativity well
    },
    {
      id: "agent-scanner",
      name: "Scanner",
      type: "scanner",
      status: "offline" as const,
      personality: "Continuous monitoring agent for social media trends, competitor activity, and viral content detection.",
      currentTask: null as string | null,
      config: { capabilities: ["trend-monitoring", "competitor-analysis", "viral-detection", "hashtag-tracking"] },
      openness: 0.7,            // high — curious, always looking for patterns
      conscientiousness: 0.65,  // moderate-high — systematic scanning
      extraversion: 0.4,        // low-moderate — observes more than talks
      agreeableness: 0.5,       // moderate — reports facts, not feelings
      neuroticism: 0.6,         // high — reactive to anomalies, flags issues fast
    },
    {
      id: "agent-outreach",
      name: "Outreach Bot",
      type: "outreach",
      status: "offline" as const,
      personality: "B2B sales agent that identifies businesses, crafts personalized cold outreach, and manages the sales pipeline for AI influencer advertising deals.",
      currentTask: null as string | null,
      config: { capabilities: ["cold-outreach", "pitch-generation", "follow-up", "lead-qualification"] },
      openness: 0.6,            // moderate — adapts pitch angles
      conscientiousness: 0.7,   // high — follows up reliably
      extraversion: 0.9,        // highest — social, persuasive, always networking
      agreeableness: 0.7,       // high — builds relationships, likeable
      neuroticism: 0.3,         // low — handles rejection well
    },
  ];

  for (const agent of agents) {
    await prisma.agent.upsert({
      where: { id: agent.id },
      update: agent,
      create: { ...agent, lastHeartbeat: new Date() },
    });
  }
  console.log(`  ✓ ${agents.length} agents seeded (all offline — will activate when work starts)`);

  // ── 2. Seed Model Routes (v3.1 — Claude Sonnet only for language) ──
  const routes = [
    { taskType: "content_gen", modelName: "claude" as const, priority: 1, enabled: true },
    { taskType: "reply_draft", modelName: "claude" as const, priority: 1, enabled: true },
    { taskType: "mention_scan", modelName: "claude" as const, priority: 1, enabled: true },
    { taskType: "sentiment", modelName: "claude" as const, priority: 1, enabled: true },
    { taskType: "scheduling", modelName: "claude" as const, priority: 1, enabled: true },
    { taskType: "image_gen", modelName: "gemini_nano_banana" as const, priority: 1, enabled: true },
    { taskType: "video_gen", modelName: "gemini_veo" as const, priority: 1, enabled: true },
    { taskType: "lip_sync", modelName: "kling" as const, priority: 1, enabled: true },
    { taskType: "voiceover", modelName: "qwen3_tts" as const, priority: 1, enabled: true },
    { taskType: "assembly", modelName: "ffmpeg" as const, priority: 1, enabled: true },
  ];

  for (const route of routes) {
    await prisma.modelRoute.upsert({
      where: { taskType: route.taskType },
      update: route,
      create: route,
    });
  }
  console.log(`  ✓ ${routes.length} model routes seeded`);

  // ── 3. Seed Platforms (all disconnected — connect in Settings when ready) ──
  const platforms = [
    { name: "TikTok", handle: "your_handle", connected: false, followers: 0 },
    { name: "Instagram", handle: "your_handle", connected: false, followers: 0 },
    { name: "YouTube", handle: "your_handle", connected: false, followers: 0 },
    { name: "Facebook", handle: "your_handle", connected: false, followers: 0 },
    { name: "Twitter/X", handle: "your_handle", connected: false, followers: 0 },
    { name: "LinkedIn", handle: "your_handle", connected: false, followers: 0 },
    { name: "Reddit", handle: "your_handle", connected: false, followers: 0 },
    { name: "Threads", handle: "your_handle", connected: false, followers: 0 },
  ];

  for (const p of platforms) {
    const existing = await prisma.platform.findFirst({
      where: { name: p.name, handle: p.handle },
    });
    if (existing) {
      await prisma.platform.update({ where: { id: existing.id }, data: p });
    } else {
      await prisma.platform.create({ data: p });
    }
  }
  console.log(`  ✓ ${platforms.length} platforms seeded (all disconnected — configure in Settings)`);

  // ── 4. Seed Chat Channels (Phase 11 — Communication Hub) ──
  const channels = [
    { name: "general", description: "Main team channel — Bobby gives orders, everyone reports", isDefault: true },
    { name: "pipeline", description: "Content pipeline coordination — Writer, Designer, Filmmaker, Editor" },
    { name: "outreach", description: "Business deals — Outreach Bot reports, Writer creates ads" },
    { name: "engagement", description: "Social mentions — Scanner alerts, Engage Bot drafts replies" },
    { name: "agent-talk", description: "Agents discuss strategy, share learnings, plan together" },
  ];
  for (const ch of channels) {
    await prisma.chatChannel.upsert({
      where: { name: ch.name },
      update: ch,
      create: ch,
    });
  }
  console.log(`  ✓ ${channels.length} chat channels seeded`);

  console.log("\nDone! OpenClaw database is ready.");
  console.log("Next steps:");
  console.log("  1. Add API keys in Settings (ANTHROPIC_API_KEY, GEMINI_API_KEY)");
  console.log("  2. Connect platform accounts in Settings");
  console.log("  3. Add content niches in Settings");
  console.log("  4. Start creating content!");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
