import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { scanCompetitor } from "@/lib/competitors/competitor-analyzer";

export async function POST(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    // Verify competitor exists
    const existing = await prisma.competitor.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Competitor not found" }, { status: 404 });
    }

    if (!existing.isActive) {
      return NextResponse.json(
        { error: "Cannot scan inactive competitor" },
        { status: 400 }
      );
    }

    const scan = await scanCompetitor(id);
    return NextResponse.json({ scan }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to scan competitor" },
      { status: 500 }
    );
  }
}
