/* GET /api/channels — List all channels with info
 * POST /api/channels — Create a new channel
 */

import { NextResponse } from "next/server";
import { getChannelsWithInfo, getAgentsForChat } from "@/lib/agent-runtime/agent-chat";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [channels, agents] = await Promise.all([
      getChannelsWithInfo(),
      getAgentsForChat(),
    ]);

    return NextResponse.json({ channels, agents });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim().toLowerCase() : "";
  const description = typeof body.description === "string" ? body.description : null;

  if (!name) {
    return NextResponse.json({ error: "Channel name is required" }, { status: 400 });
  }

  // Validate channel name: lowercase, alphanumeric + hyphens
  if (!/^[a-z0-9-]+$/.test(name)) {
    return NextResponse.json(
      { error: "Channel name must be lowercase alphanumeric with hyphens only" },
      { status: 400 }
    );
  }

  try {
    const existing = await prisma.chatChannel.findUnique({ where: { name } });
    if (existing) {
      return NextResponse.json({ error: "Channel already exists" }, { status: 409 });
    }

    const channel = await prisma.chatChannel.create({
      data: { name, description },
    });

    return NextResponse.json({ channel }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
