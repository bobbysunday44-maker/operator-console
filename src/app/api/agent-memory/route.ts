/* ── Agent Memory API ──
 * GET:  list memories for an agent (query: agentId, type, limit)
 * POST: add a memory manually
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { addMemory } from "@/lib/agent-runtime/memory-stream";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const agentId = searchParams.get("agentId");
    const type = searchParams.get("type");
    const limitParam = searchParams.get("limit");
    const limit = limitParam ? parseInt(limitParam, 10) : 50;

    if (!agentId) {
      return NextResponse.json({ error: "agentId is required" }, { status: 400 });
    }

    const where: Record<string, unknown> = { agentId };
    if (type) where.type = type;

    const memories = await prisma.agentMemoryEntry.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: Math.min(limit, 200),
    });

    // Also get reflections
    const reflections = await prisma.agentReflection.findMany({
      where: { agentId },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    return NextResponse.json({ memories, reflections });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch memories" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { agentId, content, type, importance, source, relatedTo, tags } = body;

  if (!agentId || typeof agentId !== "string") {
    return NextResponse.json({ error: "agentId is required" }, { status: 400 });
  }
  if (!content || typeof content !== "string") {
    return NextResponse.json({ error: "content is required" }, { status: 400 });
  }

  try {
    const memoryId = await addMemory(
      agentId,
      content,
      (type as string) ?? "experience",
      importance as number | undefined,
      (source as string) ?? undefined,
      (relatedTo as string) ?? undefined,
      (tags as string[]) ?? []
    );

    return NextResponse.json({ id: memoryId }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to add memory" },
      { status: 500 }
    );
  }
}
