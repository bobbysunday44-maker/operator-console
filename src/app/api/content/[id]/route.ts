/* GET /api/content/[id] — Get content item with pipeline runs + assets
 * PATCH /api/content/[id] — Update content item
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import type { ContentStatus } from "@/generated/prisma/client";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const item = await prisma.contentItem.findUnique({
    where: { id },
    include: {
      pipelineRuns: { orderBy: { createdAt: "asc" } },
      assets: { orderBy: { createdAt: "asc" } },
      socialPosts: { orderBy: { createdAt: "desc" }, take: 5 },
    },
  });

  if (!item) {
    return NextResponse.json({ error: "Content not found" }, { status: 404 });
  }

  return NextResponse.json({ item });
}

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
    const item = await prisma.contentItem.update({
      where: { id },
      data: {
        title: body.title !== undefined ? body.title as string : undefined,
        status: body.status !== undefined ? body.status as ContentStatus : undefined,
        script: body.script !== undefined ? body.script as string : undefined,
        totalCost: body.totalCost !== undefined ? body.totalCost as number : undefined,
      },
    });
    return NextResponse.json({ item });
  } catch {
    return NextResponse.json({ error: "Content not found" }, { status: 404 });
  }
}
