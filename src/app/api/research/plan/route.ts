/* POST /api/research/plan — Trigger Opus to plan weekly content */

import { NextResponse } from "next/server";
import { planWeeklyContent } from "@/lib/research/opus-planner";

export async function POST(request: Request) {
  let count = 7;

  try {
    const body = await request.json();
    if (body.count) count = Math.min(body.count, 20);
  } catch {
    // Default count
  }

  try {
    const result = await planWeeklyContent(count);
    return NextResponse.json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Planning failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
