/* GET /api/archive/[id] — Get archived content detail */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const item = await prisma.contentItem.findUnique({
    where: { id },
    include: {
      assets: true,
      pipelineRuns: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!item) {
    return NextResponse.json({ error: "Content not found" }, { status: 404 });
  }
  return NextResponse.json({ item });
}
