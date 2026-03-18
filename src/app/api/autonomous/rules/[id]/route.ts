import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const rule = await prisma.autonomousRule.findUnique({ where: { id }, include: { decisions: { take: 10, orderBy: { createdAt: "desc" } } } });
  if (!rule) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ rule });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();
  const rule = await prisma.autonomousRule.update({ where: { id }, data: body });
  return NextResponse.json({ rule });
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.autonomousRule.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
