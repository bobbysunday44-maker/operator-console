/* GET /api/archive/[id] — Get archived content detail */

import { NextResponse } from "next/server";
import { archiveStore } from "@/lib/archive/archive-store";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const item = archiveStore.getItem(params.id);
  if (!item) {
    return NextResponse.json({ error: "Content not found" }, { status: 404 });
  }
  return NextResponse.json({ item });
}
