/* ── Telegram Notification Helper ──
 * Send messages to Bobby's Telegram chat from anywhere in the system.
 * Used by: Opus review, pipeline completion, error alerts, post confirmations.
 */

import { getSetting } from "@/lib/db/settings";

export async function notifyBobby(message: string): Promise<boolean> {
  try {
    const token = await getSetting("TELEGRAM_BOT_TOKEN");
    const chatId = await getSetting("TELEGRAM_CHAT_ID");

    if (!token || !chatId) {
      console.log("[Notify] Telegram not configured (missing token or chat ID)");
      return false;
    }

    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: "Markdown",
      }),
    });

    if (!res.ok) {
      console.error("[Notify] Telegram send failed:", await res.text());
      return false;
    }

    return true;
  } catch (err) {
    console.error("[Notify] Error:", err);
    return false;
  }
}
