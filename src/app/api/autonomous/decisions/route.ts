import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const niche = searchParams.get("niche");
  const where: Record<string, unknown> = {};
  if (niche) where.rule = { niche };
  const decisions = await prisma.autonomousDecision.findMany({
    where, include: { contentItem: { select: { title: true, niche: true } }, rule: { select: { name: true } } },
    orderBy: { createdAt: "desc" }, take: 50,
  });
  return NextResponse.json({ decisions });
}
