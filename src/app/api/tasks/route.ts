/* GET /api/tasks — List tasks with optional filters
 * POST /api/tasks — Create a new task
 *
 * Query: ?status=pending|in_progress|completed|failed&priority=low|medium|high|urgent
 *        ?view=stats
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const rawStatus = request.nextUrl.searchParams.get("status");
  const rawPriority = request.nextUrl.searchParams.get("priority");
  const rawView = request.nextUrl.searchParams.get("view");

  if (rawView === "stats") {
    const [total, byStatus, byPriority] = await Promise.all([
      prisma.task.count(),
      prisma.task.groupBy({ by: ["status"], _count: true }),
      prisma.task.groupBy({ by: ["priority"], _count: true }),
    ]);

    const statusMap = Object.fromEntries(byStatus.map((s) => [s.status, s._count]));
    const priorityMap = Object.fromEntries(byPriority.map((p) => [p.priority, p._count]));

    return NextResponse.json({
      total,
      pending: statusMap.pending || 0,
      in_progress: statusMap.in_progress || 0,
      completed: statusMap.completed || 0,
      failed: statusMap.failed || 0,
      cancelled: statusMap.cancelled || 0,
      byPriority: priorityMap,
    });
  }

  const where: Record<string, unknown> = {};
  if (rawStatus) where.status = rawStatus;
  if (rawPriority) where.priority = rawPriority;

  const tasks = await prisma.task.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: { assignee: { select: { id: true, name: true } } },
    take: 100,
  });

  return NextResponse.json({ tasks });
}

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { title, description, priority, agentId, dueAt } = body as {
    title?: string;
    description?: string;
    priority?: string;
    agentId?: string;
    dueAt?: string;
  };

  if (!title) {
    return NextResponse.json({ error: "title is required" }, { status: 400 });
  }

  const task = await prisma.task.create({
    data: {
      title,
      description: description || null,
      priority: (priority as "low" | "medium" | "high" | "urgent") || "medium",
      status: "pending",
      assigneeId: agentId || null,
      dueAt: dueAt ? new Date(dueAt) : null,
    },
    include: { assignee: { select: { id: true, name: true } } },
  });

  return NextResponse.json({ task }, { status: 201 });
}
