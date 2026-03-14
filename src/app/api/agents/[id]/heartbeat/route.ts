import { NextResponse } from "next/server";
import { recordHeartbeat } from "@/lib/agents/agent-data";

export async function POST(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const agent = recordHeartbeat(params.id);
  if (!agent) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true, lastHeartbeat: agent.lastHeartbeat });
}
