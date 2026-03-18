import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const niche = searchParams.get("niche");
  const where: Record<string, unknown> = {};
  if (niche) where.niche = niche;
  const links = await prisma.affiliateLink.findMany({ where, orderBy: { revenue: "desc" }, take: 50 });
  return NextResponse.json({ links });
}

export async function POST(request: Request) {
  const body = await request.json();
  const link = await prisma.affiliateLink.create({ data: body });
  return NextResponse.json({ link }, { status: 201 });
}
