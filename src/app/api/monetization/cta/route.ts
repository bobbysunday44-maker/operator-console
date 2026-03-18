import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const niche = searchParams.get("niche");
  const where: Record<string, unknown> = {};
  if (niche) where.niche = niche;
  const templates = await prisma.cTATemplate.findMany({ where, orderBy: { conversionRate: "desc" } });
  return NextResponse.json({ templates });
}

export async function POST(request: Request) {
  const body = await request.json();
  const template = await prisma.cTATemplate.create({ data: body });
  return NextResponse.json({ template }, { status: 201 });
}
