/* GET /api/social/posts — List scheduled/published posts
 * POST /api/social/posts — Create a new scheduled post
 *
 * Query: ?status=scheduled|published|draft
 */

import { NextRequest, NextResponse } from "next/server";
import { socialStore } from "@/lib/social/social-store";
import type { PostStatus, PlatformId } from "@/lib/social/types";

const VALID_STATUSES = new Set<PostStatus>(["draft", "scheduled", "publishing", "published", "failed"]);

export async function GET(request: NextRequest) {
  const rawStatus = request.nextUrl.searchParams.get("status");
  const status = rawStatus && VALID_STATUSES.has(rawStatus as PostStatus) ? (rawStatus as PostStatus) : undefined;
  const posts = socialStore.listPosts(status);

  return NextResponse.json({ posts });
}

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { contentId, title, caption, platforms, scheduledAt, mediaType } = body as {
    contentId?: string;
    title?: string;
    caption?: string;
    platforms?: PlatformId[];
    scheduledAt?: number;
    mediaType?: string;
  };

  if (!caption || !platforms || !Array.isArray(platforms) || platforms.length === 0) {
    return NextResponse.json({ error: "caption and platforms[] are required" }, { status: 400 });
  }

  const post = socialStore.createPost({
    contentId: contentId || `CNT-${Date.now()}`,
    title: title || caption.slice(0, 40),
    caption,
    platforms,
    status: scheduledAt ? "scheduled" : "draft",
    scheduledAt: scheduledAt || Date.now(),
    mediaType: (["video", "image", "text", "carousel"].includes(mediaType || "") ? mediaType : "text") as "video" | "image" | "text" | "carousel",
  });

  return NextResponse.json({ post }, { status: 201 });
}
