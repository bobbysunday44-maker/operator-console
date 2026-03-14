/* GET /api/chat/conversations — List all conversations
 * POST /api/chat/conversations — Create a new conversation
 */

import { NextResponse } from "next/server";
import { chatStore } from "@/lib/chat/chat-store";

export async function GET() {
  const conversations = chatStore.listConversations().map((c) => ({
    id: c.id,
    title: c.title,
    source: c.source,
    messageCount: c.messages.length,
    lastMessage: c.messages.at(-1)?.content.slice(0, 80) || null,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
  }));

  return NextResponse.json({ conversations });
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const title = (typeof body.title === "string" ? body.title : null) || "New conversation";
  const source = body.source === "telegram" ? "telegram" as const : "dashboard" as const;

  const conversation = chatStore.createConversation(title, source);

  return NextResponse.json({ conversation }, { status: 201 });
}
