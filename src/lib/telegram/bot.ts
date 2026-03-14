/* ── OpenClaw Telegram Bot Utilities ──
 * Handles incoming webhook messages from Telegram.
 * Forwards to Claude, returns responses, supports command parsing.
 *
 * Setup:
 * 1. Set TELEGRAM_BOT_TOKEN in .env
 * 2. Set webhook: POST https://api.telegram.org/bot<TOKEN>/setWebhook
 *    body: { url: "https://your-domain.com/api/telegram" }
 */

import { chatStore } from "@/lib/chat/chat-store";
import { parseCommand, dispatchCommand } from "@/lib/chat/command-parser";
import { eventBus } from "@/lib/events/event-bus";

export interface TelegramUpdate {
  update_id: number;
  message?: {
    message_id: number;
    from: {
      id: number;
      first_name: string;
      username?: string;
    };
    chat: {
      id: number;
      type: string;
    };
    date: number;
    text?: string;
  };
}

interface TelegramSendMessage {
  chat_id: number;
  text: string;
  parse_mode?: "Markdown" | "HTML";
}

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";

/** Send a message via Telegram Bot API */
export async function sendTelegramMessage(params: TelegramSendMessage): Promise<boolean> {
  if (!BOT_TOKEN) {
    console.warn("[Telegram] No BOT_TOKEN configured, skipping send");
    return false;
  }

  try {
    const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });
    return res.ok;
  } catch (err) {
    console.error("[Telegram] Send failed:", err);
    return false;
  }
}

/** Process an incoming Telegram message */
export async function handleTelegramMessage(update: TelegramUpdate): Promise<string> {
  const msg = update.message;
  if (!msg?.text) return "No text message";

  const chatId = msg.chat.id;
  const text = msg.text.trim();
  const userName = msg.from.first_name || "User";

  // Handle /start command
  if (text === "/start") {
    const greeting = `Welcome to OpenClaw, ${userName}! 🤖\n\nI'm your AI content operations assistant. You can:\n\n• Send any message to chat with Claude\n• "Create a TikTok about [topic]" to start a pipeline\n• "Status" to check pipeline progress\n• "Agents" to see fleet status\n\nAll conversations sync with your OpenClaw dashboard.`;
    await sendTelegramMessage({ chat_id: chatId, text: greeting });
    return "Sent welcome message";
  }

  // Find or create conversation for this Telegram chat
  let conversation = chatStore.listConversations().find(
    (c) => c.source === "telegram" && c.telegramChatId === chatId
  );

  if (!conversation) {
    conversation = chatStore.createConversation(`Telegram: ${userName}`, "telegram");
    conversation.telegramChatId = chatId;
  }

  // Add user message
  chatStore.addMessage(conversation.id, {
    role: "user",
    content: text,
  });

  // Check for commands
  const command = parseCommand(text);
  let responseText: string;

  if (command) {
    responseText = dispatchCommand(command);
  } else {
    responseText = `I received: "${text}"\n\nTry "Create a TikTok about [topic]" or "Status" to interact with your pipeline.`;
  }

  // Add assistant response
  chatStore.addMessage(conversation.id, {
    role: "assistant",
    content: responseText,
    model: "claude-sonnet-4-6",
    command: command || undefined,
  });

  // Emit event
  eventBus.emit({
    type: "mention_detected",
    agentName: "Telegram Bot",
    message: `Message from ${userName}: "${text.slice(0, 40)}${text.length > 40 ? "..." : ""}"`,
    metadata: { telegramChatId: chatId, source: "telegram" },
  });

  // Send response back to Telegram
  await sendTelegramMessage({
    chat_id: chatId,
    text: responseText,
    parse_mode: "Markdown",
  });

  return "Processed";
}
