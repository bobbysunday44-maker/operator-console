/* ── Post-Approval Publishing ──
 * After Bobby approves content, queue all social posts for publishing.
 */

import { prisma } from "@/lib/db/prisma";
import { socialPostingQueue } from "@/lib/queue/queues";
import { eventBus } from "@/lib/events/event-bus";
import { notifyBobby } from "@/lib/notifications/telegram-notify";

export async function publishApprovedContent(contentItemId: string): Promise<void> {
  const content = await prisma.contentItem.findUnique({
    where: { id: contentItemId },
    include: {
      socialPosts: {
        where: { status: "scheduled" },
        include: { platform: true },
      },
    },
  });

  if (!content) throw new Error(`Content ${contentItemId} not found`);

  if (content.socialPosts.length === 0) {
    console.log(`[Publish] No scheduled posts for content ${contentItemId}`);
    return;
  }

  // Queue each scheduled post
  const platformNames: string[] = [];
  for (const post of content.socialPosts) {
    await socialPostingQueue().add(`publish-${post.id}`, {
      postId: post.id,
      platformId: post.platformId,
      content: post.content,
      mediaUrls: post.mediaUrls,
    });
    platformNames.push(post.platform.name);
  }

  // Update content status
  await prisma.contentItem.update({
    where: { id: contentItemId },
    data: { status: "published" },
  });

  // Log
  await prisma.activityLog.create({
    data: {
      type: "success",
      message: `Content "${content.title}" queued for publishing to ${platformNames.join(", ")}`,
      source: "system",
    },
  });

  eventBus.emit({
    type: "post_published",
    agentName: "Opus",
    message: `Publishing "${content.title}" to ${platformNames.join(", ")}`,
    metadata: { contentItemId, platforms: platformNames },
  });

  // Notify Bobby
  await notifyBobby([
    `*Publishing Queued*`,
    `Content: ${content.title}`,
    `Platforms: ${platformNames.join(", ")}`,
    `Posts: ${content.socialPosts.length} scheduled`,
    ``,
    `I'll confirm when each platform posts successfully.`,
  ].join("\n"));
}
