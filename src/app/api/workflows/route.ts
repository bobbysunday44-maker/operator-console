import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function GET() {
  const workflows = await prisma.workflow.findMany({
    orderBy: { updatedAt: "desc" },
    select: { id: true, name: true, niche: true, isDefault: true, isActive: true, updatedAt: true },
  });
  return NextResponse.json({ workflows });
}

export async function POST(request: Request) {
  const { name, description, niche, characterId, nodes, edges, config } = await request.json();

  const workflow = await prisma.workflow.create({
    data: {
      name: name || "Untitled Workflow",
      description,
      niche,
      characterId,
      nodes: nodes || [],
      edges: edges || [],
      config,
    },
  });

  return NextResponse.json({ workflow }, { status: 201 });
}
