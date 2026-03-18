/* GET /api/meetings/[id] — Get meeting details
 * POST /api/meetings/[id] — Start a meeting
 * PATCH /api/meetings/[id] — Update a meeting
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { startMeeting } from "@/lib/agent-runtime/meeting-engine";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const meeting = await prisma.meeting.findUnique({
      where: { id },
    });

    if (!meeting) {
      return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
    }

    return NextResponse.json({ meeting });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const { id } = await params;
  const action = typeof body.action === "string" ? body.action : "start";

  try {
    if (action === "start") {
      await startMeeting(id);
      return NextResponse.json({ success: true, message: "Meeting started" });
    }

    return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { id } = await params;

  try {
    const meeting = await prisma.meeting.findUnique({ where: { id } });
    if (!meeting) {
      return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};
    if (typeof body.title === "string") updateData.title = body.title;
    if (typeof body.agenda === "string") updateData.agenda = body.agenda;
    if (typeof body.status === "string") updateData.status = body.status;
    if (body.scheduledAt) updateData.scheduledAt = new Date(body.scheduledAt as string);
    if (Array.isArray(body.attendees)) updateData.attendees = body.attendees;

    const updated = await prisma.meeting.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ meeting: updated });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
