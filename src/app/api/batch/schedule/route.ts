/* POST /api/batch/schedule — Create mass posting schedule
 * GET /api/batch/schedule — Get schedule overview
 * DELETE /api/batch/schedule — Clear niche schedules
 */

import { NextResponse } from "next/server";
import { createMassSchedule, getScheduleOverview, clearNicheSchedules } from "@/lib/batch/mass-scheduler";

export async function GET() {
  const overview = await getScheduleOverview();
  return NextResponse.json({ overview });
}

export async function POST(request: Request) {
  const body = await request.json();
  const { niche, postsPerDay, startHour, endHour, daysOfWeek } = body;

  if (!niche || !postsPerDay) {
    return NextResponse.json({ error: "niche and postsPerDay required" }, { status: 400 });
  }

  const result = await createMassSchedule({ niche, postsPerDay, startHour, endHour, daysOfWeek });
  return NextResponse.json({ result }, { status: 201 });
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const niche = searchParams.get("niche");
  if (!niche) return NextResponse.json({ error: "niche required" }, { status: 400 });

  const deleted = await clearNicheSchedules(niche);
  return NextResponse.json({ deleted });
}
