/* ── Opus Weekly Content Planner ──
 * Opus reads top trending topics, picks the best ones,
 * and creates content items for the pipeline.
 */

import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/db/prisma";
import { getRequiredSetting } from "@/lib/db/settings";
import { logModelUsage } from "@/lib/queue/usage-logger";
import { eventBus } from "@/lib/events/event-bus";
import { notifyBobby } from "@/lib/notifications/telegram-notify";

export async function planWeeklyContent(
  count = 7
): Promise<{ planned: number; titles: string[] }> {
  // Get top reviewed topics
  const topics = await prisma.trendingTopic.findMany({
    where: { status: "reviewed" },
    orderBy: { viralityScore: "desc" },
    take: count * 3, // fetch 3x to give Opus choices
  });

  if (topics.length === 0) {
    return { planned: 0, titles: [] };
  }

  const apiKey = await getRequiredSetting("ANTHROPIC_API_KEY");
  const client = new Anthropic({ apiKey });
  const startTime = Date.now();

  const topicList = topics
    .map((t, i) => `${i + 1}. "${t.title}" (${t.niche}, virality: ${t.viralityScore}, source: ${t.source})\n   ${t.description || ""}`)
    .join("\n\n");

  const response = await client.messages.create({
    model: "claude-opus-4-6",
    max_tokens: 2048,
    system: `You are Opus, the head operator of a content factory. You're planning this week's content.
Pick the ${count} best topics from the list for short-form video content (TikTok, Instagram Reels, YouTube Shorts).

For each pick, return a JSON array:
[
  {
    "topicIndex": 1,
    "title": "video title (catchy, platform-optimized)",
    "description": "what the video should cover and the angle to take",
    "targetPlatforms": ["tiktok", "instagram", "youtube"],
    "tags": ["tag1", "tag2"],
    "reason": "why this topic will perform well"
  }
]

Prioritize: high virality potential, strong hook opportunity, visual appeal, timely relevance.
Return ONLY the JSON array.`,
    messages: [{
      role: "user",
      content: `Here are the trending topics to choose from:\n\n${topicList}\n\nPick the best ${count} for this week's content.`,
    }],
  });

  const latency = Date.now() - startTime;
  const tokensIn = response.usage.input_tokens;
  const tokensOut = response.usage.output_tokens;
  const cost = (tokensIn * 15 + tokensOut * 75) / 1_000_000;

  await logModelUsage({
    model: "claude",
    taskType: "opus_planning",
    tokensIn,
    tokensOut,
    cost,
    latency,
    success: true,
  });

  const textBlock = response.content.find((b) => b.type === "text");
  const rawText = textBlock?.text || "[]";

  let picks: {
    topicIndex: number;
    title: string;
    description: string;
    targetPlatforms: string[];
    tags: string[];
    reason: string;
  }[] = [];

  try {
    const jsonMatch = rawText.match(/\[[\s\S]*\]/);
    picks = JSON.parse(jsonMatch?.[0] || "[]");
  } catch {
    console.error("[Planner] Failed to parse Opus picks");
    return { planned: 0, titles: [] };
  }

  const titles: string[] = [];

  for (const pick of picks) {
    const sourceTopic = topics[pick.topicIndex - 1];
    if (!sourceTopic) continue;

    // Create content item
    const contentItem = await prisma.contentItem.create({
      data: {
        title: pick.title,
        description: `${pick.description}\n\n[From trending: "${sourceTopic.title}"]\n[Reason: ${pick.reason}]`,
        tags: pick.tags,
        targetPlatforms: pick.targetPlatforms,
        niche: sourceTopic.niche,
        status: "idea",
      },
    });

    // Mark topic as selected
    await prisma.trendingTopic.update({
      where: { id: sourceTopic.id },
      data: { status: "selected", usedInContent: contentItem.id },
    });

    titles.push(pick.title);
  }

  // Log and notify
  await prisma.activityLog.create({
    data: {
      type: "success",
      message: `Opus planned ${titles.length} content items for the week`,
      source: "system",
    },
  });

  eventBus.emit({
    type: "content_created",
    agentName: "Opus",
    message: `Weekly plan: ${titles.length} content items created`,
  });

  await notifyBobby([
    `*Weekly Content Plan*`,
    `Planned: ${titles.length} pieces`,
    ``,
    ...titles.map((t, i) => `${i + 1}. ${t}`),
    ``,
    `Use \`/review\` after pipeline runs to approve.`,
  ].join("\n"));

  return { planned: titles.length, titles };
}
