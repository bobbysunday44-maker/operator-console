/* GET /api/content — List content items
 * POST /api/content — Create a new content item
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import type { ContentStatus } from "@/generated/prisma/client";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const status = request.nextUrl.searchParams.get("status");
  const where = status ? { status: status as ContentStatus } : {};

  const items = await prisma.contentItem.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { pipelineRuns: true, assets: true, socialPosts: true } },
    },
    take: 50,
  });

  return NextResponse.json({ items });
}

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { title, description, niche, tags, targetPlatforms } = body as {
    title?: string;
    description?: string;
    niche?: string;
    tags?: string[];
    targetPlatforms?: string[];
  };

  if (!title) {
    return NextResponse.json({ error: "title is required" }, { status: 400 });
  }

  const item = await prisma.contentItem.create({
    data: {
      title,
      description: description || null,
      niche: niche || null,
      tags: tags || [],
      targetPlatforms: targetPlatforms || [],
      status: "idea",
      qualityTier: "ai_reviewer",
      totalCost: 0,
    },
  });

  // Log activity
  await prisma.activityLog.create({
    data: {
      type: "success",
      message: `Content "${title}" created`,
      source: "studio",
    },
  });

  return NextResponse.json({ item }, { status: 201 });
}
