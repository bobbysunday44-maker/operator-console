import { NextResponse } from "next/server";
import { getAllAgents, getAgentStats } from "@/lib/agents/agent-data";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const view = searchParams.get("view");

  if (view === "stats") {
    return NextResponse.json(getAgentStats());
  }

  const status = searchParams.get("status");
  let agents = getAllAgents();

  if (status) {
    agents = agents.filter((a) => a.status === status);
  }

  return NextResponse.json(agents);
}
