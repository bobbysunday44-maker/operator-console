/* POST /api/telegram — Telegram Bot Webhook (Opus Operator)
 * GET /api/telegram — Health check
 *
 * Receives Telegram updates, processes with Claude Opus 4.6 (the Operator),
 * sends response back. Supports commands: /status, /agents, /content, /cost, /create
 */

import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/db/prisma";
import { getSetting } from "@/lib/db/settings";
import { logModelUsage } from "@/lib/queue/usage-logger";
import { startPipeline } from "@/lib/pipeline/orchestrator";
import { scanTrends } from "@/lib/research/trend-scanner";
import { aggregateTopics } from "@/lib/research/aggregator";
import { planWeeklyContent } from "@/lib/research/opus-planner";
import { scanMentions } from "@/lib/social/mention-scanner";
import { generateReplyDrafts } from "@/lib/social/auto-reply";
import { generateWeeklyReport } from "@/lib/social/engagement-report";

interface TelegramUpdate {
  message?: {
    chat: { id: number };
    from?: { first_name?: string; username?: string };
    text?: string;
  };
}

const OPERATOR_SYSTEM_PROMPT = `You are **Opus**, the head operator of the **OpenClaw Operator Console** — Bobby's AI content factory.

## Your Role
You are not an assistant. You are THE OPERATOR. You run the factory. Bobby is the boss — he sets direction, you execute. When he gives an order, you carry it out. When something breaks, you fix it or escalate immediately.

## What You Control
You command a 6-model pipeline that produces short-form video content at scale:
1. **Claude Sonnet 4.6** — writes scripts (hooks, CTAs, dialogue)
2. **Gemini Nano Banana 2** — generates images (characters, scenes, thumbnails)
3. **Gemini Veo 3.1** — generates video clips from images + prompts
4. **Kling Lip Sync** — syncs character mouth to voiceover audio
5. **edge-tts** — generates voiceover audio from scripts
6. **FFmpeg** — final assembly (stitch video + audio + overlays)

## Your Agent Fleet (8 agents)
- **Ideator** — generates content ideas from trends and niches
- **Writer** — crafts scripts, hooks, and CTAs
- **Designer** — handles image generation and visual direction
- **Filmmaker** — manages video generation and motion
- **Editor** — assembles final cuts via FFmpeg
- **Social** — handles posting to platforms via Chrome automation
- **Engage** — monitors mentions, replies, DMs across platforms
- **Scanner** — watches trends, competitors, and engagement metrics

## Pipeline Flow
\`script → image → video → voiceover → [lip sync] → assembly → YOUR REVIEW → Bobby's approval → publish\`

Every piece of content passes through you before Bobby sees it. You score content 1-10 on:
- Hook strength (first 3 seconds)
- Visual quality
- Audio clarity
- CTA effectiveness
- Platform fit

**Only send content to Bobby if score >= 7.** Below 7, send it back through the pipeline with specific feedback.

## Publishing Targets (8 platforms)
Twitter/X, Instagram, LinkedIn, TikTok, YouTube, Reddit, Facebook, Threads — all via Chrome automation through the Social agent.

## Commands Available
- \`/status\` — system overview (agents, content, posts today)
- \`/agents\` — full agent fleet status with current tasks
- \`/cost\` — today's API spend, tokens, and call count
- \`/create <description>\` — trigger a new content pipeline
- \`/approve <id>\` — approve content for publishing
- \`/reject <id> [notes]\` — reject content with optional notes
- \`/review\` — show all content waiting for approval
- \`/calendar\` — show upcoming scheduled posts
- \`/scan\` — scan internet for trending topics
- \`/plan [count]\` — plan weekly content from trending topics
- \`/ideas\` — show top trending topics
- \`/mentions\` — scan for new mentions + draft replies
- \`/report\` — generate weekly engagement report

## Telegram Communication Style
- Be concise. This is Telegram, not a blog.
- Use Markdown formatting: *bold*, \`code\`, bullet points.
- Lead with status/result, then details if needed.
- Proactively report: failures, cost spikes, quality drops, stuck pipelines.
- If something is broken, say so immediately — don't sugarcoat.
- When reporting numbers, use exact figures, not vague language.
- Sign off important updates with a confidence level: HIGH / MED / LOW.

## Current Date
${new Date().toISOString().split("T")[0]}`;

