/* GET /api/schedules/[id] — Get schedule detail
 * PATCH /api/schedules/[id] — Toggle schedule enabled/disabled
 */

import { NextResponse } from "next/server";
import { taskStore } from "@/lib/tasks/task-store";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const schedule = taskStore.getSchedule(params.id);
  if (!schedule) {
    return NextResponse.json({ error: "Schedule not found" }, { status: 404 });
  }
  return NextResponse.json({ schedule });
}

export async function PATCH(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const schedule = taskStore.toggleSchedule(params.id);
  if (!schedule) {
    return NextResponse.json({ error: "Schedule not found" }, { status: 404 });
  }
  return NextResponse.json({ schedule });
}
