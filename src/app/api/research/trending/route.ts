/* GET /api/research/trending — List trending topics
 * POST /api/research/trending — Manually add a topic
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const niche = searchParams.get("niche");
  const status = searchParams.get("status");
  const platform = searchParams.get("platform");
  const limit = parseInt(searchParams.get("limit") || "50", 10);

  const where: Record<string, unknown> = {};
  if (niche) where.niche = niche;
  if (status) where.status = status;
  if (platform) where.platform = platform;

  const topics = await prisma.trendingTopic.findMany({
    where,
    orderBy: { viralityScore: "desc" },
    take: Math.min(limit, 100),
  });

  const niches = await prisma.trendingTopic.groupBy({
    by: ["niche"],
    _count: true,
  });

  return NextResponse.json({
    topics,
    niches: niches.map((n) => ({ niche: n.niche, count: n._count })),
    total: topics.length,
  });
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { title, description, niche, source, sourceUrl, platform, tags } = body as {
    title?: string;
    description?: string;
    niche?: string;
    source?: string;
    sourceUrl?: string;
    platform?: string;
    tags?: string[];
  };

  if (!title || !niche) {
    return NextResponse.json({ error: "title and niche are required" }, { status: 400 });
  }

  const topic = await prisma.trendingTopic.create({
    data: {
      title,
      description: description || null,
      niche,
      source: source || "manual",
      sourceUrl: sourceUrl || null,
      platform: platform || null,
      tags: tags || [],
      viralityScore: 50,
      status: "new",
    },
  });

  return NextResponse.json({ topic }, { status: 201 });
}
