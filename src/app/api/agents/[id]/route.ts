import { NextResponse } from "next/server";
import { getAgentById, updateAgent } from "@/lib/agents/agent-data";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const agent = getAgentById(params.id);
  if (!agent) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  }
  return NextResponse.json(agent);
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const body = await request.json();
  const updated = updateAgent(params.id, body);
  if (!updated) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  }
  return NextResponse.json(updated);
}
