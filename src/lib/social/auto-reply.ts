/* ── OpenClaw Auto-Reply Engine ──
 * Generates sentiment-aware replies to mentions.
 * Uses mock responses now — will call Claude API in production.
 */

import type { Mention, MentionSentiment } from "./types";
import { socialStore } from "./social-store";
import { eventBus } from "@/lib/events/event-bus";

const REPLY_TEMPLATES: Record<MentionSentiment, string[]> = {
  positive: [
    "Thanks for the love! 🙏 We're working hard to make content creation effortless.",
    "So glad you're enjoying it! Have you tried the multi-platform scheduling yet? 🚀",
    "Appreciate the shoutout! Let us know if you need any help getting started 🤖",
  ],
  neutral: [
    "Thanks for checking us out! Happy to answer any questions you might have 👋",
    "Great question! DM us and we'll walk you through the features 💬",
    "We'd love to show you what OpenClaw can do. Try it free at our site! 🎯",
  ],
  negative: [
    "Thanks for the honest feedback! We're constantly improving. What would make it better for you? 🎯",
    "Appreciate you sharing this. We've been tuning the output quality — try the latest version! 🔧",
    "Fair point! We're working on exactly this. Would love your input on what to improve 💡",
  ],
};

/** Generate a sentiment-aware reply */
export function generateReply(mention: Mention): string {
  const templates = REPLY_TEMPLATES[mention.sentiment];
  const idx = Math.abs(hashCode(mention.id)) % templates.length;
  return templates[idx];
}

/** Auto-reply to a mention and update the store */
export function autoReply(mentionId: string): { success: boolean; reply?: string; error?: string } {
  const mention = socialStore.getMention(mentionId);

  if (!mention) return { success: false, error: "Mention not found" };
  if (mention.replied) return { success: false, error: "Already replied" };

  const reply = generateReply(mention);
  socialStore.markReplied(mentionId, reply);

  eventBus.emit({
    type: "task_completed",
    agentName: "Engage Bot",
    agentId: "agent-engage-bot",
    message: `Replied to ${mention.authorHandle} on ${mention.platform}`,
    metadata: { mentionId, platform: mention.platform, sentiment: mention.sentiment },
  });

  return { success: true, reply };
}

/** Simple string hash for deterministic template selection */
function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return hash;
}
