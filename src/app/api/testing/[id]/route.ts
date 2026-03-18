import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { evaluateTest } from "@/lib/testing/ab-test-engine";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const test = await prisma.aBTest.findUnique({
    where: { id }, include: { variants: true, contentItem: { select: { title: true } } },
  });
  if (!test) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ test });
}

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await evaluateTest(id);
  return NextResponse.json({ result });
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.aBTest.update({ where: { id }, data: { status: "cancelled", endedAt: new Date() } });
  return NextResponse.json({ ok: true });
}
