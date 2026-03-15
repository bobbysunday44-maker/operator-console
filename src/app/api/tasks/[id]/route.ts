/* GET /api/tasks/[id] — Get task detail
 * PATCH /api/tasks/[id] — Update task
 * POST /api/tasks/[id] — Retry a failed task
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const task = await prisma.task.findUnique({
    where: { id },
    include: {
      assignee: { select: { id: true, name: true } },
      subtasks: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }
  return NextResponse.json({ task });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const SAFE_KEYS = ["status", "title", "description", "priority", "assigneeId", "dueAt", "metadata"] as const;
  const data: Record<string, unknown> = {};
  for (const key of SAFE_KEYS) {
    if (key in body) data[key] = body[key];
  }

  if (data.status === "completed") {
    data.completedAt = new Date();
  }
  if (data.dueAt && typeof data.dueAt === "string") {
    data.dueAt = new Date(data.dueAt as string);
  }

  try {
    const task = await prisma.task.update({ where: { id }, data });
    return NextResponse.json({ task });
  } catch {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const existing = await prisma.task.findUnique({ where: { id } });

  if (!existing) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }
  if (existing.status !== "failed") {
    return NextResponse.json({ error: "Only failed tasks can be retried" }, { status: 409 });
  }

  const task = await prisma.task.update({
    where: { id },
    data: { status: "pending", completedAt: null },
  });

  return NextResponse.json({ task });
}
