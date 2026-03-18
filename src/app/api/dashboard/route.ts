import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Parallel queries for dashboard KPIs
  const [
    agents,
    contentToday,
    pipelineRuns,
    postsToday,
    usageToday,
    platforms,
    recentActivity,
    hourlyRaw,
    postsPostedToday,
  ] = await Promise.all([
    prisma.agent.findMany({ include: { _count: { select: { tasks: true } } } }),
    prisma.contentItem.count({ where: { createdAt: { gte: today } } }),
    prisma.pipelineRun.count({ where: { createdAt: { gte: today } } }),
    prisma.socialPost.count({ where: { status: "posted", publishedAt: { gte: today } } }),
    prisma.modelUsageLog.aggregate({
      where: { createdAt: { gte: today } },
      _sum: { tokensIn: true, tokensOut: true, cost: true },
      _count: true,
    }),
    prisma.platform.findMany({ orderBy: { name: "asc" } }),
    prisma.activityLog.findMany({ orderBy: { createdAt: "desc" }, take: 10 }),
    // Hourly usage — group by hour for the bar chart
    prisma.modelUsageLog.findMany({
      where: { createdAt: { gte: today } },
      select: { createdAt: true, tokensIn: true, tokensOut: true },
    }),
    // Per-platform post counts
    prisma.socialPost.groupBy({
      by: ["platformId"],
      where: { status: "posted", publishedAt: { gte: today } },
      _count: true,
    }),
  ]);

  const activeAgents = agents.filter((a) => a.status === "active").length;
  const totalTokens = (usageToday._sum.tokensIn || 0) + (usageToday._sum.tokensOut || 0);

  // Build hourly usage array (6am to 5pm = 12 hours)
  const hourlyBuckets = new Map<number, number>();
  for (let h = 6; h <= 17; h++) hourlyBuckets.set(h, 0);

  for (const row of hourlyRaw) {
    const hour = row.createdAt.getHours();
    if (hourlyBuckets.has(hour)) {
      hourlyBuckets.set(hour, (hourlyBuckets.get(hour) || 0) + (row.tokensIn || 0) + (row.tokensOut || 0));
    }
  }

  const currentHour = new Date().getHours();
  const hourlyUsage = Array.from(hourlyBuckets.entries()).map(([h, value]) => ({
    label: `${h > 12 ? h - 12 : h}${h >= 12 ? "p" : "a"}`,
    value,
    highlight: h === currentHour,
  }));

  // Build per-platform posted counts map
  const platformPostCounts = new Map<string, number>();
  for (const row of postsPostedToday) {
    platformPostCounts.set(row.platformId, row._count);
  }

  return NextResponse.json({
    kpis: {
      activeAgents,
      totalAgents: agents.length,
      contentToday,
      postsToday,
      totalTasks: usageToday._count,
      pipelineRuns,
      totalTokens,
      costToday: usageToday._sum.cost || 0,
    },
    agents: agents.map((a) => ({
      id: a.id,
      name: a.name,
      status: a.status,
      currentTask: a.currentTask,
      type: a.type,
      tasksCompleted: a._count.tasks,
    })),
    platforms: platforms.map((p) => ({
      id: p.id,
      name: p.name,
      handle: p.handle,
      niche: p.niche,
      connected: p.connected,
      followers: p.followers,
      postedToday: platformPostCounts.get(p.id) || 0,
    })),
    recentActivity: recentActivity.map((a) => ({
      id: a.id,
      type: a.type,
      message: a.message,
      source: a.source,
      createdAt: a.createdAt,
    })),
    hourlyUsage,
  });
}
