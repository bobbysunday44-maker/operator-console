/* GET /api/routing — List routing rules + model configs
 * GET /api/routing?view=traces — List LLM traces
 * GET /api/routing?view=usage — Model usage stats
 */

import { NextRequest, NextResponse } from "next/server";
import { routingStore, MODEL_CONFIGS } from "@/lib/routing/routing-store";

export async function GET(request: NextRequest) {
  const view = request.nextUrl.searchParams.get("view");

  if (view === "traces") {
    const limit = parseInt(request.nextUrl.searchParams.get("limit") || "50", 10);
    const traces = routingStore.listTraces(Math.min(limit, 200));
    return NextResponse.json({ traces });
  }

  if (view === "usage") {
    const usage = routingStore.getUsageStats();
    return NextResponse.json({ usage });
  }

  const rules = routingStore.listRules();
  return NextResponse.json({ rules, models: MODEL_CONFIGS });
}
