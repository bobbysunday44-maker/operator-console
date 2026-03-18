/* GET /api/channels/[name]/messages — Get messages in a channel
 * POST /api/channels/[name]/messages — Send a message to a channel
 */

import { NextResponse } from "next/server";
import {
  getChannelMessages,
  sendMessage,
  resetLoopGuard,
} from "@/lib/agent-runtime/agent-chat";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ name: string }> }
) {
  try {
    const { name } = await params;
    const channelName = decodeURIComponent(name);

    const url = new URL(_request.url);
    const limit = parseInt(url.searchParams.get("limit") || "50", 10);

    const messages = await getChannelMessages(channelName, limit);

    return NextResponse.json({ messages, channel: channelName });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ name: string }> }
) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { name } = await params;
  const channelName = decodeURIComponent(name);

  const content = typeof body.content === "string" ? body.content.trim() : "";
  const senderId = typeof body.senderId === "string" ? body.senderId : "bobby";
  const senderName = typeof body.senderName === "string" ? body.senderName : "Bobby";
  const senderType = (body.senderType as string) || "user";

  if (!content) {
    return NextResponse.json({ error: "Message content is required" }, { status: 400 });
  }

  try {
    // Handle /continue command
    if (content.trim() === "/continue") {
      resetLoopGuard(channelName);
      const msg = await sendMessage(
        channelName,
        senderId,
        senderName,
        senderType as "user" | "agent" | "system",
        "Resuming agent conversation...",
        [],
        "system"
      );
      return NextResponse.json({ message: msg });
    }

    const message = await sendMessage(
      channelName,
      senderId,
      senderName,
      senderType as "user" | "agent" | "system",
      content,
      undefined, // auto-detect mentions
      typeof body.messageType === "string" ? body.messageType : "text",
      typeof body.metadata === "object" && body.metadata !== null
        ? body.metadata as Record<string, unknown>
        : undefined
    );

    return NextResponse.json({ message });
  } catch (err) {
    const errMessage = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: errMessage }, { status: 500 });
  }
}
