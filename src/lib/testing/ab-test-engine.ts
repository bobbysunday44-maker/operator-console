/* ── A/B Test Engine ──
 * Create tests with 2-5 variants. Track performance.
 * Auto-declare winners. Scale winning content.
 */

import { prisma } from "@/lib/db/prisma";

interface VariantInput {
  hookText?: string;
  caption?: string;
  thumbnailUrl?: string;
}

export async function createABTest(
  contentItemId: string,
  variants: VariantInput[],
  name?: string,
  winMetric = "engagement"
) {
  if (variants.length < 2 || variants.length > 5) {
    throw new Error("A/B test requires 2-5 variants");
  }

  const labels = ["A", "B", "C", "D", "E"];

  const test = await prisma.aBTest.create({
    data: {
      contentItemId,
      name: name || `Test for ${contentItemId.slice(0, 8)}`,
      winMetric,
      status: "running",
      variants: {
        create: variants.map((v, i) => ({
          variantLabel: labels[i],
          hookText: v.hookText,
          caption: v.caption,
          thumbnailUrl: v.thumbnailUrl,
        })),
      },
    },
    include: { variants: true },
  });

  return test;
}

export async function evaluateTest(testId: string) {
  const test = await prisma.aBTest.findUnique({
    where: { id: testId },
    include: { variants: true },
  });

  if (!test || test.status !== "running") return null;

  // Check if enough data
  const totalViews = test.variants.reduce((sum, v) => sum + v.views, 0);
  if (totalViews < test.minSampleSize) {
    return { status: "insufficient_data", totalViews, needed: test.minSampleSize };
  }

  // Find best variant by win metric
  const sorted = [...test.variants].sort((a, b) => {
    switch (test.winMetric) {
      case "views": return b.views - a.views;
      case "saves": return b.saves - a.saves;
      case "ctr": return b.ctr - a.ctr;
      default: return b.engagementRate - a.engagementRate;
    }
  });

  const best = sorted[0];
  const second = sorted[1];

  // Require >20% lead to declare winner
  const bestScore = test.winMetric === "views" ? best.views :
    test.winMetric === "saves" ? best.saves :
    test.winMetric === "ctr" ? best.ctr : best.engagementRate;

  const secondScore = test.winMetric === "views" ? second.views :
    test.winMetric === "saves" ? second.saves :
    test.winMetric === "ctr" ? second.ctr : second.engagementRate;

  if (secondScore > 0 && (bestScore / secondScore - 1) < 0.2) {
    return { status: "no_clear_winner", leader: best.variantLabel, margin: Math.round((bestScore / secondScore - 1) * 100) };
  }

  // Declare winner
  await prisma.$transaction([
    prisma.aBTest.update({
      where: { id: testId },
      data: { status: "completed", winnerVariant: best.variantLabel, endedAt: new Date() },
    }),
    prisma.aBTestVariant.update({
      where: { id: best.id },
      data: { isWinner: true },
    }),
  ]);

  return { status: "winner_declared", winner: best.variantLabel, margin: Math.round((bestScore / secondScore - 1) * 100) };
}

export async function getActiveTests(niche?: string) {
  const where: Record<string, unknown> = { status: "running" };
  if (niche) where.contentItem = { niche };

  return prisma.aBTest.findMany({
    where,
    include: { variants: true, contentItem: { select: { title: true, niche: true } } },
    orderBy: { startedAt: "desc" },
  });
}

export async function scaleWinner(testId: string) {
  const test = await prisma.aBTest.findUnique({
    where: { id: testId },
    include: {
      variants: { where: { isWinner: true } },
      contentItem: { select: { targetPlatforms: true, niche: true } },
    },
  });

  if (!test || !test.variants[0]) return null;

  const winner = test.variants[0];
  const content = winner.caption || winner.hookText || "";

  // Create posts on platforms that don't have this variant yet
  const existingPlatforms = await prisma.socialPost.findMany({
    where: { contentItemId: test.contentItemId },
    select: { platformId: true },
  });
  const existingIds = new Set(existingPlatforms.map((p) => p.platformId));

  const nicheFilter = test.contentItem?.niche
    ? { OR: [{ niche: test.contentItem.niche }, { niche: "" }] }
    : {};

  const platforms = await prisma.platform.findMany({
    where: {
      name: { in: test.contentItem?.targetPlatforms || [] },
      connected: true,
      id: { notIn: Array.from(existingIds) },
      ...nicheFilter,
    },
  });

  const posts = await prisma.socialPost.createMany({
    data: platforms.map((p) => ({
      platformId: p.id,
      contentItemId: test.contentItemId,
      content,
      status: "scheduled" as const,
      scheduledAt: new Date(Date.now() + 60 * 60 * 1000),
    })),
  });

  return { scaled: posts.count, platforms: platforms.map((p) => p.name) };
}

export async function autoCheckTests() {
  const tests = await prisma.aBTest.findMany({ where: { status: "running" } });
  let evaluated = 0;

  for (const test of tests) {
    const result = await evaluateTest(test.id);
    if (result && result.status === "winner_declared") {
      await scaleWinner(test.id);
      evaluated++;
    }
  }

  if (evaluated > 0) {
    console.log(`[ABTest] Evaluated ${evaluated} tests, scaled winners`);
  }
  return evaluated;
}
