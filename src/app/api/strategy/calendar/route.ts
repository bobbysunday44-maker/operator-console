import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { generateWeeklyCalendar } from "@/lib/strategy/content-planner";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const niche = searchParams.get("niche") || "AI";
  const entries = await prisma.contentCalendar.findMany({
    where: { niche }, include: { bucket: true, series: true, contentItem: { select: { title: true, status: true } } },
    orderBy: { scheduledDate: "asc" }, take: 30,
  });
  return NextResponse.json({ entries });
}

export async function POST(request: Request) {
  const { niche, startDate } = await request.json();
  const entries = await generateWeeklyCalendar(niche, new Date(startDate || Date.now()));
  return NextResponse.json({ entries, count: entries.length }, { status: 201 });
}
