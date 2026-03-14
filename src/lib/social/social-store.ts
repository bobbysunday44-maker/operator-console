/* ── OpenClaw Social Media Store ──
 * In-memory store for scheduled posts, mentions, and auto-replies.
 * Will be replaced by Prisma + PostgreSQL once DB is connected.
 */

import type { ScheduledPost, Mention, SocialStats, PlatformId, MentionSentiment } from "./types";
import { eventBus } from "@/lib/events/event-bus";

class SocialStore {
  private posts = new Map<string, ScheduledPost>();
  private mentions = new Map<string, Mention>();
  private counter = 0;

  private nextId(prefix: string): string {
    this.counter++;
    return `${prefix}-${Date.now()}-${this.counter}`;
  }

  /* ── Posts ── */

  createPost(post: Omit<ScheduledPost, "id" | "createdAt">): ScheduledPost {
    const full: ScheduledPost = {
      ...post,
      id: this.nextId("post"),
      createdAt: Date.now(),
    };
    this.posts.set(full.id, full);
    return full;
  }

  getPost(id: string): ScheduledPost | null {
    return this.posts.get(id) || null;
  }

  listPosts(status?: ScheduledPost["status"]): ScheduledPost[] {
    const all = Array.from(this.posts.values()).sort((a, b) => b.createdAt - a.createdAt);
    if (status) return all.filter((p) => p.status === status);
    return all;
  }

  updatePostStatus(id: string, status: ScheduledPost["status"]): void {
    const post = this.posts.get(id);
    if (post) {
      post.status = status;
      if (status === "published") post.publishedAt = Date.now();
    }
  }

  /* ── Mentions ── */

  addMention(mention: Omit<Mention, "id" | "detectedAt">): Mention {
    const full: Mention = {
      ...mention,
      id: this.nextId("mention"),
      detectedAt: Date.now(),
    };
    this.mentions.set(full.id, full);
    return full;
  }

  getMention(id: string): Mention | null {
    return this.mentions.get(id) || null;
  }

  listMentions(unrepliedOnly = false): Mention[] {
    const all = Array.from(this.mentions.values()).sort((a, b) => b.detectedAt - a.detectedAt);
    if (unrepliedOnly) return all.filter((m) => !m.replied);
    return all;
  }

  markReplied(id: string, replyContent: string): void {
    const mention = this.mentions.get(id);
    if (mention) {
      mention.replied = true;
      mention.replyContent = replyContent;
    }
  }

  /* ── Stats ── */

