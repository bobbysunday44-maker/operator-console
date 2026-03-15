/* PATCH /api/routing/[id] — Update a routing rule */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import type { ModelProvider } from "@/generated/prisma/client";

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

  try {
    const rule = await prisma.modelRoute.update({
      where: { id },
      data: {
        ...(body.modelName !== undefined && { modelName: body.modelName as ModelProvider }),
        ...(body.enabled !== undefined && { enabled: body.enabled as boolean }),
        ...(body.priority !== undefined && { priority: body.priority as number }),
        ...(body.config !== undefined && { config: body.config as object }),
      },
    });
    return NextResponse.json({ rule });
  } catch {
    return NextResponse.json({ error: "Rule not found" }, { status: 404 });
  }
}
