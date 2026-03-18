/* ── Auto-Reply System ──
 * Generates reply drafts for unread mentions using Claude Sonnet.
 * Bobby approves via dashboard or Telegram before posting.
 */

import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/db/prisma";
import { getRequiredSetting } from "@/lib/db/settings";
import { logModelUsage } from "@/lib/queue/usage-logger";
import { getReplyStrategy } from "@/lib/agents/platform-strategies";

export async function generateReplyDrafts(): Promise<number> {
  // Find unread, unreplied mentions
  const mentions = await prisma.mention.findMany({
    where: { isRead: false, isReplied: false },
    include: { platform: { select: { name: true, handle: true } } },
    take: 20,
    orderBy: { createdAt: "desc" },
  });

  if (mentions.length === 0) return 0;

  const apiKey = await getRequiredSetting("ANTHROPIC_API_KEY");
  const client = new Anthropic({ apiKey });
  let drafted = 0;

  for (const mention of mentions) {
    const startTime = Date.now();

    try {
      const response = await client.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 256,
        system: `You are a social media engagement specialist. Draft a reply to this mention/comment.

${getReplyStrategy(mention.platform.name)}

GENERAL RULES:
- Keep it short (1-2 sentences max)
- Be authentic, not corporate
- If it's a question, answer directly
- If it's negative, be empathetic but don't argue
- If it's a compliment, thank genuinely
Return ONLY the reply text, nothing else.`,
        messages: [{
          role: "user",
          content: `Platform: ${mention.platform.name}\nFrom: @${mention.author}\nType: ${mention.type}\nSentiment: ${mention.sentiment}\nMessage: "${mention.content}"`,
        }],
      });

      const latency = Date.now() - startTime;
      const textBlock = response.content.find((b) => b.type === "text");
      const replyText = textBlock?.text || "";
      const tokensIn = response.usage.input_tokens;
      const tokensOut = response.usage.output_tokens;
      const cost = (tokensIn * 3 + tokensOut * 15) / 1_000_000;

      await logModelUsage({ model: "claude", taskType: "auto_reply", tokensIn, tokensOut, cost, latency, success: true });

      // Save draft reply
      await prisma.mention.update({
        where: { id: mention.id },
        data: {
          isRead: true,
          replyText,
        },
      });

      drafted++;
    } catch (err) {
      console.error(`[AutoReply] Failed for mention ${mention.id}:`, err);
    }
  }

  return drafted;
}
