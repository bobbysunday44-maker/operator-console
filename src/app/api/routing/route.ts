/* GET /api/routing — List routing rules + model configs
 * GET /api/routing?view=traces — List LLM traces
 * GET /api/routing?view=usage — Model usage stats
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const view = request.nextUrl.searchParams.get("view");

  if (view === "traces") {
    const limit = Math.min(parseInt(request.nextUrl.searchParams.get("limit") || "50", 10), 200);
    const traces = await prisma.obsTrace.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
      include: { spans: { orderBy: { startedAt: "asc" } } },
    });
    return NextResponse.json({ traces });
  }

  if (view === "usage") {
    const usage = await prisma.modelUsageLog.groupBy({
      by: ["model"],
      _sum: { tokensIn: true, tokensOut: true, cost: true, latency: true },
      _count: true,
      _avg: { latency: true },
    });

    const formatted = usage.map((u) => ({
      model: u.model,
      requests: u._count,
      tokensIn: u._sum.tokensIn || 0,
      tokensOut: u._sum.tokensOut || 0,
      totalCost: u._sum.cost || 0,
      avgLatencyMs: Math.round(u._avg.latency || 0),
    }));

    return NextResponse.json({ usage: formatted });
  }

  const rules = await prisma.modelRoute.findMany({ orderBy: { priority: "asc" } });

  return NextResponse.json({ rules });
}
