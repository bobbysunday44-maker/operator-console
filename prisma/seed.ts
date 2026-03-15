/* ── OpenClaw Database Seed ──
 * Seeds agents, model routes, platforms, and initial settings.
 * Run with: npx tsx prisma/seed.ts
 */

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import "dotenv/config";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding OpenClaw database...");

  // ── 1. Seed Agents (8 from master plan) ──
  const agents = [
    {
      id: "agent-ideator",
      name: "Ideator",
      type: "ideator",
      status: "active" as const,
      personality: "Creative strategist that identifies viral content opportunities. Analyzes trends across TikTok, Instagram, YouTube, and Twitter to generate content ideas.",
      currentTask: "Scanning TikTok trends",
      config: { capabilities: ["trend-scanning", "idea-generation", "content-calendar", "audience-analysis"] },
    },
    {
      id: "agent-writer",
      name: "Writer",
      type: "writer",
      status: "active" as const,
      personality: "Versatile copywriter that adapts tone per platform. Writes video scripts, captions, blog posts, and engagement replies.",
      currentTask: "Writing TikTok script #CNT-0048",
      config: { capabilities: ["script-writing", "caption-generation", "blog-posts", "tone-adaptation"] },
    },
    {
      id: "agent-designer",
      name: "Designer",
      type: "designer",
      status: "active" as const,
      personality: "Visual artist specializing in character-consistent image generation using reference images.",
      currentTask: null,
      config: { capabilities: ["image-generation", "character-consistency", "scene-composition", "thumbnails"] },
    },
    {
      id: "agent-filmmaker",
      name: "Filmmaker",
      type: "filmmaker",
      status: "active" as const,
      personality: "Video producer using first/last frame guidance for short-form vertical video.",
      currentTask: null,
      config: { capabilities: ["video-generation", "frame-guidance", "character-refs", "vertical-video"] },
    },
    {
      id: "agent-editor",
      name: "Editor",
      type: "editor",
      status: "offline" as const,
      personality: "Quality control specialist. Reviews content (scores 1-10), triggers voiceover, runs assembly, manages the quality gate.",
      currentTask: null,
      config: { capabilities: ["quality-review", "voiceover", "video-assembly", "quality-gate"] },
    },
    {
      id: "agent-social-bot",
      name: "Social Bot",
      type: "social",
      status: "active" as const,
      personality: "Post publisher that handles scheduling, optimal timing, and rate limiting across all platforms via Chrome automation.",
      currentTask: "Posting to Instagram @digitalcreator",
      config: { capabilities: ["chrome-posting", "scheduling", "rate-limiting", "multi-platform"] },
    },
    {
      id: "agent-engage-bot",
      name: "Engage Bot",
      type: "engage",
      status: "active" as const,
      personality: "Community manager maintaining brand voice. Monitors mentions, responds to comments, manages conversations.",
      currentTask: "Replying to 3 Twitter mentions",
      config: { capabilities: ["mention-monitoring", "auto-reply", "conversation-management", "sentiment-analysis"] },
    },
    {
      id: "agent-scanner",
      name: "Scanner",
      type: "scanner",
      status: "active" as const,
      personality: "Continuous monitoring agent for social media trends, competitor activity, and viral content detection.",
      currentTask: "Monitoring trending hashtags",
      config: { capabilities: ["trend-monitoring", "competitor-analysis", "viral-detection", "hashtag-tracking"] },
    },
  ];

  for (const agent of agents) {
    await prisma.agent.upsert({
      where: { id: agent.id },
      update: agent,
      create: { ...agent, lastHeartbeat: new Date() },
    });
  }
  console.log(`  ✓ ${agents.length} agents seeded`);

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
    { taskType: "voiceover", modelName: "edge_tts" as const, priority: 1, enabled: true },
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

  // ── 3. Seed Platforms ──
  const platforms = [
    { name: "Twitter/X", handle: "openclaw_ai", connected: true, followers: 2400 },
    { name: "Instagram", handle: "openclaw.ai", connected: true, followers: 1100 },
    { name: "LinkedIn", handle: "openclaw", connected: true, followers: 890 },
    { name: "TikTok", handle: "openclaw_ai", connected: true, followers: 1200 },
    { name: "YouTube", handle: "OpenClawAI", connected: true, followers: 340 },
    { name: "Reddit", handle: "openclaw_bot", connected: true, followers: 580 },
    { name: "Facebook", handle: "openclaw", connected: false, followers: 0 },
    { name: "Threads", handle: "openclaw", connected: false, followers: 0 },
  ];

  for (const p of platforms) {
    await prisma.platform.upsert({
      where: { name_handle: { name: p.name, handle: p.handle } },
      update: p,
      create: p,
    });
  }
  console.log(`  ✓ ${platforms.length} platforms seeded`);

  // ── 4. Seed Initial Activity Log ──
  const activities = [
    { type: "info", message: "OpenClaw platform initialized", source: "system" },
    { type: "success", message: "All 8 agents registered and ready", source: "system" },
    { type: "success", message: "PostgreSQL database connected", source: "system" },
    { type: "success", message: "Redis connected on port 6380", source: "system" },
    { type: "info", message: "Model routing configured (v3.1 — Claude Sonnet only)", source: "system" },
  ];

  await prisma.activityLog.createMany({ data: activities });
  console.log(`  ✓ ${activities.length} activity log entries seeded`);

  // ── 5. Seed Characters ──
  const characters = [
    { name: "Nova", description: "Robot assistant with blue LED eyes", stylePrompt: "Sleek humanoid robot, blue LED eyes, metallic silver body, futuristic design", niche: "tech", referenceImages: [] as string[] },
    { name: "Alex", description: "Young creator, streetwear style", stylePrompt: "Young person, streetwear style, vibrant colors, urban background, Gen-Z aesthetic", niche: "lifestyle", referenceImages: [] as string[] },
  ];

  for (const c of characters) {
    await prisma.character.upsert({
      where: { id: c.name.toLowerCase() },
      update: c,
      create: { id: c.name.toLowerCase(), ...c, isActive: true },
    });
  }
  console.log(`  ✓ ${characters.length} characters seeded`);

  // ── 6. Seed Sample Content with Pipeline Runs ──
  const sampleContent = await prisma.contentItem.upsert({
    where: { id: "cnt-demo-001" },
    update: {},
    create: {
      id: "cnt-demo-001",
      title: "AI Agents Automate Your Social Media",
      description: "Short-form video about AI agents managing social media platforms autonomously",
      niche: "tech",
      tags: ["TikTok", "AI", "automation", "trending"],
      targetPlatforms: ["TikTok", "Instagram", "Twitter/X"],
      status: "filming",
      qualityTier: "ai_reviewer",
      totalCost: 0.055,
      script: 'POV: your AI agent just posted to 6 platforms while you were sleeping 🤖✨ #AIautomation #ContentCreator',
    },
  });

  // Pipeline runs for the demo content
  const pipelineRuns = [
    {
      contentItemId: sampleContent.id,
      stage: "prompt" as const,
      model: "claude" as const,
      status: "completed" as const,
      inputPrompt: "Create a TikTok post about AI agents automating social media. Trendy, Gen-Z tone, hook in first 2 seconds.",
      outputPreview: 'Image prompt: "A sleek robot hand scrolling through a phone showing Instagram, TikTok, Twitter feeds. Neon glow, dark background, cinematic lighting, 8K detail."',
      tokensIn: 124,
      tokensOut: 287,
      cost: 0.003,
      duration: 2100,
      completedAt: new Date(),
    },
    {
      contentItemId: sampleContent.id,
      stage: "image" as const,
      model: "gemini_nano_banana" as const,
      status: "completed" as const,
      inputPrompt: "A sleek robot hand scrolling through a phone showing Instagram, TikTok, Twitter feeds. Neon glow, dark background, cinematic lighting, 8K detail.",
      outputPath: "/outputs/cnt-demo-001/image_001.png",
      tokensIn: null,
      tokensOut: null,
      cost: 0.002,
      duration: 4800,
      completedAt: new Date(),
    },
    {
      contentItemId: sampleContent.id,
      stage: "video" as const,
      model: "gemini_veo" as const,
      status: "in_progress" as const,
      inputPrompt: "Camera slowly zooms into a phone screen where AI agents are posting content autonomously. Glitch effects, fast cuts, trending audio vibe.",
      cost: 0.05,
      duration: null,
      completedAt: null,
    },
  ];

  // Delete existing runs for idempotent seeding
  await prisma.pipelineRun.deleteMany({ where: { contentItemId: sampleContent.id } });
  for (const run of pipelineRuns) {
    await prisma.pipelineRun.create({ data: run });
  }
  console.log(`  ✓ Sample content + ${pipelineRuns.length} pipeline runs seeded`);

  console.log("\nDone! OpenClaw database is ready.");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
