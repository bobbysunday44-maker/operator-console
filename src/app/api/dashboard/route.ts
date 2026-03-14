import { NextResponse } from "next/server";
import { getAgentStats, getAllAgents } from "@/lib/agents/agent-data";

export const dynamic = "force-dynamic";

export async function GET() {
  const agentStats = getAgentStats();
  const agents = getAllAgents();

  // Aggregate dashboard KPIs
  const activeAgents = agentStats.online + agentStats.busy;
  const contentToday = 12; // TODO: query content_items table
  const totalTasks = agentStats.totalTasks;
  const pipelineRuns = 8; // TODO: query pipeline_runs table

  // Agent summary for the fleet widget
  const agentSummary = agents.map((a) => ({
    id: a.id,
    name: a.name,
    status: a.status,
    currentTask: a.currentTask,
    model: a.model,
  }));

  return NextResponse.json({
    kpis: {
      activeAgents,
      totalAgents: agentStats.total,
      contentToday,
      totalTasks,
      pipelineRuns,
      totalTokens: agentStats.totalTokens,
      costToday: agentStats.totalCostToday,
    },
    agents: agentSummary,
  });
}
