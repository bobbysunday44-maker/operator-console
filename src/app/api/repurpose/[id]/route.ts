/* GET /api/repurpose/[id] — Get single repurposed content with source
 * PATCH /api/repurpose/[id] — Update status or fields
 * DELETE /api/repurpose/[id] — Remove repurposed content
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const item = await prisma.repurposedContent.findUnique({
    where: { id },
    include: {
      sourceContent: {
        select: {
          id: true,
          title: true,
          description: true,
          script: true,
          tags: true,
          targetPlatforms: true,
          status: true,
          niche: true,
        },
      },
    },
  });

  if (!item) {
    return NextResponse.json({ error: "Repurposed content not found" }, { status: 404 });
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
    const item = await prisma.repurposedContent.update({
      where: { id },
      data: {
        title: body.title !== undefined ? body.title as string : undefined,
        script: body.script !== undefined ? body.script as string : undefined,
        caption: body.caption !== undefined ? body.caption as string : undefined,
        status: body.status !== undefined ? body.status as string : undefined,
        hashtags: body.hashtags !== undefined ? body.hashtags as string[] : undefined,
        outputPath: body.outputPath !== undefined ? body.outputPath as string : undefined,
      },
    });
    return NextResponse.json({ item });
  } catch {
    return NextResponse.json({ error: "Repurposed content not found" }, { status: 404 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    await prisma.repurposedContent.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Repurposed content not found" }, { status: 404 });
  }
}
