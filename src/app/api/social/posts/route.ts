/* GET /api/social/posts — List posts
 * POST /api/social/posts — Create a new post
 *
 * Query: ?status=draft|scheduled|posting|posted|failed
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const rawStatus = request.nextUrl.searchParams.get("status");

  const where = rawStatus ? { status: rawStatus as "draft" | "scheduled" | "posting" | "posted" | "failed" } : {};

  const posts = await prisma.socialPost.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      platform: { select: { name: true } },
      contentItem: { select: { id: true, title: true } },
    },
    take: 50,
  });

  return NextResponse.json({ posts });
}

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { contentItemId, platformId, content, mediaUrls, scheduledAt } = body as {
    contentItemId?: string;
    platformId?: string;
    content?: string;
    mediaUrls?: string[];
    scheduledAt?: string;
  };

  if (!content || !platformId) {
    return NextResponse.json({ error: "content and platformId are required" }, { status: 400 });
  }

  const post = await prisma.socialPost.create({
    data: {
      contentItemId: contentItemId || null,
      platformId,
      content,
      mediaUrls: mediaUrls || [],
      status: scheduledAt ? "scheduled" : "draft",
      scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
    },
  });

  return NextResponse.json({ post }, { status: 201 });
}
