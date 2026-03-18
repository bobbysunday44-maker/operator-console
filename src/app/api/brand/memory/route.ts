import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { recordInsight } from "@/lib/memory/brand-memory";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const niche = searchParams.get("niche") || "AI";
  const memories = await prisma.brandMemory.findMany({
    where: { niche }, orderBy: { confidence: "desc" }, take: 50,
  });
  return NextResponse.json({ memories });
}

export async function POST(request: Request) {
  const { niche, category, insight, source, isPositive } = await request.json();
  const memory = await recordInsight(niche, category, insight, source, isPositive);
  return NextResponse.json({ memory }, { status: 201 });
}
