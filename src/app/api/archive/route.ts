/* GET /api/archive — List archived content
 * Query: ?status=...&type=video|image|text&search=keyword&view=stats
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const rawStatus = request.nextUrl.searchParams.get("status");
  const rawType = request.nextUrl.searchParams.get("type");
  const search = request.nextUrl.searchParams.get("search");
  const rawView = request.nextUrl.searchParams.get("view");

  if (rawView === "stats") {
    const [total, byStatus] = await Promise.all([
      prisma.contentItem.count(),
      prisma.contentItem.groupBy({ by: ["status"], _count: true }),
    ]);

    const statusMap = Object.fromEntries(byStatus.map((s) => [s.status, s._count]));
    return NextResponse.json({ total, byStatus: statusMap });
  }

  const where: Record<string, unknown> = {};
  if (rawStatus) where.status = rawStatus;
  if (rawType) {
    where.targetPlatforms = { has: rawType };
  }
  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
    ];
  }

  const items = await prisma.contentItem.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      assets: { select: { id: true, type: true, fileName: true, mimeType: true } },
      _count: { select: { pipelineRuns: true } },
    },
    take: 50,
  });

  return NextResponse.json({ items });
}