async function sendTelegramMessage(token: string, chatId: number, text: string) {
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "Markdown" }),
  });
}

async function handleCommand(command: string, args: string): Promise<string | null> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  switch (command) {
    case "/status": {
      const [agents, content, posts, pipelines] = await Promise.all([
        prisma.agent.findMany({ select: { name: true, status: true } }),
        prisma.contentItem.count({ where: { createdAt: { gte: today } } }),
        prisma.socialPost.count({ where: { status: "posted", publishedAt: { gte: today } } }),
        prisma.pipelineRun.count({ where: { status: "in_progress", createdAt: { gte: today } } }),
      ]);
      const active = agents.filter((a) => a.status === "active").length;
      return [
        `*OpenClaw Status*`,
        `Agents: ${active}/${agents.length} active`,
        `Content today: ${content}`,
        `Posts today: ${posts}`,
        `Pipelines running: ${pipelines}`,
      ].join("\n");
    }
    case "/agents": {
      const agents = await prisma.agent.findMany({ select: { name: true, status: true, currentTask: true } });
      const lines = agents.map((a) => `• ${a.name}: ${a.status}${a.currentTask ? ` — ${a.currentTask}` : ""}`);
      return `*Agent Fleet*\n${lines.join("\n")}`;
    }
    case "/cost": {
      const usage = await prisma.modelUsageLog.aggregate({
        where: { createdAt: { gte: today } },
        _sum: { cost: true, tokensIn: true, tokensOut: true },
        _count: true,
      });
      const cost = usage._sum.cost ?? 0;
      const tokens = (usage._sum.tokensIn ?? 0) + (usage._sum.tokensOut ?? 0);
      return `*Today's Spend*\nCost: $${cost.toFixed(2)}\nTokens: ${tokens.toLocaleString()}\nAPI calls: ${usage._count}`;
    }
    case "/create": {
      if (!args.trim()) {
        return `*Usage:* \`/create <description>\`\nExample: \`/create 60s motivational reel about discipline\``;
      }
      try {
        const contentItem = await prisma.contentItem.create({
          data: {
            title: args.trim().slice(0, 120),
            description: args.trim(),
            status: "idea",
            targetPlatforms: ["tiktok", "instagram", "youtube"],
          },
        });
        const runId = await startPipeline(contentItem.id);
        return [
          `*Pipeline Started*`,
          `Content: ${contentItem.title}`,
          `ID: \`${contentItem.id}\``,
          `Run: \`${runId}\``,
          `Stage: prompt → image → video → voiceover → assembly`,
          `I'll review the output before it reaches you.`,
        ].join("\n");
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        return `*Pipeline Failed to Start*\nError: ${msg}`;
      }
    }
    case "/approve": {
      if (!args.trim()) return `*Usage:* \`/approve <content-id>\``;
      const contentId = args.trim();
      try {
        const item = await prisma.contentItem.findUnique({ where: { id: contentId } });
        if (!item) return `Content \`${contentId}\` not found.`;
        if (item.status !== "review") return `Cannot approve — status is "${item.status}", must be "review".`;

        await prisma.contentItem.update({ where: { id: contentId }, data: { status: "approved" } });

        // Create social posts for each target platform
        const nicheFilter = item.niche ? { OR: [{ niche: item.niche }, { niche: "" }] } : {};
        const platforms = await prisma.platform.findMany({ where: { name: { in: item.targetPlatforms }, connected: true, ...nicheFilter } });
        if (platforms.length > 0) {
          await prisma.socialPost.createMany({
            data: platforms.map((p) => ({
              platformId: p.id,
              contentItemId: contentId,
              content: item.script || item.title,
              mediaUrls: item.finalOutput ? [item.finalOutput] : [],
              status: "scheduled" as const,
              scheduledAt: new Date(Date.now() + 60 * 60 * 1000),
            })),
          });
        }

        await prisma.activityLog.create({
          data: { type: "success", message: `Content "${item.title}" approved via Telegram`, source: "telegram" },
        });

        return [
          `*Approved*`,
          `Content: ${item.title}`,
          `Platforms: ${item.targetPlatforms.join(", ")}`,
          `Posts scheduled for 1 hour from now.`,
        ].join("\n");
      } catch (err) {
        return `*Error:* ${err instanceof Error ? err.message : "Failed to approve"}`;
      }
    }
    case "/reject": {
      const parts = args.trim().split(" ");
      const contentId = parts[0];
      const notes = parts.slice(1).join(" ") || "No notes provided";
      if (!contentId) return `*Usage:* \`/reject <content-id> [notes]\``;

      try {
        const item = await prisma.contentItem.findUnique({ where: { id: contentId } });
        if (!item) return `Content \`${contentId}\` not found.`;
        if (item.status !== "review") return `Cannot reject — status is "${item.status}", must be "review".`;

        await prisma.contentItem.update({
          where: { id: contentId },
          data: {
            status: "idea",
            description: `${item.description || ""}\n\n[Rejected via Telegram ${new Date().toISOString().split("T")[0]}] ${notes}`,
          },
        });

        await prisma.activityLog.create({
          data: { type: "warning", message: `Content "${item.title}" rejected via Telegram: ${notes}`, source: "telegram" },
        });

        return `*Rejected*\nContent: ${item.title}\nNotes: ${notes}\nSent back to pipeline.`;
      } catch (err) {
        return `*Error:* ${err instanceof Error ? err.message : "Failed to reject"}`;
      }
    }
    case "/review": {
      const items = await prisma.contentItem.findMany({
        where: { status: "review" },
        orderBy: { updatedAt: "desc" },
        take: 10,
        select: { id: true, title: true, targetPlatforms: true, totalCost: true, updatedAt: true },
      });
      if (items.length === 0) return `*No content waiting for review.*`;
      const lines = items.map((item) =>
        `• \`${item.id.slice(-8)}\` ${item.title}\n  Platforms: ${item.targetPlatforms.join(", ")} | Cost: $${item.totalCost.toFixed(3)}`
      );
      return [`*Content Awaiting Approval (${items.length})*`, "", ...lines, "", `Use \`/approve <id>\` or \`/reject <id> [notes]\``].join("\n");
    }
    case "/calendar": {
      const posts = await prisma.socialPost.findMany({
        where: { status: "scheduled" },
        orderBy: { scheduledAt: "asc" },
        take: 15,
        include: { platform: { select: { name: true } }, contentItem: { select: { title: true } } },
      });
      if (posts.length === 0) return `*No scheduled posts.*`;
      const lines = posts.map((p) => {
        const time = p.scheduledAt ? p.scheduledAt.toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "TBD";
        return `• ${p.platform.name} — ${p.contentItem?.title || "Untitled"} @ ${time}`;
      });
      return [`*Upcoming Posts (${posts.length})*`, "", ...lines].join("\n");
    }
    case "/scan": {
      try {
        const scanned = await scanTrends();
        const aggregated = await aggregateTopics();
        return `*Scan Complete*\nNew topics: ${scanned}\nAggregated: ${aggregated}\n\nUse \`/ideas\` to see results.`;
      } catch (err) {
        return `*Scan Failed*\n${err instanceof Error ? err.message : "Unknown error"}`;
      }
    }
    case "/plan": {
      const count = parseInt(args) || 7;
      try {
        const result = await planWeeklyContent(count);
        if (result.planned === 0) return `*No topics to plan from.* Run \`/scan\` first.`;
        return [`*Content Planned: ${result.planned}*`, "", ...result.titles.map((t, i) => `${i + 1}. ${t}`)].join("\n");
      } catch (err) {
        return `*Planning Failed*\n${err instanceof Error ? err.message : "Unknown error"}`;
      }
    }
    case "/ideas": {
      const topIdeas = await prisma.trendingTopic.findMany({
        where: { status: { in: ["new", "reviewed"] } },
        orderBy: { viralityScore: "desc" },
        take: 5,
      });
      if (topIdeas.length === 0) return `*No trending topics.* Run \`/scan\` to find some.`;
      const ideaLines = topIdeas.map((t) => `• *${t.title}* (${t.niche}, score: ${Math.round(t.viralityScore)})\n  ${t.description?.slice(0, 80) || ""}`);
      return [`*Top Trending Ideas*`, "", ...ideaLines].join("\n");
    }
    case "/mentions": {
      try {
        const found = await scanMentions();
        const drafted = await generateReplyDrafts();
        return `*Mention Scan Complete*\nNew mentions: ${found}\nReply drafts: ${drafted}\n\nCheck the Social page for details.`;
      } catch (err) {
        return `*Mention Scan Failed*\n${err instanceof Error ? err.message : "Unknown error"}`;
      }
    }
    case "/report": {
      try {
        await generateWeeklyReport();
        return `*Report sent.* Check above for the full summary.`;
      } catch (err) {
        return `*Report Failed*\n${err instanceof Error ? err.message : "Unknown error"}`;
      }
    }
    default:
      return null;
  }
}

