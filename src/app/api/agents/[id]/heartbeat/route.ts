import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const agent = await prisma.agent.update({
      where: { id },
      data: {
        lastHeartbeat: new Date(),
        status: "active",
      },
    });
    return NextResponse.json({ ok: true, lastHeartbeat: agent.lastHeartbeat });
  } catch {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  }
}
