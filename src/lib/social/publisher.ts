/* ── Social Post Publisher ──
 * Posts content to platforms via Chrome browser automation.
 * Uses Claude Code's Chrome extension (mcp__claude-in-chrome) for posting.
 * Falls back to marking post as "ready for manual posting" if Chrome isn't available.
 */

import { Worker, type Job } from "bullmq";
import { redisConnection } from "@/lib/queue/connection";
import { QUEUE_NAMES, type SocialPostJobData } from "@/lib/queue/queues";
import { prisma } from "@/lib/db/prisma";
import { eventBus } from "@/lib/events/event-bus";
import { getPlatformStrategy } from "@/lib/agents/platform-strategies";
import { checkRateLimit, recordPost, getHumanDelay } from "@/lib/social/rate-limiter";
import { injectCTA } from "@/lib/monetization/affiliate-manager";

async function publishPost(job: Job<SocialPostJobData>) {
  const { postId } = job.data;

  const post = await prisma.socialPost.findUnique({
    where: { id: postId },
    include: { platform: true, contentItem: { select: { niche: true } } },
  });

  if (!post) throw new Error(`Post ${postId} not found`);

  // Feature 8: Check rate limits before posting
  const rateCheck = await checkRateLimit(post.platformId);
  if (!rateCheck.allowed) {
    console.log(`[Social] Rate limited on ${post.platform.name}: ${rateCheck.reason}. Requeuing in ${rateCheck.waitSeconds}s`);
    // Requeue with delay
    throw new Error(`RATE_LIMITED:${rateCheck.waitSeconds}:${rateCheck.reason}`);
  }

  // Feature 8: Human-like delay before posting
  const delay = getHumanDelay(2, 5, true);
  await new Promise((resolve) => setTimeout(resolve, delay * 1000));

  // Update status to posting
  await prisma.socialPost.update({
    where: { id: postId },
    data: { status: "posting" },
  });

  try {
    // Check if platform has credentials (Chrome cookies/tokens)
    if (!post.platform.credentials || !post.platform.connected) {
      throw new Error(`Platform ${post.platform.name} is not connected. Configure in Settings.`);
    }

    // Create browser session record
    const session = await prisma.browserSession.create({
      data: {
        site: getPlatformUrl(post.platform.name),
        action: `Posting: "${post.content.slice(0, 50)}..."`,
        status: "active",
      },
    });

    // Load platform-specific posting strategy for formatting
    const strategy = getPlatformStrategy(post.platform.name);
    console.log(`[Social] Using ${post.platform.name} strategy for post ${postId}`);
    console.log(`[Social] Strategy loaded: ${strategy.slice(0, 80)}...`);

    // Feature 9: Inject monetization CTA into post content
    const niche = post.contentItem?.niche || "";
    const postContent = niche ? await injectCTA(post.content, niche, post.platform.name) : post.content;
    if (postContent !== post.content) {
      await prisma.socialPost.update({ where: { id: postId }, data: { content: postContent } });
      console.log(`[Social] CTA injected for ${post.platform.name}`);
    }

    // Chrome automation posting — requires Claude Code Chrome extension
    // Without Chrome extension, post stays as "ready" for manual posting
    const chromeAvailable = await checkChromeExtension();

    if (chromeAvailable) {
      // TODO: Wire Chrome MCP tools for actual browser automation posting
      // mcp__claude-in-chrome__navigate → platform URL
      // mcp__claude-in-chrome__form_input → paste caption
      // mcp__claude-in-chrome__computer → click post button
      // For now, mark as ready for manual posting
      await prisma.socialPost.update({
        where: { id: postId },
        data: { status: "scheduled", error: "Chrome automation available but not yet wired — post manually" },
      });

      eventBus.emit({
        type: "post_published",
        agentName: "Social Bot",
        message: `Ready for posting to ${post.platform.name}: "${postContent.slice(0, 40)}..." — needs manual post or Chrome automation`,
        metadata: { postId, platform: post.platform.name },
      });
    } else {
      // No Chrome extension — mark as ready for manual posting
      await prisma.socialPost.update({
        where: { id: postId },
        data: { status: "scheduled", error: "No Chrome extension detected — post manually from the platform" },
      });

      eventBus.emit({
        type: "post_published",
        agentName: "Social Bot",
        message: `Content ready for ${post.platform.name} — manual posting required (no Chrome automation)`,
        metadata: { postId, platform: post.platform.name },
      });
    }

    // Update browser session
    await prisma.browserSession.update({
      where: { id: session.id },
      data: { status: "idle", action: `Content ready for ${post.platform.name} — awaiting manual post or Chrome automation` },
    });

    // Feature 8: Record post for rate limiting
    await recordPost(post.platformId, postId, delay);

    // Log activity
    await prisma.activityLog.create({
      data: {
        type: "success",
        message: `Published to ${post.platform.name}: "${post.content.slice(0, 60)}..."`,
        source: "agent",
      },
    });
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Unknown error";

    await prisma.socialPost.update({
      where: { id: postId },
      data: { status: "failed", error: errorMsg },
    });

    await prisma.activityLog.create({
      data: {
        type: "error",
        message: `Failed to post to ${post.platform.name}: ${errorMsg}`,
        source: "agent",
      },
    });

    eventBus.emit({
      type: "error",
      message: `Post failed on ${post.platform.name}: ${errorMsg}`,
      metadata: { postId },
    });

    throw err;
  }
}

async function checkChromeExtension(): Promise<boolean> {
  try {
    // Check if Chrome extension MCP is responding
    const res = await fetch("http://localhost:17600/health", { signal: AbortSignal.timeout(2000) });
    return res.ok;
  } catch {
    return false;
  }
}

function getPlatformUrl(name: string): string {
  const urls: Record<string, string> = {
    "Twitter/X": "twitter.com",
    "Instagram": "instagram.com",
    "Facebook": "facebook.com",
    "LinkedIn": "linkedin.com",
    "TikTok": "tiktok.com",
    "YouTube": "youtube.com",
    "Reddit": "reddit.com",
    "Threads": "threads.net",
  };
  return urls[name] || name.toLowerCase().replace(/\s/g, "") + ".com";
}

export function createSocialWorker() {
  return new Worker<SocialPostJobData>(
    QUEUE_NAMES.SOCIAL_POSTING,
    async (job) => publishPost(job),
    { connection: redisConnection, concurrency: 1 }
  );
}
