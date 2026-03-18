/* GET /api/settings — Load all settings
 * POST /api/settings — Save settings (key-value pairs)
 *
 * API keys are stored with encrypted=true flag.
 * Values are stored as-is (encryption at app level via env).
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

const API_KEY_FIELDS = new Set([
  "ANTHROPIC_API_KEY",
  "GEMINI_API_KEY",
  "KLING_API_KEY",
  "TELEGRAM_BOT_TOKEN",
  "SOCIAL_API_KEY",
]);

// All allowed setting keys — prevents arbitrary env injection
const ALLOWED_KEYS = new Set([
  "ANTHROPIC_API_KEY",
  "GEMINI_API_KEY",
  "KLING_API_KEY",
  "TELEGRAM_BOT_TOKEN",
  "DEFAULT_TTS_VOICE",
  "CONTENT_ARCHIVE_PATH",
  "DEFAULT_MODEL",
  "NOTIFY_PIPELINE_COMPLETE",
  "NOTIFY_QUALITY_FAIL",
  "NOTIFY_SCHEDULE_ERRORS",
  "NOTIFY_BUDGET_WARNING",
  "TRACKED_NICHES",
  "SOCIAL_API_KEY",
  "SOCIAL_API_PROVIDER",
]);

export async function GET() {
  try {
    const settings = await prisma.setting.findMany();

    const result: Record<string, string> = {};
    for (const s of settings) {
      // Mask API keys — fixed-length mask (don't leak key length)
      if (s.encrypted && s.value.length > 4) {
        result[s.key] = "••••••••" + s.value.slice(-4);
      } else {
        result[s.key] = s.value;
      }
    }

    return NextResponse.json({ settings: result });
  } catch (err) {
    console.error("[Settings GET] Error:", err);
    return NextResponse.json({ error: "Failed to load settings" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { settings } = body as { settings?: Record<string, string> };

    if (!settings || typeof settings !== "object") {
      return NextResponse.json({ error: "settings object is required" }, { status: 400 });
    }

    const results: { key: string; saved: boolean }[] = [];

    for (const [key, value] of Object.entries(settings)) {
      if (typeof value !== "string") continue;

      // Only allow known setting keys — prevents env injection
      if (!ALLOWED_KEYS.has(key)) continue;

      // Skip masked values (user didn't change the key)
      if (value.includes("••••••••")) continue;

      const isApiKey = API_KEY_FIELDS.has(key);

      await prisma.setting.upsert({
        where: { key },
        create: { key, value, encrypted: isApiKey },
        update: { value, encrypted: isApiKey },
      });

      // Also set in process.env for immediate use by workers
      process.env[key] = value;

      results.push({ key, saved: true });
    }

    return NextResponse.json({ saved: results.length, results });
  } catch (err) {
    console.error("[Settings POST] Error:", err);
    return NextResponse.json({ error: "Failed to save settings" }, { status: 500 });
  }
}
