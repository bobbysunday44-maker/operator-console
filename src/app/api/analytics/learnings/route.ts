import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { generateLearnings } from "@/lib/analytics/feedback-engine";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const niche = searchParams.get("niche") || "AI";

  const learnings = await prisma.performanceLearning.findMany({
    where: { niche }, orderBy: { winRate: "desc" }, take: 30,
  });
  return NextResponse.json({ learnings });
}

export async function POST(request: Request) {
  const { niche } = await request.json();
  const count = await generateLearnings(niche || "AI");
  return NextResponse.json({ ok: true, learningsGenerated: count });
}
