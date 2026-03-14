/* GET /api/social/mentions — List brand mentions
 * POST /api/social/mentions/reply — Auto-reply to a mention
 *
 * Query: ?unreplied=true
 */

import { NextRequest, NextResponse } from "next/server";
import { socialStore } from "@/lib/social/social-store";
import { autoReply } from "@/lib/social/auto-reply";

export async function GET(request: NextRequest) {
  const unreplied = request.nextUrl.searchParams.get("unreplied") === "true";
  const mentions = socialStore.listMentions(unreplied);

  return NextResponse.json({ mentions });
}

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { mentionId } = body as { mentionId?: string };
  if (!mentionId) {
    return NextResponse.json({ error: "mentionId is required" }, { status: 400 });
  }

  const result = autoReply(mentionId);
  if (!result.success) {
    const status = result.error === "Already replied" ? 409 : 404;
    return NextResponse.json({ error: result.error }, { status });
  }

  return NextResponse.json({ success: true, reply: result.reply });
}
