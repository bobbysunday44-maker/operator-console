/* ── Rate Limiter ──
 * Prevents account bans by enforcing human-like posting patterns.
 * Random delays, daily limits, cooldown periods.
 */

import { prisma } from "@/lib/db/prisma";

const PLATFORM_DEFAULTS: Record<string, { maxPerHour: number; maxPerDay: number; minDelay: number; maxDelay: number }> = {
  "TikTok": { maxPerHour: 3, maxPerDay: 8, minDelay: 600, maxDelay: 3600 },
  "Instagram": { maxPerHour: 2, maxPerDay: 6, minDelay: 900, maxDelay: 3600 },
  "YouTube": { maxPerHour: 1, maxPerDay: 3, minDelay: 1800, maxDelay: 7200 },
  "Facebook": { maxPerHour: 3, maxPerDay: 10, minDelay: 600, maxDelay: 3600 },
  "Twitter/X": { maxPerHour: 5, maxPerDay: 20, minDelay: 300, maxDelay: 1800 },
  "LinkedIn": { maxPerHour: 2, maxPerDay: 4, minDelay: 1800, maxDelay: 7200 },
  "Reddit": { maxPerHour: 1, maxPerDay: 3, minDelay: 3600, maxDelay: 14400 },
  "Threads": { maxPerHour: 3, maxPerDay: 8, minDelay: 600, maxDelay: 3600 },
};

export async function initializeRateLimits(platformId: string, platformName: string) {
  const defaults = PLATFORM_DEFAULTS[platformName] || PLATFORM_DEFAULTS["Facebook"];

  return prisma.platformRateLimit.upsert({
    where: { platformId },
    update: {},
    create: {
      platformId,
      maxPostsPerHour: defaults.maxPerHour,
      maxPostsPerDay: defaults.maxPerDay,
      minDelaySeconds: defaults.minDelay,
      maxDelaySeconds: defaults.maxDelay,
      humanVariance: true,
      randomScrollBefore: true,
    },
  });
}

export async function checkRateLimit(platformId: string): Promise<{
  allowed: boolean;
  waitSeconds: number;
  reason: string;
}> {
  const limit = await prisma.platformRateLimit.findUnique({ where: { platformId } });

  if (!limit) return { allowed: true, waitSeconds: 0, reason: "No rate limit configured" };

  // Check cooldown
  if (limit.cooldownUntil && limit.cooldownUntil > new Date()) {
    const wait = Math.ceil((limit.cooldownUntil.getTime() - Date.now()) / 1000);
    return { allowed: false, waitSeconds: wait, reason: `Cooldown active. Wait ${Math.ceil(wait / 60)} minutes.` };
  }

  // Reset daily count if new day
  const now = new Date();
  if (limit.lastResetAt.toDateString() !== now.toDateString()) {
    await prisma.platformRateLimit.update({
      where: { platformId },
      data: { dailyPostCount: 0, lastResetAt: now },
    });
  }

  // Check daily limit
  if (limit.dailyPostCount >= limit.maxPostsPerDay) {
    return { allowed: false, waitSeconds: 86400, reason: `Daily limit reached (${limit.maxPostsPerDay}/day)` };
  }

  // Check hourly limit
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const recentPosts = await prisma.postingLog.count({
    where: { platformId, postedAt: { gt: oneHourAgo } },
  });
  if (recentPosts >= limit.maxPostsPerHour) {
    return { allowed: false, waitSeconds: 3600, reason: `Hourly limit reached (${limit.maxPostsPerHour}/hour)` };
  }

  // Check minimum delay since last post
  if (limit.lastPostAt) {
    const elapsed = (Date.now() - limit.lastPostAt.getTime()) / 1000;
    const requiredDelay = getHumanDelay(limit.minDelaySeconds, limit.maxDelaySeconds, limit.humanVariance);
    if (elapsed < requiredDelay) {
      const wait = Math.ceil(requiredDelay - elapsed);
      return { allowed: false, waitSeconds: wait, reason: `Too soon. Wait ${Math.ceil(wait / 60)} minutes.` };
    }
  }

  return { allowed: true, waitSeconds: 0, reason: "OK" };
}

export async function recordPost(platformId: string, postId: string, delayApplied: number) {
  await prisma.$transaction([
    prisma.postingLog.create({
      data: { platformId, postId, action: "post", delayApplied },
    }),
    prisma.platformRateLimit.update({
      where: { platformId },
      data: {
        dailyPostCount: { increment: 1 },
        lastPostAt: new Date(),
      },
    }),
  ]);
}

export function getHumanDelay(min: number, max: number, variance: boolean): number {
  const base = min + Math.random() * (max - min);
  if (!variance) return Math.round(base);

  // Gaussian-ish variance: +-30%
  const factor = 0.7 + Math.random() * 0.6;
  return Math.round(base * factor);
}

export async function resetDailyCounts() {
  await prisma.platformRateLimit.updateMany({
    data: { dailyPostCount: 0, lastResetAt: new Date() },
  });
}
