/* ── Auto Publisher ──
 * Handles autonomous content approval and publishing.
 * Creates SocialPosts and notifies Bobby.
 */

import { prisma } from "@/lib/db/prisma";

export async function processAutoApproval(contentItemId: string, ruleId: string) {
  const rule = await prisma.autonomousRule.findUnique({ where: { id: ruleId } });
  const content = await prisma.contentItem.findUnique({ where: { id: contentItemId } });

  if (!rule || !content) throw new Error("Rule or content not found");

  // If delay configured, schedule for later (gives Bobby time to override)
  if (rule.autoApproveAfterMinutes > 0) {
    // Mark as pending auto-approval
    await prisma.contentItem.update({
      where: { id: contentItemId },
      data: { status: "approved" },
    });

    await prisma.activityLog.create({
      data: {
        type: "info",
        message: `Auto-approval pending: "${content.title}" will publish in ${rule.autoApproveAfterMinutes} minutes unless overridden.`,
        source: "system",
      },
    });

    return { status: "pending", publishesIn: rule.autoApproveAfterMinutes };
  }

  // Instant approval
  await prisma.contentItem.update({
    where: { id: contentItemId },
    data: { status: "approved" },
  });

  // Create social posts for matching niche platforms
  const nicheFilter = content.niche
    ? { OR: [{ niche: content.niche }, { niche: "" }] }
    : {};

  const platforms = await prisma.platform.findMany({
    where: {
      name: { in: content.targetPlatforms },
      connected: true,
      ...nicheFilter,
    },
  });

  if (platforms.length > 0) {
    await prisma.socialPost.createMany({
      data: platforms.map((p) => ({
        platformId: p.id,
        contentItemId,
        content: content.script || content.title,
        status: "scheduled" as const,
        scheduledAt: new Date(Date.now() + 60 * 60 * 1000),
      })),
    });
  }

  await prisma.activityLog.create({
    data: {
      type: "success",
      message: `Autonomous: auto-approved "${content.title}" → ${platforms.length} platforms`,
      source: "system",
    },
  });

  return { status: "approved", platforms: platforms.length };
}
