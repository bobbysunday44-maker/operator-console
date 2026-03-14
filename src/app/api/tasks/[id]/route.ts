/* GET /api/tasks/[id] — Get task detail
 * PATCH /api/tasks/[id] — Update task status
 * POST /api/tasks/[id] — Retry a failed task
 */

import { NextResponse } from "next/server";
import { taskStore } from "@/lib/tasks/task-store";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const task = taskStore.getTask(params.id);
  if (!task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }
  return NextResponse.json({ task });
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // Only allow safe fields — prevent arbitrary field overwrites
  const allowed: Record<string, unknown> = {};
  const SAFE_KEYS = ["status", "lastError", "attempts", "startedAt", "completedAt", "duration"] as const;
  for (const key of SAFE_KEYS) {
    if (key in body) allowed[key] = body[key];
  }
  const task = taskStore.updateTask(params.id, allowed as Partial<Pick<import("@/lib/tasks/types").Task, (typeof SAFE_KEYS)[number]>>);
  if (!task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }
  return NextResponse.json({ task });
}

export async function POST(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const existing = taskStore.getTask(params.id);
  if (!existing) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }
  if (existing.status !== "failed") {
    return NextResponse.json({ error: "Only failed tasks can be retried" }, { status: 409 });
  }
  const task = taskStore.retryTask(params.id);
  return NextResponse.json({ task });
}
