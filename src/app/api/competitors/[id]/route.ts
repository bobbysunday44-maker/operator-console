import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getCompetitorReport } from "@/lib/competitors/competitor-analyzer";

export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const report = await getCompetitorReport(id);
    return NextResponse.json({ report });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch competitor";
    const status = message === "Competitor not found" ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const existing = await prisma.competitor.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Competitor not found" }, { status: 404 });
    }

    // Soft delete — mark inactive instead of hard delete
    await prisma.competitor.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to delete competitor" },
      { status: 500 }
    );
  }
}
