/* GET /api/chat/conversations — List all conversations
 * POST /api/chat/conversations — Create a new conversation
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const conversations = await prisma.conversation.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { content: true },
      },
      _count: { select: { messages: true } },
    },
  });

  const result = conversations.map((c) => ({
    id: c.id,
    title: c.title,
    source: c.source,
    model: c.model,
    messageCount: c._count.messages,
    lastMessage: c.messages[0]?.content.slice(0, 80) || null,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
  }));

  return NextResponse.json({ conversations: result });
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const title = (typeof body.title === "string" ? body.title : null) || "New conversation";
  const source = body.source === "telegram" ? "telegram" : "dashboard";

  const conversation = await prisma.conversation.create({
    data: { title, source, model: "claude-sonnet-4-6" },
  });

  return NextResponse.json({ conversation }, { status: 201 });
}
