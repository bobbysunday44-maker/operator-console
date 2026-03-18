/* POST /api/batch — Mass create content
 * Body: { mode: "manual" | "trending" | "calendar", items?, niche?, count?, options? }
 */

import { NextResponse } from "next/server";
import { batchCreateContent, batchFromTrending, batchFromCalendar } from "@/lib/batch/batch-creator";

export async function POST(request: Request) {
  const body = await request.json();
  const { mode, items, niche, count, options } = body;

  try {
    let result;

    switch (mode) {
      case "trending":
        if (!niche) return NextResponse.json({ error: "niche required for trending mode" }, { status: 400 });
        result = await batchFromTrending(niche, count || 5, options || {});
        break;

      case "calendar":
        if (!niche) return NextResponse.json({ error: "niche required for calendar mode" }, { status: 400 });
        result = await batchFromCalendar(niche, options || {});
        break;

      case "manual":
        if (!items || !Array.isArray(items) || items.length === 0) {
          return NextResponse.json({ error: "items array required for manual mode" }, { status: 400 });
        }
        result = await batchCreateContent(items, options || {});
        break;

      default:
        return NextResponse.json({ error: "mode must be 'manual', 'trending', or 'calendar'" }, { status: 400 });
    }

    return NextResponse.json({ result }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Batch failed" }, { status: 500 });
  }
}
