/* PATCH /api/platforms/[id] — Update platform connection (credentials, status)
 * Used by the Settings page to connect/disconnect platforms.
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { eventBus } from "@/lib/events/event-bus";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { connected, credentials, handle } = body as {
    connected?: boolean;
    credentials?: object;
    handle?: string;
  };

  try {
    // Build update data explicitly for Prisma JSON compatibility
    const updateData: { connected?: boolean; credentials?: object; handle?: string } = {};
    if (connected !== undefined) updateData.connected = connected;
    if (credentials !== undefined) updateData.credentials = credentials;
    if (handle !== undefined) updateData.handle = handle;

    const platform = await prisma.platform.update({
      where: { id },
      data: updateData,
    });

    eventBus.emit({
      type: "agent_status_change",
      message: `Platform ${platform.name} ${platform.connected ? "connected" : "disconnected"}`,
      metadata: { platformId: id },
    });

    return NextResponse.json({ platform });
  } catch {
    return NextResponse.json({ error: "Platform not found" }, { status: 404 });
  }
}
