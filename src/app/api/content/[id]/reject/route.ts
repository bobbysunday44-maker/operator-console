/* POST /api/content/[id]/reject — Reject content, send back to idea
 * Body: { notes?: string }
 * Changes status back to "idea"
 * Stores rejection notes in description
 * Logs rejection to ActivityLog
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { eventBus } from "@/lib/events/event-bus";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Parse optional body
  let notes: string | undefined;
  try {
    const body = await request.json();
    notes = body.notes;
  } catch {
    // Body is optional — no notes is fine
  }

  // Fetch content item
  const content = await prisma.contentItem.findUnique({ where: { id } });
  if (!content) {
    return NextResponse.json({ error: "Content not found" }, { status: 404 });
  }

  // Only allow rejection from review status
  if (content.status !== "review") {
    return NextResponse.json(
      { error: `Cannot reject content with status "${content.status}". Must be "review".` },
      { status: 400 }
    );
  }

  // Build updated description with rejection notes
  const timestamp = new Date().toISOString().slice(0, 16).replace("T", " ");
  const rejectionNote = notes
    ? `\n\n--- Rejected (${timestamp}) ---\n${notes}`
    : `\n\n--- Rejected (${timestamp}) ---\nNo notes provided.`;

  const updatedDescription = (content.description || "") + rejectionNote;

  // Update status back to idea and append rejection notes
  const updated = await prisma.contentItem.update({
    where: { id },
    data: {
      status: "idea",
      description: updatedDescription,
    },
    include: {
      pipelineRuns: { orderBy: { createdAt: "asc" } },
      socialPosts: { orderBy: { createdAt: "desc" }, take: 5 },
    },
  });

  // Log rejection to ActivityLog
  await prisma.activityLog.create({
    data: {
      type: "warning",
      message: `Content "${content.title}" rejected${notes ? `: ${notes}` : ""}`,
      source: "user",
      metadata: {
        contentId: id,
        notes: notes || null,
        previousStatus: content.status,
      },
    },
  });

  // Emit event
  eventBus.emit({
    type: "content_created",
    message: `Content "${content.title}" rejected`,
    metadata: { contentId: id, action: "rejected", notes },
  });

  return NextResponse.json({ item: updated });
}
