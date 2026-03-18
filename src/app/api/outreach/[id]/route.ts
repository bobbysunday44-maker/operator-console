import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { scheduleFollowUp } from "@/lib/outreach/outreach-engine";

export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const outreach = await prisma.outreach.findUnique({
      where: { id },
      include: {
        campaign: {
          select: { id: true, businessName: true, niche: true, status: true },
        },
      },
    });

    if (!outreach) {
      return NextResponse.json({ error: "Outreach not found" }, { status: 404 });
    }

    return NextResponse.json({ outreach });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch outreach" },
      { status: 500 }
    );
  }
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

  try {
    const existing = await prisma.outreach.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Outreach not found" }, { status: 404 });
    }

    // Handle follow-up scheduling
    if (body.scheduleFollowUp && typeof body.followUpDays === "number") {
      const updated = await scheduleFollowUp(id, body.followUpDays as number);
      return NextResponse.json({ outreach: updated });
    }

    // Build update data
    const data: Record<string, unknown> = {};
    if (body.status !== undefined) {
      data.status = body.status;
      // Auto-set timestamps based on status transitions
      if (body.status === "sent" && !existing.sentAt) data.sentAt = new Date();
      if (body.status === "opened" && !existing.openedAt) data.openedAt = new Date();
      if (body.status === "replied" && !existing.repliedAt) data.repliedAt = new Date();
    }
    if (body.subject !== undefined) data.subject = body.subject;
    if (body.messageBody !== undefined) data.messageBody = body.messageBody;
    if (body.response !== undefined) data.response = body.response;
    if (body.contactName !== undefined) data.contactName = body.contactName;
    if (body.channel !== undefined) data.channel = body.channel;
    if (body.campaignId !== undefined) data.campaignId = body.campaignId;

    const outreach = await prisma.outreach.update({ where: { id }, data });
    return NextResponse.json({ outreach });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to update outreach" },
      { status: 500 }
    );
  }
}
