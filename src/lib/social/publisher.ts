/* ── Social Post Publisher ──
 * Posts content to platforms via third-party social media API services.
 * Supports Post for Me, Upload-Post, and Ayrshare providers.
 * Falls back to marking post as "scheduled" for manual posting if API fails.
 */

import { Worker, type Job } from "bullmq";
import { redisConnection } from "@/lib/queue/connection";
import { QUEUE_NAMES, type SocialPostJobData } from "@/lib/queue/queues";
import { prisma } from "@/lib/db/prisma";
import { eventBus } from "@/lib/events/event-bus";
import { getPlatformStrategy } from "@/lib/agents/platform-strategies";
import { checkRateLimit, recordPost, getHumanDelay } from "@/lib/social/rate-limiter";
import { injectCTA } from "@/lib/monetization/affiliate-manager";
import { publishToSocialMedia } from "@/lib/social/api-publisher";

async function publishPost(job: Job<SocialPostJobData>) {
  const { postId } = job.data;

  const post = await prisma.socialPost.findUnique({
    where: { id: postId },
    include: { platform: true, contentItem: { select: { niche: true } } },
  });

  if (!post) throw new Error(`Post ${postId} not found`);

  // Check rate limits before posting
  const rateCheck = await checkRateLimit(post.platformId);
  if (!rateCheck.allowed) {
    console.log(`[Social] Rate limited on ${post.platform.name}: ${rateCheck.reason}. Requeuing in ${rateCheck.waitSeconds}s`);
    throw new Error(`RATE_LIMITED:${rateCheck.waitSeconds}:${rateCheck.reason}`);
  }

  // Human-like delay before posting
  const delay = getHumanDelay(2, 5, true);
  await new Promise((resolve) => setTimeout(resolve, delay * 1000));

  // Update status to posting
  await prisma.socialPost.update({
    where: { id: postId },
    data: { status: "posting" },
  });

  try {
    // Load platform-specific posting strategy for logging
    const strategy = getPlatformStrategy(post.platform.name);
    console.log(`[Social] Using ${post.platform.name} strategy for post ${postId}`);
    console.log(`[Social] Strategy loaded: ${strategy.slice(0, 80)}...`);

    // Inject monetization CTA into post content
    const niche = post.contentItem?.niche || "";
    const postContent = niche ? await injectCTA(post.content, niche, post.platform.name) : post.content;
    if (postContent !== post.content) {
      await prisma.socialPost.update({ where: { id: postId }, data: { content: postContent } });
      console.log(`[Social] CTA injected for ${post.platform.name}`);
    }

    // Determine media URL (first one if available)
    const mediaUrl = post.mediaUrls && post.mediaUrls.length > 0 ? post.mediaUrls[0] : undefined;

    // Try API publishing
    const result = await publishToSocialMedia(post.platform.name, postContent, mediaUrl);

    if (result.success) {
      // API confirmed the post went through — mark as truly posted
      await prisma.socialPost.update({
        where: { id: postId },
        data: {
          status: "posted",
          publishedAt: new Date(),
          error: null,
          engagement: result.postUrl || result.platformPostId
            ? { postUrl: result.postUrl, platformPostId: result.platformPostId, provider: result.provider }
            : undefined,
        },
      });

      eventBus.emit({
        type: "post_published",
        agentName: "Social Bot",
        message: `Posted to ${post.platform.name} via ${result.provider}: "${postContent.slice(0, 40)}..."${result.postUrl ? ` — ${result.postUrl}` : ""}`,
        metadata: { postId, platform: post.platform.name, postUrl: result.postUrl, provider: result.provider },
      });

      console.log(`[Social] Post ${postId} published to ${post.platform.name} via ${result.provider}`);
    } else {
      // API failed — mark as scheduled with error for manual posting
      await prisma.socialPost.update({
        where: { id: postId },
        data: {
          status: "scheduled",
          error: `API publish failed (${result.provider || "unknown"}): ${result.error} — post manually`,
        },
      });

      eventBus.emit({
        type: "post_published",
        agentName: "Social Bot",
        message: `Content ready for ${post.platform.name} — API failed: ${result.error}. Manual posting required.`,
        metadata: { postId, platform: post.platform.name, error: result.error },
      });

      console.log(`[Social] Post ${postId} API publish failed, set to scheduled for manual posting: ${result.error}`);
    }

    // Record post for rate limiting regardless of outcome
    await recordPost(post.platformId, postId, delay);

    // Log activity
    await prisma.activityLog.create({
      data: {
        type: result.success ? "success" : "warning",
        message: result.success
          ? `Published to ${post.platform.name} via ${result.provider}: "${post.content.slice(0, 60)}..."`
          : `API publish failed for ${post.platform.name}: ${result.error} — queued for manual posting`,
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

export function createSocialWorker() {
  return new Worker<SocialPostJobData>(
    QUEUE_NAMES.SOCIAL_POSTING,
    async (job) => publishPost(job),
    { connection: redisConnection, concurrency: 1 }
  );
}
