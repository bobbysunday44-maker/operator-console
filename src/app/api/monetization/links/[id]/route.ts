import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const link = await prisma.affiliateLink.findUnique({ where: { id }, include: { events: { take: 20, orderBy: { createdAt: "desc" } } } });
  if (!link) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ link });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();
  const link = await prisma.affiliateLink.update({ where: { id }, data: body });
  return NextResponse.json({ link });
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.affiliateLink.update({ where: { id }, data: { isActive: false } });
  return NextResponse.json({ ok: true });
}
