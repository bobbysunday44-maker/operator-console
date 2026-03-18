/* POST /api/content/[id]/approve — Approve content for publishing
 * Changes status from "review" to "approved"
 * Creates SocialPost records for each target platform
 * Logs approval to ActivityLog
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { eventBus } from "@/lib/events/event-bus";
import { publishApprovedContent } from "@/lib/pipeline/post-publish";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Fetch content item and verify status
  const existing = await prisma.contentItem.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Content not found" }, { status: 404 });
  }

  if (existing.status !== "review") {
    return NextResponse.json(
      { error: `Cannot approve content with status "${existing.status}". Must be "review".` },
      { status: 400 }
    );
  }

  // Update status to approved
  const content = await prisma.contentItem.update({
    where: { id },
    data: { status: "approved" },
    include: {
      pipelineRuns: { orderBy: { createdAt: "asc" } },
      socialPosts: { orderBy: { createdAt: "desc" }, take: 5 },
    },
  });

  // Create SocialPost records for matching niche platforms
  if (content.targetPlatforms.length > 0) {
    // Find platforms matching both target platform names AND content niche
    const nicheFilter = content.niche
      ? { OR: [{ niche: content.niche }, { niche: "" }] } // match niche or niche-agnostic platforms
      : {};

    const platforms = await prisma.platform.findMany({
      where: {
        name: { in: content.targetPlatforms },
        connected: true,
        ...nicheFilter,
      },
    });

    const postData = platforms.map((platform) => ({
      platformId: platform.id,
      contentItemId: id,
      content: content.script || content.title,
      mediaUrls: content.finalOutput ? [content.finalOutput] : [],
      status: "scheduled" as const,
      scheduledAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
    }));

    if (postData.length > 0) {
      await prisma.socialPost.createMany({ data: postData });
    }
  }

  // Log approval to ActivityLog
  await prisma.activityLog.create({
    data: {
      type: "success",
      message: `Content "${content.title}" approved for publishing`,
      source: "user",
      metadata: {
        contentId: id,
        targetPlatforms: content.targetPlatforms,
        previousStatus: content.status,
      },
    },
  });

  // Emit event
  eventBus.emit({
    type: "content_created",
    message: `Content "${content.title}" approved`,
    metadata: { contentId: id, action: "approved" },
  });

  // Queue all social posts for publishing
  try {
    await publishApprovedContent(id);
  } catch (err) {
    console.error("[Approve] Publishing failed:", err);
    // Don't fail the approval — posts are created, publishing can be retried
  }

  // Re-fetch with social posts included
  const final = await prisma.contentItem.findUnique({
    where: { id },
    include: {
      pipelineRuns: { orderBy: { createdAt: "asc" } },
      socialPosts: { orderBy: { createdAt: "desc" }, take: 10 },
    },
  });

  return NextResponse.json({ item: final });
}
