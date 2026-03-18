/* GET /api/batch/status?ids=id1,id2,id3 — Check batch progress */

import { NextResponse } from "next/server";
import { getBatchStatus } from "@/lib/batch/batch-creator";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const ids = searchParams.get("ids")?.split(",").filter(Boolean) || [];

  if (ids.length === 0) {
    return NextResponse.json({ error: "ids query param required" }, { status: 400 });
  }

  const status = await getBatchStatus(ids);
  return NextResponse.json(status);
}