  getStats(): SocialStats {
    const posts = Array.from(this.posts.values());
    const mentions = Array.from(this.mentions.values());
    const today = Date.now() - 86400000;

    const postsToday = posts.filter((p) => p.createdAt > today).length;
    const mentionsToday = mentions.filter((m) => m.detectedAt > today).length;
    const repliesSent = mentions.filter((m) => m.replied).length;

    // Count posts per platform
    const platformCounts: Record<string, number> = {};
    for (const p of posts) {
      for (const pl of p.platforms) {
        platformCounts[pl] = (platformCounts[pl] || 0) + 1;
      }
    }
    const topPlatform = (Object.entries(platformCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "twitter") as PlatformId;

    return {
      totalPosts: posts.filter((p) => p.status === "published").length,
      postsToday,
      mentionsToday,
      repliesSent,
      engagementRate: "4.2%",
      topPlatform,
    };
  }
}

/* ── Singleton ── */
const globalForSocial = globalThis as unknown as { socialStore: SocialStore };
export const socialStore = globalForSocial.socialStore || new SocialStore();
if (process.env.NODE_ENV !== "production") {
  globalForSocial.socialStore = socialStore;
}

/* ── Seed demo data ── */
function seedIfEmpty() {
  if (socialStore.listPosts().length > 0) return;

  const now = Date.now();

  // Published posts
  socialStore.createPost({
    contentId: "CNT-0045",
    title: "5 AI Tools You Need in 2026",
    caption: "POV: You discovered these AI tools before everyone else 🤖✨ #AItools #tech #2026",
    platforms: ["tiktok", "instagram", "twitter"],
    status: "published",
    scheduledAt: now - 3600000,
    publishedAt: now - 3500000,
    mediaType: "video",
    results: {
      tiktok: { success: true, postUrl: "https://tiktok.com/@openclaw/123" },
      instagram: { success: true, postUrl: "https://instagram.com/p/abc" },
      twitter: { success: true, postUrl: "https://x.com/openclaw/456" },
    },
  });

  socialStore.createPost({
    contentId: "CNT-0046",
    title: "AI vs Traditional Marketing",
    caption: "Why AI content creators are replacing marketing agencies 📊 #marketing #AI",
    platforms: ["twitter", "linkedin"],
    status: "published",
    scheduledAt: now - 7200000,
    publishedAt: now - 7100000,
    mediaType: "image",
    results: {
      twitter: { success: true, postUrl: "https://x.com/openclaw/789" },
    },
  });

  // Scheduled posts
  socialStore.createPost({
    contentId: "CNT-0047",
    title: "AI Agents Automate Your Social Media",
    caption: "POV: your AI agent just posted to 6 platforms while you were sleeping 🤖✨ #AIautomation",
    platforms: ["tiktok", "instagram", "twitter"],
    status: "scheduled",
    scheduledAt: now + 3600000,
    mediaType: "video",
  });

  socialStore.createPost({
    contentId: "CNT-0048",
    title: "Behind the Scenes: How We Train AI",
    caption: "Ever wonder how AI learns to create content? Here's our process 🧠 #BTS #AI",
    platforms: ["tiktok", "youtube"],
    status: "draft",
    scheduledAt: now + 86400000,
    mediaType: "video",
  });

  // Mentions
  const mentionData: { platform: PlatformId; author: string; handle: string; content: string; sentiment: MentionSentiment; replied: boolean; reply?: string }[] = [
    { platform: "twitter", author: "Sarah Chen", handle: "@sarahdev", content: "Just discovered @openclaw_ai and it's insane how fast it creates content. Made a whole TikTok in 30 seconds 🤯", sentiment: "positive", replied: true, reply: "Thanks Sarah! We're glad you're loving the speed. Wait till you try the multi-platform scheduling 🚀" },
    { platform: "twitter", author: "Mike Torres", handle: "@miketor", content: "@openclaw_ai is this available for agencies? We manage 20+ accounts", sentiment: "positive", replied: false },
    { platform: "instagram", author: "Tech Daily", handle: "@techdaily", content: "Has anyone tried @openclaw.ai? Thinking about switching from Buffer", sentiment: "neutral", replied: false },
    { platform: "tiktok", author: "ContentQueen", handle: "@contentqueen", content: "The AI content from @openclaw looks kinda robotic ngl. Needs more personality", sentiment: "negative", replied: true, reply: "Thanks for the feedback! We've been tuning the voice to sound more natural. Try the latest version — the Gen-Z tone preset is much better 🎯" },
    { platform: "twitter", author: "AI News", handle: "@ainews", content: "New player in AI content: @openclaw_ai combines 6 AI models into one pipeline. Interesting approach.", sentiment: "neutral", replied: false },
    { platform: "reddit", author: "dev_enthusiast", handle: "u/dev_enthusiast", content: "Been using OpenClaw for a week. The video gen quality from Veo 3.1 is actually impressive", sentiment: "positive", replied: false },
  ];

  for (const m of mentionData) {
    const mention = socialStore.addMention({
      platform: m.platform,
      author: m.author,
      authorHandle: m.handle,
      content: m.content,
      sentiment: m.sentiment,
      replied: m.replied,
      replyContent: m.reply,
    });

    if (!m.replied) {
      eventBus.emit({
        type: "mention_detected",
        agentName: "Scanner",
        agentId: "agent-scanner",
        message: `${m.platform}: ${m.handle} mentioned us`,
        metadata: { mentionId: mention.id, platform: m.platform },
      });
    }
  }
}

seedIfEmpty();
