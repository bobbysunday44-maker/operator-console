/* GET /api/learning — Learning stats (memories, reflections, errors, successes per agent)
 * POST /api/learning — Trigger actions: weekly_report, evolve
 */

import { NextRequest, NextResponse } from "next/server";
import {
  getLearningStats,
  generateWeeklyLearningReport,
  evolveSkills,
} from "@/lib/agent-runtime/learning-engine";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const stats = await getLearningStats();
    return NextResponse.json(stats);
  } catch (err) {
    console.error("[API/learning] GET failed:", err);
    return NextResponse.json(
      { error: "Failed to fetch learning stats" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    let body: { action?: string; agentId?: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400 }
      );
    }

    const { action, agentId } = body;

    if (!action) {
      return NextResponse.json(
        { error: "Missing required field: action" },
        { status: 400 }
      );
    }

    switch (action) {
      case "weekly_report": {
        const report = await generateWeeklyLearningReport();
        return NextResponse.json({ success: true, report });
      }

      case "evolve": {
        if (!agentId) {
          return NextResponse.json(
            { error: "Missing required field: agentId (for evolve action)" },
            { status: 400 }
          );
        }
        const reflection = await evolveSkills(agentId);
        if (!reflection) {
          return NextResponse.json(
            { success: false, message: "Not enough feedback data to evolve, or agent not found" },
            { status: 200 }
          );
        }
        return NextResponse.json({ success: true, reflection });
      }

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}. Valid actions: weekly_report, evolve` },
          { status: 400 }
        );
    }
  } catch (err) {
    console.error("[API/learning] POST failed:", err);
    return NextResponse.json(
      { error: "Failed to process learning action" },
      { status: 500 }
    );
  }
}
