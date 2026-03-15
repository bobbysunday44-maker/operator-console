/* GET /api/schedules/[id] — Get schedule detail
 * PATCH /api/schedules/[id] — Toggle enabled or update fields
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const schedule = await prisma.schedule.findUnique({
    where: { id },
    include: { runs: { orderBy: { startedAt: "desc" }, take: 10 } },
  });

  if (!schedule) {
    return NextResponse.json({ error: "Schedule not found" }, { status: 404 });
  }
  return NextResponse.json({ schedule });
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
    // Toggle if no body
    body = {};
  }

  const schedule = await prisma.schedule.findUnique({ where: { id } });
  if (!schedule) {
    return NextResponse.json({ error: "Schedule not found" }, { status: 404 });
  }

  // If no explicit enabled field, toggle it
  const enabled = typeof body.enabled === "boolean" ? body.enabled : !schedule.enabled;

  const updated = await prisma.schedule.update({
    where: { id },
    data: {
      enabled,
      name: typeof body.name === "string" ? body.name : undefined,
      cronExpr: typeof body.cronExpr === "string" ? body.cronExpr : undefined,
    },
  });

  return NextResponse.json({ schedule: updated });
}
