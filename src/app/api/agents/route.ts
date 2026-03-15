import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const view = searchParams.get("view");

  if (view === "stats") {
    const agents = await prisma.agent.findMany();
    const active = agents.filter((a) => a.status === "active").length;
    const idle = agents.filter((a) => a.status === "idle").length;
    const offline = agents.filter((a) => a.status === "offline").length;
    const error = agents.filter((a) => a.status === "error").length;

    // Get today's usage stats from model_usage_log
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const usageToday = await prisma.modelUsageLog.aggregate({
      where: { createdAt: { gte: today } },
      _sum: { tokensIn: true, tokensOut: true, cost: true },
      _count: true,
    });

    return NextResponse.json({
      total: agents.length,
      active,
      idle,
      offline,
      error,
      totalTasks: usageToday._count,
      totalTokens: (usageToday._sum.tokensIn || 0) + (usageToday._sum.tokensOut || 0),
      totalCostToday: usageToday._sum.cost || 0,
    });
  }

  const status = searchParams.get("status");
  const where = status ? { status: status as "active" | "idle" | "error" | "offline" } : {};

  const agents = await prisma.agent.findMany({
    where,
    orderBy: { name: "asc" },
    include: {
      _count: { select: { tasks: true, logs: true } },
    },
  });

  // Get today's usage per agent
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const agentUsage = await prisma.modelUsageLog.groupBy({
    by: ["agentId"],
    where: { createdAt: { gte: today }, agentId: { not: null } },
    _sum: { tokensIn: true, tokensOut: true, cost: true },
    _count: true,
  });
  const usageMap = new Map(agentUsage.map((u) => [u.agentId, u]));

  const enriched = agents.map((a) => {
    const usage = usageMap.get(a.id);
    return {
      ...a,
      tasksCompleted: a._count.tasks,
      tokensUsed: usage ? (usage._sum.tokensIn || 0) + (usage._sum.tokensOut || 0) : 0,
      costToday: usage?._sum.cost || 0,
      capabilities: (a.config as { capabilities?: string[] })?.capabilities || [],
    };
  });

  return NextResponse.json(enriched);
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { name, type } = body as { name?: string; type?: string };
  if (!name || !type) {
    return NextResponse.json({ error: "name and type are required" }, { status: 400 });
  }

  const agent = await prisma.agent.create({
    data: {
      name,
      type,
      status: "offline",
      personality: (body.personality as string) || null,
      config: (body.config as object) || null,
    },
  });

  // Log the creation
  await prisma.activityLog.create({
    data: {
      type: "success",
      message: `Agent "${agent.name}" created`,
      source: "system",
    },
  });

  return NextResponse.json(agent, { status: 201 });
}
