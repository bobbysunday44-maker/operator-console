/* ── Engagement Report ──
 * Generates weekly engagement summary.
 * Opus sends to Bobby via Telegram.
 */

import { prisma } from "@/lib/db/prisma";
import { notifyBobby } from "@/lib/notifications/telegram-notify";

export async function generateWeeklyReport(): Promise<string> {
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [
    postsThisWeek,
    mentionsThisWeek,
    contentCreated,
    pipelineRuns,
    usageStats,
  ] = await Promise.all([
    prisma.socialPost.count({ where: { publishedAt: { gte: weekAgo }, status: "posted" } }),
    prisma.mention.count({ where: { createdAt: { gte: weekAgo } } }),
    prisma.contentItem.count({ where: { createdAt: { gte: weekAgo } } }),
    prisma.pipelineRun.count({ where: { createdAt: { gte: weekAgo }, status: "completed" } }),
    prisma.modelUsageLog.aggregate({
      where: { createdAt: { gte: weekAgo } },
      _sum: { cost: true, tokensIn: true, tokensOut: true },
      _count: true,
    }),
  ]);

  // Top performing posts (by engagement if available)
  const topPosts = await prisma.socialPost.findMany({
    where: { publishedAt: { gte: weekAgo }, status: "posted" },
    include: { platform: { select: { name: true } }, contentItem: { select: { title: true } } },
    orderBy: { publishedAt: "desc" },
    take: 5,
  });

  const totalCost = usageStats._sum.cost || 0;
  const totalTokens = (usageStats._sum.tokensIn || 0) + (usageStats._sum.tokensOut || 0);

  const report = [
    `*Weekly Report*`,
    `Period: ${weekAgo.toLocaleDateString("en-US", { month: "short", day: "numeric" })} — ${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" })}`,
    ``,
    `*Content Production*`,
    `• Content created: ${contentCreated}`,
    `• Pipeline runs: ${pipelineRuns}`,
    `• Posts published: ${postsThisWeek}`,
    ``,
    `*Engagement*`,
    `• Mentions received: ${mentionsThisWeek}`,
    ``,
    `*Cost*`,
    `• Total spend: $${totalCost.toFixed(2)}`,
    `• API calls: ${usageStats._count}`,
    `• Tokens: ${totalTokens.toLocaleString()}`,
    ``,
    `*Top Posts*`,
    ...topPosts.map((p) => `• ${p.platform.name}: ${p.contentItem?.title || p.content.slice(0, 40)}`),
  ].join("\n");

  await notifyBobby(report);

  // Save to activity log
  await prisma.activityLog.create({
    data: {
      type: "info",
      message: `Weekly report generated: ${postsThisWeek} posts, $${totalCost.toFixed(2)} spent`,
      source: "system",
    },
  });

  return report;
}
