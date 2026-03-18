/* POST /api/chat/send — Send a message and get Claude response
 *
 * Body: { conversationId?: string, message: string }
 * - If no conversationId, creates a new conversation
 * - Calls real Claude Sonnet 4.6 API
 */

import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/db/prisma";
import { getSetting } from "@/lib/db/settings";
import { eventBus } from "@/lib/events/event-bus";
import { logModelUsage } from "@/lib/queue/usage-logger";

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

  // Get API key from DB settings or env
  const apiKey = await getSetting("ANTHROPIC_API_KEY");
  if (!apiKey) {
    return NextResponse.json(
      { error: "Anthropic API key not configured. Go to Settings > API Keys." },
      { status: 503 }
    );
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
    data: { conversationId: convId, role: "user", content: message },
  });

  // Load conversation history for context (last 20 messages, ordered oldest→newest)
  const history = await prisma.message.findMany({
    where: { conversationId: convId },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
  history.reverse(); // newest-first from DB → chronological order for Claude

  const messages: Anthropic.MessageParam[] = history.map((m) => ({
    role: m.role as "user" | "assistant",
    content: m.content,
  }));

  // Call Claude API
  const client = new Anthropic({ apiKey });
  const startTime = Date.now();

  try {
    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      system: `You are the OpenClaw AI assistant — an operator console for managing AI content creation and social media automation. You help the user with:
- Content creation and pipeline management
- Agent fleet monitoring
- Social media strategy
- Cost and usage tracking
Be concise, helpful, and direct. Use markdown formatting.`,
      messages,
    });

    const latency = Date.now() - startTime;
    const textBlock = response.content.find((b) => b.type === "text");
    const responseText = textBlock?.text ?? "No response generated.";
    const tokensIn = response.usage.input_tokens;
    const tokensOut = response.usage.output_tokens;
    const cost = (tokensIn * 3 + tokensOut * 15) / 1_000_000; // $3/$15 per 1M tokens

    // Save assistant message
    const assistantMsg = await prisma.message.create({
      data: {
        conversationId: convId,
        role: "assistant",
        content: responseText,
        tokensIn,
        tokensOut,
        cost,
      },
    });

    // Update conversation timestamp
    await prisma.conversation.update({
      where: { id: convId },
      data: { updatedAt: new Date() },
    });

    // Log usage
    await logModelUsage({
      model: "claude",
      taskType: "chat",
      tokensIn,
      tokensOut,
      cost,
      latency,
      success: true,
    });

    // Emit event
    eventBus.emit({
      type: "task_completed",
      agentName: "Claude",
      message: `Chat: "${message.slice(0, 40)}${message.length > 40 ? "..." : ""}"`,
      metadata: { conversationId: convId, cost },
    });

    return NextResponse.json({
      conversationId: convId,
      userMessage: userMsg,
      assistantMessage: assistantMsg,
    });
  } catch (err) {
    const latency = Date.now() - startTime;
    const errorMsg = err instanceof Error ? err.message : "Unknown error";

    await logModelUsage({
      model: "claude",
      taskType: "chat",
      tokensIn: 0,
      tokensOut: 0,
      cost: 0,
      latency,
      success: false,
      error: errorMsg,
    });

    // Save error as system message so user sees it
    await prisma.message.create({
      data: {
        conversationId: convId,
        role: "assistant",
        content: `Error calling Claude API: ${errorMsg}`,
      },
    });

    return NextResponse.json({
      conversationId: convId,
      userMessage: userMsg,
      error: errorMsg,
    }, { status: 502 });
  }
}
