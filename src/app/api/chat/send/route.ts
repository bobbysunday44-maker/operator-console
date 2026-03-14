/* POST /api/chat/send — Send a message and get Claude's response
 *
 * Body: { conversationId?: string, message: string }
 * - If no conversationId, creates a new conversation
 * - Detects commands ("Create a TikTok about X") and dispatches them
 * - Returns mock Claude response (real API integration in production)
 */

import { NextResponse } from "next/server";
import { chatStore } from "@/lib/chat/chat-store";
import { parseCommand, dispatchCommand } from "@/lib/chat/command-parser";
import { eventBus } from "@/lib/events/event-bus";

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const { message, conversationId: existingId } = body as { message?: string; conversationId?: string };

  if (!message || typeof message !== "string") {
    return NextResponse.json({ error: "message is required" }, { status: 400 });
  }

  // Get or create conversation
  let convId = existingId;
  if (!convId) {
    const conv = chatStore.createConversation("New conversation");
    convId = conv.id;
  }

  const conversation = chatStore.getConversation(convId);
  if (!conversation) {
    return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
  }

  // Add user message
  const userMsg = chatStore.addMessage(convId, {
    role: "user",
    content: message,
  });

  // Check for commands
  const command = parseCommand(message);
  let responseText: string;

  if (command) {
    responseText = dispatchCommand(command);
  } else {
    // Mock Claude response (will be replaced with real API call)
    responseText = generateMockResponse(message);
  }

  // Add assistant response
  const assistantMsg = chatStore.addMessage(convId, {
    role: "assistant",
    content: responseText,
    model: "claude-sonnet-4-6",
    tokens: { input: Math.ceil(message.length / 4), output: Math.ceil(responseText.length / 4) },
    command: command ?? null,
  });

  // Emit chat event
  eventBus.emit({
    type: "task_completed",
    agentName: "Claude",
    message: `Chat response: "${message.slice(0, 40)}${message.length > 40 ? "..." : ""}"`,
    metadata: { conversationId: convId, command: command?.type },
  });

  return NextResponse.json({
    conversationId: convId,
    userMessage: userMsg,
    assistantMessage: assistantMsg,
    command: command || null,
  });
}

function generateMockResponse(input: string): string {
  const lower = input.toLowerCase();

  if (lower.includes("hello") || lower.includes("hi") || lower.includes("hey")) {
    return "Hey! I'm your OpenClaw AI assistant. I can help you:\n\n- **Create content** — \"Create a TikTok about AI\"\n- **Check pipeline status** — \"What's the status?\"\n- **View agents** — \"How are my agents doing?\"\n- **Run pipelines** — \"Run the full pipeline\"\n\nWhat would you like to do?";
  }

  if (lower.includes("help") || lower.includes("what can you do")) {
    return "I'm Claude Sonnet, powering OpenClaw's command center. Here's what I can do:\n\n**Content Creation**\n- \"Create a TikTok about [topic]\"\n- \"Make an Instagram reel about [topic]\"\n\n**Pipeline Management**\n- \"Check status\" — current pipeline progress\n- \"Run pipeline\" — start a new creation run\n\n**Agent Fleet**\n- \"How are my agents?\" — fleet status overview\n\n**General Chat**\n- Ask me anything about your content strategy, trending topics, or platform optimization.";
  }

  if (lower.includes("cost") || lower.includes("budget") || lower.includes("spending")) {
    return "Today's spending breakdown:\n\n| Service | Cost |\n|---------|------|\n| Claude Sonnet | $0.89 |\n| Nano Banana 2 | $0.12 |\n| Veo 3.1 | $0.23 |\n| edge-tts | Free |\n| **Total** | **$1.24** |\n\nYou're within the daily budget of $5.00. At this rate, monthly projection is ~$37.";
  }

  return `I understand you're asking about: "${input}"\n\nI can help with content creation, pipeline management, and agent coordination. Try commands like:\n- \"Create a TikTok about [topic]\"\n- \"What's the status?\"\n- \"How are my agents doing?\"`;
}
