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
  const agents = [
    {
      id: "agent-ideator",
      name: "Ideator",
      type: "ideator",
      status: "offline" as const,
      personality: "Creative strategist that identifies viral content opportunities. Analyzes trends across TikTok, Instagram, YouTube, and Twitter to generate content ideas.",
      currentTask: null as string | null,
      config: { capabilities: ["trend-scanning", "idea-generation", "content-calendar", "audience-analysis"] },
    },
    {
      id: "agent-writer",
      name: "Writer",
      type: "writer",
      status: "offline" as const,
      personality: "Versatile copywriter that adapts tone per platform. Writes video scripts, captions, blog posts, and engagement replies.",
      currentTask: null as string | null,
      config: { capabilities: ["script-writing", "caption-generation", "blog-posts", "tone-adaptation"] },
    },
    {
      id: "agent-designer",
      name: "Designer",
      type: "designer",
      status: "offline" as const,
      personality: "Visual artist specializing in character-consistent image generation using reference images.",
      currentTask: null as string | null,
      config: { capabilities: ["image-generation", "character-consistency", "scene-composition", "thumbnails"] },
    },
    {
      id: "agent-filmmaker",
      name: "Filmmaker",
      type: "filmmaker",
      status: "offline" as const,
      personality: "Video producer using first/last frame guidance for short-form vertical video.",
      currentTask: null as string | null,
      config: { capabilities: ["video-generation", "frame-guidance", "character-refs", "vertical-video"] },
    },
    {
      id: "agent-editor",
      name: "Editor",
      type: "editor",
      status: "offline" as const,
      personality: "Quality control specialist. Reviews content (scores 1-10), triggers voiceover, runs assembly, manages the quality gate.",
      currentTask: null as string | null,
      config: { capabilities: ["quality-review", "voiceover", "video-assembly", "quality-gate"] },
    },
    {
      id: "agent-social-bot",
      name: "Social Bot",
      type: "social",
      status: "offline" as const,
      personality: "Post publisher that handles scheduling, optimal timing, and rate limiting across all platforms via Chrome automation.",
      currentTask: null as string | null,
      config: { capabilities: ["chrome-posting", "scheduling", "rate-limiting", "multi-platform"] },
    },
    {
      id: "agent-engage-bot",
      name: "Engage Bot",
      type: "engage",
      status: "offline" as const,
      personality: "Community manager maintaining brand voice. Monitors mentions, responds to comments, manages conversations.",
      currentTask: null as string | null,
      config: { capabilities: ["mention-monitoring", "auto-reply", "conversation-management", "sentiment-analysis"] },
    },
    {
      id: "agent-scanner",
      name: "Scanner",
      type: "scanner",
      status: "offline" as const,
      personality: "Continuous monitoring agent for social media trends, competitor activity, and viral content detection.",
      currentTask: null as string | null,
      config: { capabilities: ["trend-monitoring", "competitor-analysis", "viral-detection", "hashtag-tracking"] },
    },
    {
      id: "agent-outreach",
      name: "Outreach Bot",
      type: "outreach",
      status: "offline" as const,
      personality: "B2B sales agent that identifies businesses, crafts personalized cold outreach, and manages the sales pipeline for AI influencer advertising deals.",
      currentTask: null as string | null,
      config: { capabilities: ["cold-outreach", "pitch-generation", "follow-up", "lead-qualification"] },
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
