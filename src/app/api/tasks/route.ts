/* GET /api/tasks — List tasks with optional filters
 * POST /api/tasks — Create a new task
 *
 * Query: ?status=pending|running|completed|failed&priority=low|medium|high|critical
 */

import { NextRequest, NextResponse } from "next/server";
import { taskStore } from "@/lib/tasks/task-store";
import type { TaskStatus, TaskPriority } from "@/lib/tasks/types";

const VALID_STATUSES = new Set<TaskStatus>(["pending", "running", "completed", "failed", "retrying"]);
const VALID_PRIORITIES = new Set<TaskPriority>(["low", "medium", "high", "critical"]);

export async function GET(request: NextRequest) {
  const rawStatus = request.nextUrl.searchParams.get("status");
  const rawPriority = request.nextUrl.searchParams.get("priority");
  const rawView = request.nextUrl.searchParams.get("view");

  if (rawView === "stats") {
    return NextResponse.json(taskStore.getTaskStats());
  }

  const filters: { status?: TaskStatus; priority?: TaskPriority } = {};
  if (rawStatus && VALID_STATUSES.has(rawStatus as TaskStatus)) filters.status = rawStatus as TaskStatus;
  if (rawPriority && VALID_PRIORITIES.has(rawPriority as TaskPriority)) filters.priority = rawPriority as TaskPriority;

  const tasks = taskStore.listTasks(Object.keys(filters).length > 0 ? filters : undefined);
  return NextResponse.json({ tasks });
}

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { title, description, priority, agentId, agentName, contentId, maxAttempts } = body as {
    title?: string;
    description?: string;
    priority?: string;
    agentId?: string;
    agentName?: string;
    contentId?: string;
    maxAttempts?: number;
  };

  if (!title) {
    return NextResponse.json({ error: "title is required" }, { status: 400 });
  }

  const validPriority: TaskPriority = VALID_PRIORITIES.has(priority as TaskPriority)
    ? (priority as TaskPriority)
    : "medium";

  const task = taskStore.createTask({
    title,
    description: description || "",
    status: "pending",
    priority: validPriority,
    agentId,
    agentName,
    contentId,
    maxAttempts: maxAttempts || 3,
  });

  return NextResponse.json({ task }, { status: 201 });
}
