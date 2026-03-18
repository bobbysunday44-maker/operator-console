import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const niche = searchParams.get("niche");
  const where: Record<string, unknown> = {};
  if (niche) where.niche = niche;
  const rules = await prisma.autonomousRule.findMany({ where, orderBy: { createdAt: "desc" } });
  return NextResponse.json({ rules });
}

export async function POST(request: Request) {
  const body = await request.json();
  const rule = await prisma.autonomousRule.create({ data: { ...body, isActive: false } });
  return NextResponse.json({ rule }, { status: 201 });
}
