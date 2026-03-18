/* ── Mention Scanner ──
 * Scans connected platforms for mentions, comments, and replies.
 * Uses Claude Sonnet with web search to find mentions.
 * Saves to Mention table. Notifies Bobby for important ones.
 */

import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/db/prisma";
import { getRequiredSetting } from "@/lib/db/settings";
import { logModelUsage } from "@/lib/queue/usage-logger";
import { eventBus } from "@/lib/events/event-bus";
import { notifyBobby } from "@/lib/notifications/telegram-notify";

export async function scanMentions(): Promise<number> {
  const platforms = await prisma.platform.findMany({
    where: { connected: true },
    select: { id: true, name: true, handle: true },
  });

  if (platforms.length === 0) return 0;

  const apiKey = await getRequiredSetting("ANTHROPIC_API_KEY");
  const client = new Anthropic({ apiKey });
  let totalMentions = 0;

  const handleList = platforms.map((p) => `${p.name}: @${p.handle}`).join(", ");
  const startTime = Date.now();

  try {
    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2048,
      tools: [
        { type: "web_search_20260209" as const, name: "web_search" as const },
      ],
      messages: [{
        role: "user",
        content: `Search for recent mentions, comments, and replies to these social media accounts: ${handleList}

Look for:
1. Direct @mentions on Twitter/X
2. Comments on recent posts
3. Replies and DMs references
4. People talking about these accounts

For each mention found, return a JSON array:
[
  {
    "platform": "twitter|instagram|tiktok|youtube|reddit|linkedin",
    "type": "mention|comment|reply|dm",
    "author": "username",
    "content": "what they said",
    "sentiment": "positive|negative|neutral",
    "sourceUrl": "url if available",
    "important": true/false
  }
]

Mark as "important" if: negative sentiment, question requiring response, influencer mention, or high engagement.
Return ONLY the JSON array.`,
      }],
    });

    const latency = Date.now() - startTime;
    const tokensIn = response.usage.input_tokens;
    const tokensOut = response.usage.output_tokens;
    const cost = (tokensIn * 3 + tokensOut * 15) / 1_000_000;

    await logModelUsage({ model: "claude", taskType: "mention_scan", tokensIn, tokensOut, cost, latency, success: true });

    const textBlocks = response.content.filter((b) => b.type === "text");
    const fullText = textBlocks.map((b) => b.type === "text" ? b.text : "").join("\n");

    let mentions: {
      platform: string;
      type: string;
      author: string;
      content: string;
      sentiment: string;
      sourceUrl?: string;
      important?: boolean;
    }[] = [];

    try {
      const jsonMatch = fullText.match(/\[[\s\S]*\]/);
      if (jsonMatch) mentions = JSON.parse(jsonMatch[0]);
    } catch {
      console.error("[MentionScanner] Failed to parse mentions");
      return 0;
    }

    const importantMentions: string[] = [];

    for (const mention of mentions) {
      const platform = platforms.find((p) => p.name.toLowerCase().includes(mention.platform));
      if (!platform) continue;

      // Check for duplicate
      const existing = await prisma.mention.findFirst({
        where: {
          platformId: platform.id,
          author: mention.author,
          content: mention.content,
        },
      });
      if (existing) continue;

      await prisma.mention.create({
        data: {
          platformId: platform.id,
          type: mention.type,
          author: mention.author,
          content: mention.content,
          sentiment: mention.sentiment,
          sourceUrl: mention.sourceUrl,
          isRead: false,
          isReplied: false,
        },
      });

      totalMentions++;

      if (mention.important) {
        importantMentions.push(`${mention.platform}: @${mention.author} — "${mention.content.slice(0, 80)}"`);
      }
    }

    if (importantMentions.length > 0) {
      await notifyBobby([
        `*Important Mentions Detected*`,
        ``,
        ...importantMentions.map((m) => `• ${m}`),
        ``,
        `Check the Social page for details.`,
      ].join("\n"));
    }

    eventBus.emit({
      type: "mention_detected",
      agentName: "Scanner",
      message: `Found ${totalMentions} new mentions (${importantMentions.length} important)`,
    });
  } catch (err) {
    console.error("[MentionScanner] Error:", err);
  }

  return totalMentions;
}
