/* POST /api/chat/send — Send a message and get response
 *
 * Body: { conversationId?: string, message: string }
 * - If no conversationId, creates a new conversation
 * - Returns mock Claude response (real API integration later)
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { eventBus } from "@/lib/events/event-bus";

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { message, conversationId: existingId } = body as {
    message?: string;
    conversationId?: string;
  };

  if (!message || typeof message !== "string") {
    return NextResponse.json({ error: "message is required" }, { status: 400 });
  }

  // Get or create conversation
  let convId = existingId;
  if (!convId) {
    const conv = await prisma.conversation.create({
      data: { title: message.slice(0, 50), source: "dashboard", model: "claude-sonnet-4-6" },
    });
    convId = conv.id;
  }

  const conversation = await prisma.conversation.findUnique({ where: { id: convId } });
  if (!conversation) {
    return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
  }

  // Add user message
  const userMsg = await prisma.message.create({
    data: {
      conversationId: convId,
      role: "user",
      content: message,
    },
  });

  // Generate response (mock for now — will be replaced with real Claude API)
  const responseText = generateMockResponse(message);
  const tokensIn = Math.ceil(message.length / 4);
  const tokensOut = Math.ceil(responseText.length / 4);

  // Add assistant response
  const assistantMsg = await prisma.message.create({
    data: {
      conversationId: convId,
      role: "assistant",
      content: responseText,
      tokensIn,
      tokensOut,
      cost: (tokensIn * 0.003 + tokensOut * 0.015) / 1000,
    },
  });

  // Update conversation timestamp
  await prisma.conversation.update({
    where: { id: convId },
    data: { updatedAt: new Date() },
  });

  // Emit chat event
  eventBus.emit({
    type: "task_completed",
    agentName: "Claude",
    message: `Chat: "${message.slice(0, 40)}${message.length > 40 ? "..." : ""}"`,
    metadata: { conversationId: convId },
  });

  return NextResponse.json({
    conversationId: convId,
    userMessage: userMsg,
    assistantMessage: assistantMsg,
  });
}

function generateMockResponse(input: string): string {
  const lower = input.toLowerCase();

  if (lower.includes("hello") || lower.includes("hi") || lower.includes("hey")) {
    return "Hey! I'm your OpenClaw AI assistant. I can help you:\n\n- **Create content** — \"Create a TikTok about AI\"\n- **Check pipeline status** — \"What's the status?\"\n- **View agents** — \"How are my agents doing?\"\n\nWhat would you like to do?";
  }

  if (lower.includes("help") || lower.includes("what can you do")) {
    return "I'm Claude Sonnet, powering OpenClaw's command center. Here's what I can do:\n\n**Content Creation**\n- \"Create a TikTok about [topic]\"\n\n**Pipeline Management**\n- \"Check status\" — current pipeline progress\n\n**Agent Fleet**\n- \"How are my agents?\" — fleet status overview\n\n**General Chat**\n- Ask me anything about content strategy or platform optimization.";
  }

  if (lower.includes("cost") || lower.includes("budget") || lower.includes("spending")) {
    return "Today's spending breakdown:\n\n| Service | Cost |\n|---------|------|\n| Claude Sonnet | $0.89 |\n| Nano Banana 2 | $0.12 |\n| Veo 3.1 | $0.23 |\n| edge-tts | Free |\n| **Total** | **$1.24** |\n\nWithin the $5.00 daily budget.";
  }

  return `I understand you're asking about: "${input}"\n\nI can help with content creation, pipeline management, and agent coordination. Try:\n- \"Create a TikTok about [topic]\"\n- \"What's the status?\"\n- \"How are my agents doing?\"`;
}
