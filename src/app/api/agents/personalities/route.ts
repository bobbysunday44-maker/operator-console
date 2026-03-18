import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { agentPersonalities } from "@/lib/agents/personalities";

export const dynamic = "force-dynamic";

/**
 * GET /api/agents/personalities
 * Returns all agent personality prompts.
 * - ?source=defaults  → returns the built-in defaults from personalities.ts
 * - ?source=db        → returns current DB values per agent
 * - (no param)        → returns merged view: DB value if set, else default
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const source = searchParams.get("source");

  // Return raw defaults only
  if (source === "defaults") {
    return NextResponse.json(agentPersonalities);
  }

  // Fetch all agents from DB
  const agents = await prisma.agent.findMany({
    select: { id: true, name: true, type: true, personality: true },
    orderBy: { name: "asc" },
  });

  // Return DB values only
  if (source === "db") {
    const result = agents.map((a) => ({
      id: a.id,
      name: a.name,
      type: a.type,
      personality: a.personality,
    }));
    return NextResponse.json(result);
  }

  // Default: merged view — DB personality if set, else built-in default
  const result = agents.map((a) => ({
    id: a.id,
    name: a.name,
    type: a.type,
    personality: a.personality || agentPersonalities[a.type] || null,
    isCustom: !!a.personality,
  }));

  return NextResponse.json(result);
}

/**
 * POST /api/agents/personalities
 * Update an agent's personality prompt.
 * Body: { agentId: string, personality: string }
 * Send personality as empty string or null to clear (revert to default).
 */
export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { agentId, personality } = body as { agentId?: string; personality?: string | null };

  if (!agentId) {
    return NextResponse.json({ error: "agentId is required" }, { status: 400 });
  }

  // Verify agent exists
  const existing = await prisma.agent.findUnique({ where: { id: agentId } });
  if (!existing) {
    return NextResponse.json({ error: `Agent not found: ${agentId}` }, { status: 404 });
  }

  // Update personality (null or empty string clears it, reverting to default)
  const newPersonality = personality && personality.trim() !== "" ? personality.trim() : null;

  const updated = await prisma.agent.update({
    where: { id: agentId },
    data: { personality: newPersonality },
    select: { id: true, name: true, type: true, personality: true },
  });

  // Log the change
  await prisma.activityLog.create({
    data: {
      type: "info",
      message: newPersonality
        ? `Personality updated for agent "${updated.name}"`
        : `Personality reset to default for agent "${updated.name}"`,
      source: "system",
      metadata: { agentId, agentType: updated.type },
    },
  });

  return NextResponse.json({
    ...updated,
    personality: updated.personality || agentPersonalities[updated.type] || null,
    isCustom: !!updated.personality,
  });
}
