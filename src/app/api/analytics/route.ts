/* GET /api/analytics — Full analytics summary */

import { NextResponse } from "next/server";
import { getAnalyticsSummary } from "@/lib/analytics/analytics-data";

export async function GET() {
  const summary = getAnalyticsSummary();
  return NextResponse.json(summary);
}
