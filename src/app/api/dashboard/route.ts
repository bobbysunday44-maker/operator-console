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
  ] = await Promise.all([
    prisma.agent.findMany(),
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
  ]);

  const activeAgents = agents.filter((a) => a.status === "active").length;
  const totalTokens = (usageToday._sum.tokensIn || 0) + (usageToday._sum.tokensOut || 0);

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
    })),
    platforms: platforms.map((p) => ({
      name: p.name,
      handle: p.handle,
      connected: p.connected,
      followers: p.followers,
    })),
    recentActivity: recentActivity.map((a) => ({
      id: a.id,
      type: a.type,
      message: a.message,
      source: a.source,
      createdAt: a.createdAt,
    })),
  });
}
