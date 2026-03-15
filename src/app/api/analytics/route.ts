/* GET /api/analytics — Analytics summary from database */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);

  const [
    totalContent,
    contentToday,
    totalPosts,
    postsToday,
    totalTasks,
    tasksCompleted,
    usageStats,
    platformStats,
    recentSnapshots,
  ] = await Promise.all([
    prisma.contentItem.count(),
    prisma.contentItem.count({ where: { createdAt: { gte: today } } }),
    prisma.socialPost.count(),
    prisma.socialPost.count({ where: { status: "posted", publishedAt: { gte: today } } }),
    prisma.task.count(),
    prisma.task.count({ where: { status: "completed" } }),
    prisma.modelUsageLog.aggregate({
      _sum: { tokensIn: true, tokensOut: true, cost: true },
      _count: true,
    }),
    prisma.socialPost.groupBy({
      by: ["platformId"],
      _count: true,
      where: { status: "posted" },
    }),
    prisma.analyticsSnapshot.findMany({
      where: { capturedAt: { gte: weekAgo } },
      orderBy: { capturedAt: "desc" },
      take: 50,
    }),
  ]);

  return NextResponse.json({
    overview: {
      totalContent,
      contentToday,
      totalPosts,
      postsToday,
      totalTasks,
      tasksCompleted,
      completionRate: totalTasks > 0 ? Math.round((tasksCompleted / totalTasks) * 100) : 0,
    },
    usage: {
      totalRequests: usageStats._count,
      totalTokens: (usageStats._sum.tokensIn || 0) + (usageStats._sum.tokensOut || 0),
      totalCost: usageStats._sum.cost || 0,
    },
    platformBreakdown: platformStats.map((p) => ({
      platform: p.platformId,
      posts: p._count,
    })),
    snapshots: recentSnapshots,
  });
}
