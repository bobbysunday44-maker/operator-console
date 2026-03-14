/* POST /api/telegram — Telegram Bot Webhook
 * Receives updates from Telegram, processes them, sends responses.
 *
 * To set up:
 * curl -X POST "https://api.telegram.org/bot<TOKEN>/setWebhook" \
 *   -H "Content-Type: application/json" \
 *   -d '{"url": "https://your-domain.com/api/telegram"}'
 */

import { NextResponse } from "next/server";
import { handleTelegramMessage, type TelegramUpdate } from "@/lib/telegram/bot";

export async function POST(request: Request) {
  try {
    const update: TelegramUpdate = await request.json();

    // Only process text messages
    if (update.message?.text) {
      await handleTelegramMessage(update);
    }

    // Telegram expects 200 OK quickly
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[Telegram Webhook] Error:", err);
    // Still return 200 so Telegram doesn't retry
    return NextResponse.json({ ok: true });
  }
}

// GET for health check / webhook verification
export async function GET() {
  return NextResponse.json({
    status: "active",
    webhook: "OpenClaw Telegram Bot",
    configured: !!process.env.TELEGRAM_BOT_TOKEN,
  });
}
