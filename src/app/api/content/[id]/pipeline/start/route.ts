/* POST /api/content/[id]/pipeline/start — Start the full content pipeline
 * Body: { includeLipSync?: boolean }
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { startPipeline } from "@/lib/pipeline/orchestrator";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const content = await prisma.contentItem.findUnique({ where: { id } });
  if (!content) {
    return NextResponse.json({ error: "Content not found" }, { status: 404 });
  }

  let body: Record<string, unknown> = {};
  try {
    body = await request.json();
  } catch {
    // No body is fine — defaults apply
  }

  const includeLipSync = !!body.includeLipSync;

  try {
    const runId = await startPipeline(id, { includeLipSync });
    return NextResponse.json({ ok: true, runId, contentItemId: id });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to start pipeline";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
