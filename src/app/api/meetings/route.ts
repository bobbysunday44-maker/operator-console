/* GET /api/meetings — List all meetings
 * POST /api/meetings — Schedule a new meeting
 */

import { NextResponse } from "next/server";
import { getMeetings, scheduleMeeting } from "@/lib/agent-runtime/meeting-engine";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const meetings = await getMeetings(20);
    return NextResponse.json({ meetings });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const title = typeof body.title === "string" ? body.title : "";
  const type = typeof body.type === "string" ? body.type : "adhoc";
  const scheduledAt = body.scheduledAt ? new Date(body.scheduledAt as string) : new Date();
  const attendees = Array.isArray(body.attendees) ? (body.attendees as string[]) : undefined;
  const agenda = typeof body.agenda === "string" ? body.agenda : undefined;
  const channelName = typeof body.channelName === "string" ? body.channelName : undefined;

  if (!title) {
    return NextResponse.json({ error: "Meeting title is required" }, { status: 400 });
  }

  const validTypes = ["standup", "debrief", "retrospective", "strategy", "adhoc"];
  if (!validTypes.includes(type)) {
    return NextResponse.json(
      { error: `Invalid meeting type. Must be one of: ${validTypes.join(", ")}` },
      { status: 400 }
    );
  }

  try {
    const meeting = await scheduleMeeting(type, title, scheduledAt, attendees, agenda, channelName);
    return NextResponse.json({ meeting }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
