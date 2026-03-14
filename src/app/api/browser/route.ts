/* GET /api/browser — List browser sessions */

import { NextResponse } from "next/server";
import { routingStore } from "@/lib/routing/routing-store";

export async function GET() {
  const sessions = routingStore.listSessions();
  return NextResponse.json({ sessions });
}
