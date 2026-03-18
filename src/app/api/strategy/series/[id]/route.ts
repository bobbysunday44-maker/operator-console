import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { generateNextEpisode } from "@/lib/strategy/series-manager";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const series = await prisma.contentSeries.findUnique({ where: { id } });
  if (!series) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ series });
}

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const episode = await generateNextEpisode(id);
  return NextResponse.json({ episode }, { status: 201 });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();
  const series = await prisma.contentSeries.update({ where: { id }, data: body });
  return NextResponse.json({ series });
}
