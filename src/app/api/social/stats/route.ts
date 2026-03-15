/* GET /api/social/stats — Social media stats + platform info */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [platforms, postStats, mentionStats, totalPosts, totalMentions] = await Promise.all([
    prisma.platform.findMany({ orderBy: { name: "asc" } }),
    prisma.socialPost.groupBy({
      by: ["status"],
      _count: true,
    }),
    prisma.mention.aggregate({
      _count: true,
      where: { isReplied: false },
    }),
    prisma.socialPost.count(),
    prisma.mention.count(),
  ]);

  const postStatusMap = Object.fromEntries(postStats.map((s) => [s.status, s._count]));

  return NextResponse.json({
    stats: {
      totalPosts,
      posted: postStatusMap.posted || 0,
      scheduled: postStatusMap.scheduled || 0,
      draft: postStatusMap.draft || 0,
      failed: postStatusMap.failed || 0,
      totalMentions,
      unrepliedMentions: mentionStats._count,
    },
    platforms: platforms.map((p) => ({
      id: p.id,
      name: p.name,
      handle: p.handle,
      connected: p.connected,
      followers: p.followers,
    })),
  });
}
