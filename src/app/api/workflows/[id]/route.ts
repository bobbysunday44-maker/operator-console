import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const workflow = await prisma.workflow.findUnique({
    where: { id },
    include: { runs: { take: 10, orderBy: { startedAt: "desc" } } },
  });
  if (!workflow) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ workflow });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();
  const workflow = await prisma.workflow.update({ where: { id }, data: body });
  return NextResponse.json({ workflow });
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.workflow.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
