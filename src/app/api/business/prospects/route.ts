/* ── Prospects API ──
 * GET ?niche=X — find prospects for a niche
 * POST { niche, count } — run full outreach cycle
 */

import { NextResponse } from "next/server";
import { findProspects, runOutreachCycle } from "@/lib/business/outreach-automation";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const niche = searchParams.get("niche");

    if (!niche) {
      return NextResponse.json(
        { error: "niche query parameter is required" },
        { status: 400 }
      );
    }

    const countParam = searchParams.get("count");
    const count = countParam ? Math.min(parseInt(countParam, 10) || 5, 20) : 5;

    const prospects = await findProspects(niche, count);
    return NextResponse.json({ prospects, count: prospects.length, niche });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to find prospects" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const niche = body.niche;
  if (!niche || typeof niche !== "string") {
    return NextResponse.json({ error: "niche is required" }, { status: 400 });
  }

  const count = typeof body.count === "number"
    ? Math.min(Math.max(body.count, 1), 20)
    : 5;

  try {
    const result = await runOutreachCycle(niche, count);
    return NextResponse.json({ result }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to run outreach cycle" },
      { status: 500 }
    );
  }
}
