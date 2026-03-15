/* GET /api/social/mentions — List brand mentions
 * POST /api/social/mentions — Mark as replied
 *
 * Query: ?unreplied=true
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const unreplied = request.nextUrl.searchParams.get("unreplied") === "true";

  const where = unreplied ? { isReplied: false } : {};

  const mentions = await prisma.mention.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json({ mentions });
}

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { mentionId, replyText } = body as { mentionId?: string; replyText?: string };
  if (!mentionId) {
    return NextResponse.json({ error: "mentionId is required" }, { status: 400 });
  }

  const mention = await prisma.mention.findUnique({ where: { id: mentionId } });
  if (!mention) {
    return NextResponse.json({ error: "Mention not found" }, { status: 404 });
  }
  if (mention.isReplied) {
    return NextResponse.json({ error: "Already replied" }, { status: 409 });
  }

  const updated = await prisma.mention.update({
    where: { id: mentionId },
    data: {
      isReplied: true,
      replyText: replyText || "Thanks for the mention! 🙌",
    },
  });

  return NextResponse.json({ success: true, mention: updated });
}
