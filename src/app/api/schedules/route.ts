/* GET /api/schedules — List all schedules
 * POST /api/schedules — Create a new schedule
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const schedules = await prisma.schedule.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { runs: true } } },
  });

  return NextResponse.json({ schedules });
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { name, cronExpr, taskType, taskConfig, enabled } = body as {
    name?: string;
    cronExpr?: string;
    taskType?: string;
    taskConfig?: Record<string, unknown>;
    enabled?: boolean;
  };

  if (!name || !cronExpr) {
    return NextResponse.json({ error: "name and cronExpr are required" }, { status: 400 });
  }

  // Basic 5-field cron validation
  const cronParts = cronExpr.trim().split(/\s+/);
  if (cronParts.length !== 5) {
    return NextResponse.json({ error: "Invalid cron: must have 5 fields (min hour dom mon dow)" }, { status: 400 });
  }

  const schedule = await prisma.schedule.create({
    data: {
      name,
      cronExpr,
      taskType: taskType || "general",
      taskConfig: (taskConfig || {}) as Record<string, string>,
      enabled: enabled !== false,
      nextRunAt: new Date(Date.now() + 3600000),
    },
  });

  return NextResponse.json({ schedule }, { status: 201 });
}
