/* POST /api/telegram — Telegram Bot Webhook
 * GET /api/telegram — Health check
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

interface TelegramUpdate {
  message?: {
    chat: { id: number };
    from?: { first_name?: string; username?: string };
    text?: string;
  };
}

export async function POST(request: Request) {
  try {
    const update: TelegramUpdate = await request.json();

    if (update.message?.text) {
      const chatId = update.message.chat.id;
      const text = update.message.text;
      const from = update.message.from?.first_name || "User";

      // Log to conversation
      let conversation = await prisma.conversation.findFirst({
        where: { source: "telegram", title: `Telegram: ${chatId}` },
      });

      if (!conversation) {
        conversation = await prisma.conversation.create({
          data: { title: `Telegram: ${chatId}`, source: "telegram", model: "claude-sonnet-4-6" },
        });
      }

      await prisma.message.create({
        data: {
          conversationId: conversation.id,
          role: "user",
          content: `[${from}] ${text}`,
        },
      });

      // Send reply via Telegram API
      const token = process.env.TELEGRAM_BOT_TOKEN;
      if (token) {
        await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: chatId,
            text: `Received: "${text}". OpenClaw is processing your request.`,
          }),
        });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[Telegram Webhook] Error:", err);
    return NextResponse.json({ ok: true });
  }
}

export async function GET() {
  return NextResponse.json({
    status: "active",
    webhook: "OpenClaw Telegram Bot",
    configured: !!process.env.TELEGRAM_BOT_TOKEN,
  });
}
