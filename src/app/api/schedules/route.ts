/* GET /api/schedules — List all schedules
 * POST /api/schedules — Create a new schedule
 */

import { NextResponse } from "next/server";
import { taskStore } from "@/lib/tasks/task-store";
import type { ScheduleFrequency, TaskPriority } from "@/lib/tasks/types";

export async function GET() {
  const schedules = taskStore.listSchedules();
  return NextResponse.json({ schedules });
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { name, description, cron, frequency, taskTitle, agentId, agentName, priority } = body as {
    name?: string;
    description?: string;
    cron?: string;
    frequency?: string;
    taskTitle?: string;
    agentId?: string;
    agentName?: string;
    priority?: string;
  };

  if (!name || !cron) {
    return NextResponse.json({ error: "name and cron are required" }, { status: 400 });
  }

  // Basic cron format validation (5 fields: min hour dom mon dow)
  const cronParts = cron.trim().split(/\s+/);
  if (cronParts.length !== 5) {
    return NextResponse.json({ error: "Invalid cron: must have 5 fields (min hour dom mon dow)" }, { status: 400 });
  }

  const validFreq: ScheduleFrequency = (["hourly", "daily", "weekly", "custom"].includes(frequency || "")
    ? frequency
    : "custom") as ScheduleFrequency;

  const validPriority: TaskPriority = (["low", "medium", "high", "critical"].includes(priority || "")
    ? priority
    : "medium") as TaskPriority;

  const schedule = taskStore.createSchedule({
    name,
    description: description || "",
    cron,
    frequency: validFreq,
    enabled: true,
    taskTemplate: {
      title: taskTitle || name,
      agentId,
      agentName,
      priority: validPriority,
    },
    nextRunAt: Date.now() + 3600000,
  });

  return NextResponse.json({ schedule }, { status: 201 });
}
