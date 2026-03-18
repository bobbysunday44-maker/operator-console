/* GET /api/repurpose — List repurposed content (optional ?sourceContentId= filter)
 * POST /api/repurpose — Repurpose a content item { contentItemId, formats[] }
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { repurposeContent, getRepurposeOptions } from "@/lib/repurpose/repurpose-engine";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const sourceContentId = request.nextUrl.searchParams.get("sourceContentId");
  const format = request.nextUrl.searchParams.get("format");
  const platform = request.nextUrl.searchParams.get("platform");

  // If requesting options for a specific content item
  const optionsFor = request.nextUrl.searchParams.get("optionsFor");
  if (optionsFor) {
    try {
      const options = await getRepurposeOptions(optionsFor);
      return NextResponse.json(options);
    } catch (err) {
      return NextResponse.json(
        { error: err instanceof Error ? err.message : "Failed to get options" },
        { status: 404 }
      );
    }
  }

  // Build where filter
  const where: Record<string, unknown> = {};
  if (sourceContentId) where.sourceContentId = sourceContentId;
  if (format) where.format = format;
  if (platform) where.platform = platform;

  const items = await prisma.repurposedContent.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      sourceContent: {
        select: { id: true, title: true, status: true, niche: true },
      },
    },
    take: 100,
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

  const { contentItemId, formats } = body as {
    contentItemId?: string;
    formats?: string[];
  };

  if (!contentItemId) {
    return NextResponse.json({ error: "contentItemId is required" }, { status: 400 });
  }

  if (!formats || !Array.isArray(formats) || formats.length === 0) {
    return NextResponse.json(
      { error: "formats is required (array of format:platform strings, e.g. ['short_clip:TikTok', 'thread:Twitter/X'])" },
      { status: 400 }
    );
  }

  try {
    const results = await repurposeContent(contentItemId, formats);
    return NextResponse.json({ results }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Repurpose failed";
    const status = message.includes("not found") ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
