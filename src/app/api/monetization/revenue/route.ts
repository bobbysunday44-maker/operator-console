import { NextResponse } from "next/server";
import { trackClick, trackConversion } from "@/lib/monetization/affiliate-manager";
import { prisma } from "@/lib/db/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const days = parseInt(searchParams.get("days") || "30");
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const events = await prisma.revenueEvent.findMany({
    where: { createdAt: { gte: since } },
    include: { affiliateLink: { select: { name: true, niche: true } } },
    orderBy: { createdAt: "desc" }, take: 100,
  });
  return NextResponse.json({ events });
}

export async function POST(request: Request) {
  const { shortCode, type, amount, source, postId } = await request.json();
  if (type === "click") {
    await trackClick(shortCode, source);
  } else {
    await trackConversion(shortCode, amount || 0, type, postId);
  }
  return NextResponse.json({ ok: true }, { status: 201 });
}
