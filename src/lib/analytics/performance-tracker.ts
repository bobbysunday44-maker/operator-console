/* ── Performance Tracker ──
 * Runs every 2 hours. Captures engagement metrics for posted content.
 * Creates ContentPerformance records from SocialPost engagement data.
 */

import { prisma } from "@/lib/db/prisma";

export async function trackPerformance(): Promise<number> {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  // Find posted content that needs performance tracking
  const posts = await prisma.socialPost.findMany({
    where: {
      status: "posted",
      publishedAt: { not: null, lt: oneDayAgo },
      performances: { none: {} },
    },
    include: { platform: true, contentItem: true },
    take: 50,
  });

  let tracked = 0;

  for (const post of posts) {
    try {
      const eng = (post.engagement as Record<string, number>) || {};
      const views = eng.views || 0;
      const likes = eng.likes || 0;
      const comments = eng.comments || 0;
      const shares = eng.shares || 0;
      const saves = eng.saves || 0;

      await prisma.contentPerformance.create({
        data: {
          postId: post.id,
          views,
          likes,
          shares,
          comments,
          saves,
          watchTimeSeconds: eng.watchTime || null,
          avgWatchPercent: eng.avgWatchPercent || null,
          retentionRate: eng.retentionRate || null,
          ctr: views > 0 ? ((eng.clicks || 0) / views) * 100 : null,
          reachCount: eng.reach || 0,
          impressions: eng.impressions || 0,
          followerGain: eng.followerGain || 0,
        },
      });
      tracked++;
    } catch (err) {
      console.error(`[PerfTracker] Error tracking post ${post.id}:`, err);
    }
  }

  // Update existing performance records with fresh data
  const existingPerfs = await prisma.contentPerformance.findMany({
    where: { capturedAt: { gt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
    include: { post: true },
    take: 100,
  });

  for (const perf of existingPerfs) {
    const eng = (perf.post.engagement as Record<string, number>) || {};
    if (eng.views && eng.views > perf.views) {
      await prisma.contentPerformance.update({
        where: { id: perf.id },
        data: {
          views: eng.views,
          likes: eng.likes || perf.likes,
          shares: eng.shares || perf.shares,
          comments: eng.comments || perf.comments,
          saves: eng.saves || perf.saves,
          followerGain: eng.followerGain || perf.followerGain,
        },
      });
    }
  }

  if (tracked > 0) {
    console.log(`[PerfTracker] Tracked ${tracked} new posts`);
  }
  return tracked;
}

export function startPerformanceTracker() {
  console.log("[PerfTracker] Started — checking every 2 hours");
  setInterval(async () => {
    try {
      await trackPerformance();
    } catch (err) {
      console.error("[PerfTracker] Error:", err);
    }
  }, 2 * 60 * 60 * 1000);
}
