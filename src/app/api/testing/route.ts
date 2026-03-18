import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { createABTest } from "@/lib/testing/ab-test-engine";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const niche = searchParams.get("niche");
  const where: Record<string, unknown> = {};
  if (niche) where.contentItem = { niche };

  const tests = await prisma.aBTest.findMany({
    where, include: { variants: true, contentItem: { select: { title: true, niche: true } } },
    orderBy: { createdAt: "desc" }, take: 20,
  });
  return NextResponse.json({ tests });
}

export async function POST(request: Request) {
  const { contentItemId, variants, name, winMetric } = await request.json();
  const test = await createABTest(contentItemId, variants, name, winMetric);
  return NextResponse.json({ test }, { status: 201 });
}
