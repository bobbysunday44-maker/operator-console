/* POST /api/research/scan — Trigger a trend scan */

import { NextResponse } from "next/server";
import { scanTrends } from "@/lib/research/trend-scanner";
import { aggregateTopics } from "@/lib/research/aggregator";

export async function POST(request: Request) {
  let niches: string[] | undefined;

  try {
    const body = await request.json();
    niches = body.niches;
  } catch {
    // No body — use default niches
  }

  try {
    const scanned = await scanTrends(niches);
    const aggregated = await aggregateTopics();

    return NextResponse.json({
      scanned,
      aggregated,
      message: `Found ${scanned} new topics, aggregated ${aggregated}`,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Scan failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