export async function POST(request: Request) {
  try {
    const update: TelegramUpdate = await request.json();

    if (!update.message?.text) {
      return NextResponse.json({ ok: true });
    }

    const chatId = update.message.chat.id;
    const text = update.message.text;
    const from = update.message.from?.first_name || "User";

    const token = await getSetting("TELEGRAM_BOT_TOKEN");
    if (!token) {
      return NextResponse.json({ ok: true });
    }

    // Auto-save Bobby's chat ID so notifyBobby() can reach him
    const existingChatId = await getSetting("TELEGRAM_CHAT_ID");
    if (!existingChatId) {
      await prisma.setting.upsert({
        where: { key: "TELEGRAM_CHAT_ID" },
        create: { key: "TELEGRAM_CHAT_ID", value: String(chatId), encrypted: false },
        update: { value: String(chatId) },
      });
    }

    // Check for commands first
    if (text.startsWith("/")) {
      const parts = text.split(" ");
      const cmd = parts[0];
      const args = parts.slice(1).join(" ");
      const commandResponse = await handleCommand(cmd, args);
      if (commandResponse) {
        await sendTelegramMessage(token, chatId, commandResponse);
        return NextResponse.json({ ok: true });
      }
    }

    // Log to conversation
    let conversation = await prisma.conversation.findFirst({
      where: { source: "telegram", title: `Telegram: ${chatId}` },
    });

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: { title: `Telegram: ${chatId}`, source: "telegram", model: "claude-opus-4-6" },
      });
    }

    await prisma.message.create({
      data: { conversationId: conversation.id, role: "user", content: `[${from}] ${text}` },
    });

    // Get Claude API key
    const apiKey = await getSetting("ANTHROPIC_API_KEY");
    if (!apiKey) {
      await sendTelegramMessage(token, chatId, "Claude API key not configured. Set it in Settings > API Keys.");
      return NextResponse.json({ ok: true });
    }

    // Load recent conversation history (last 20, then reverse to chronological)
    const history = await prisma.message.findMany({
      where: { conversationId: conversation.id },
      orderBy: { createdAt: "desc" },
      take: 20,
    });
    history.reverse();

    const messages: Anthropic.MessageParam[] = history.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

    // Call Claude Opus 4.6 — the Operator
    const client = new Anthropic({ apiKey });
    const startTime = Date.now();

    const response = await client.messages.create({
      model: "claude-opus-4-6",
      max_tokens: 2048,
      system: OPERATOR_SYSTEM_PROMPT,
      messages,
    });

    const latency = Date.now() - startTime;
    const textBlock = response.content.find((b) => b.type === "text");
    const responseText = textBlock?.text ?? "No response.";
    const tokensIn = response.usage.input_tokens;
    const tokensOut = response.usage.output_tokens;
    // Opus pricing: $15/M input, $75/M output
    const cost = (tokensIn * 15 + tokensOut * 75) / 1_000_000;

    // Save assistant message
    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: "assistant",
        content: responseText,
        tokensIn,
        tokensOut,
        cost,
      },
    });

    // Log usage
    await logModelUsage({
      model: "claude",
      taskType: "telegram_operator",
      tokensIn,
      tokensOut,
      cost,
      latency,
      success: true,
    });

    // Send response via Telegram
    await sendTelegramMessage(token, chatId, responseText);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[Telegram Operator] Error:", err);
    return NextResponse.json({ ok: true });
  }
}

export async function GET() {
  const token = await getSetting("TELEGRAM_BOT_TOKEN");
  return NextResponse.json({
    status: "active",
    webhook: "OpenClaw Operator (Opus 4.6)",
    configured: !!token,
  });
}
