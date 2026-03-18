import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getTopPerformingHooks, getBestPostingTime } from "@/lib/analytics/engagement-analyzer";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const niche = searchParams.get("niche");
  const days = parseInt(searchParams.get("days") || "30");
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const where: Record<string, unknown> = { capturedAt: { gte: since } };
  if (niche) where.post = { contentItem: { niche } };

  const performances = await prisma.contentPerformance.findMany({
    where, include: { post: { include: { platform: true, contentItem: { select: { title: true, niche: true } } } } },
    orderBy: { likes: "desc" }, take: 50,
  });

  const topHooks = niche ? await getTopPerformingHooks(niche, 5) : [];
  const bestTime = niche ? await getBestPostingTime(niche) : null;

  return NextResponse.json({ performances, topHooks, bestTime });
}
