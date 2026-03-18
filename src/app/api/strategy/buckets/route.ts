import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { initializeBuckets, getBucketRatios, suggestNextContent } from "@/lib/strategy/content-planner";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const niche = searchParams.get("niche") || "AI";
  const ratios = await getBucketRatios(niche);
  const suggestion = await suggestNextContent(niche);
  return NextResponse.json({ ratios, suggestion });
}

export async function POST(request: Request) {
  const { niche } = await request.json();
  const count = await initializeBuckets(niche);
  return NextResponse.json({ ok: true, bucketsCreated: count }, { status: 201 });
}

export async function PUT(request: Request) {
  const { buckets } = await request.json();
  for (const b of buckets) {
    await prisma.contentBucket.update({ where: { id: b.id }, data: { targetRatio: b.targetRatio } });
  }
  return NextResponse.json({ ok: true });
}
