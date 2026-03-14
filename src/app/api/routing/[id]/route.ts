/* PATCH /api/routing/[id] — Update a routing rule (model assignment, enable/disable) */

import { NextResponse } from "next/server";
import { routingStore } from "@/lib/routing/routing-store";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const rule = routingStore.updateRule(params.id, body as { assignedModel?: never; enabled?: never });
  if (!rule) {
    return NextResponse.json({ error: "Rule not found" }, { status: 404 });
  }
  return NextResponse.json({ rule });
}
