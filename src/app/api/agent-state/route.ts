/* ── Agent State API ──
 * GET:   get all agent states (for office view)
 * PATCH: update an agent's state manually
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function GET() {
  try {
    const states = await prisma.agentState.findMany({
      include: {
        agent: {
          select: {
            id: true,
            name: true,
            type: true,
            status: true,
            openness: true,
            conscientiousness: true,
            extraversion: true,
            agreeableness: true,
            neuroticism: true,
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json({ states });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch agent states" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { agentId, position, activity, mood, energy, currentThought, talkingTo } = body;

  if (!agentId || typeof agentId !== "string") {
    return NextResponse.json({ error: "agentId is required" }, { status: 400 });
  }

  try {
    // Build update data — only include provided fields
    const updateData: Record<string, unknown> = {};
    if (position !== undefined) updateData.position = position;
    if (activity !== undefined) updateData.activity = activity;
    if (mood !== undefined) updateData.mood = mood;
    if (energy !== undefined) {
      const e = typeof energy === "number" ? Math.max(0, Math.min(1, energy)) : 1.0;
      updateData.energy = e;
    }
    if (currentThought !== undefined) updateData.currentThought = currentThought;
    if (talkingTo !== undefined) updateData.talkingTo = talkingTo;

    const state = await prisma.agentState.upsert({
      where: { agentId: agentId as string },
      update: updateData,
      create: {
        agentId: agentId as string,
        position: (position as string) ?? "desk",
        activity: (activity as string) ?? "idle",
        mood: (mood as string) ?? "neutral",
        energy: typeof energy === "number" ? Math.max(0, Math.min(1, energy)) : 1.0,
        currentThought: (currentThought as string) ?? null,
        talkingTo: (talkingTo as string) ?? null,
      },
      include: {
        agent: { select: { id: true, name: true, type: true } },
      },
    });

    return NextResponse.json({ state });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to update agent state" },
      { status: 500 }
    );
  }
}
