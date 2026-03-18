/* ── Engagement Analyzer ──
 * Deep engagement analysis: viral coefficient, best posting times,
 * top-performing hooks, demographic insights.
 */

import { prisma } from "@/lib/db/prisma";

export async function captureEngagementSnapshot(postId: string) {
  const post = await prisma.socialPost.findUnique({
    where: { id: postId },
    include: { platform: true, performances: { orderBy: { capturedAt: "desc" }, take: 1 } },
  });

  if (!post || !post.performances[0]) return null;
  const perf = post.performances[0];

  const shareToView = perf.views > 0 ? perf.shares / perf.views : 0;
  const saveToView = perf.views > 0 ? perf.saves / perf.views : 0;
  const viralCoefficient = shareToView > 0 ? 1 + (shareToView * 10) : 0;

  return prisma.engagementSnapshot.create({
    data: {
      postId,
      platform: post.platform.name,
      peakEngagementHour: post.publishedAt ? post.publishedAt.getHours() : null,
      bestDayOfWeek: post.publishedAt ? post.publishedAt.getDay() : null,
      viralCoefficient,
      shareToViewRatio: shareToView,
      saveToViewRatio: saveToView,
      audienceGrowthRate: perf.views > 0 ? (perf.followerGain / perf.views) * 100 : 0,
    },
  });
}

export async function getBestPostingTime(niche: string, platform?: string) {
  const where: Record<string, unknown> = {
    post: { contentItem: { niche } },
    peakEngagementHour: { not: null },
  };
  if (platform) where.platform = platform;

  const snapshots = await prisma.engagementSnapshot.findMany({
    where,
    select: { peakEngagementHour: true, bestDayOfWeek: true, shareToViewRatio: true },
    take: 100,
  });

  if (snapshots.length === 0) return { hour: 18, dayOfWeek: 2, reason: "Default (no data yet)" };

  // Find hour with highest average share ratio
  const hourMap = new Map<number, { total: number; count: number }>();
  for (const s of snapshots) {
    if (s.peakEngagementHour === null) continue;
    const h = hourMap.get(s.peakEngagementHour) || { total: 0, count: 0 };
    h.total += s.shareToViewRatio || 0;
    h.count++;
    hourMap.set(s.peakEngagementHour, h);
  }

  let bestHour = 18;
  let bestAvg = 0;
  Array.from(hourMap.entries()).forEach(([hour, data]) => {
    const avg = data.total / data.count;
    if (avg > bestAvg) { bestAvg = avg; bestHour = hour; }
  });

  // Find best day
  const dayMap = new Map<number, number>();
  for (const s of snapshots) {
    if (s.bestDayOfWeek === null) continue;
    dayMap.set(s.bestDayOfWeek, (dayMap.get(s.bestDayOfWeek) || 0) + 1);
  }
  const bestDay = Array.from(dayMap.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 2;
  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  return {
    hour: bestHour,
    dayOfWeek: bestDay,
    reason: `${dayNames[bestDay]} at ${bestHour}:00 has highest engagement (${snapshots.length} posts analyzed)`,
  };
}

export async function getTopPerformingHooks(niche: string, limit = 10) {
  const performances = await prisma.contentPerformance.findMany({
    where: { post: { contentItem: { niche } } },
    include: { post: { include: { contentItem: { select: { title: true, script: true } } } } },
    orderBy: { likes: "desc" },
    take: limit,
  });

  return performances.map((p) => {
    const eng = p.views > 0 ? ((p.likes + p.comments + p.shares + p.saves) / p.views) * 100 : 0;
    return {
      title: p.post.contentItem?.title || "Untitled",
      views: p.views,
      engagement: Math.round(eng * 100) / 100,
      likes: p.likes,
      saves: p.saves,
      shares: p.shares,
    };
  });
}
