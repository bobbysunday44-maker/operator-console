/* POST /api/i18n/translate — Translate content into target languages
 * Body: { contentItemId: string, targetLanguages: ["es", "fr", "ja"] }
 */

import { NextRequest, NextResponse } from "next/server";
import { translateContent, getTranslations } from "@/lib/i18n/language-engine";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { contentItemId, targetLanguages } = body as {
    contentItemId?: string;
    targetLanguages?: string[];
  };

  if (!contentItemId) {
    return NextResponse.json({ error: "contentItemId is required" }, { status: 400 });
  }

  if (!targetLanguages || !Array.isArray(targetLanguages) || targetLanguages.length === 0) {
    return NextResponse.json({ error: "targetLanguages must be a non-empty array of language codes" }, { status: 400 });
  }

  try {
    const created = await translateContent(contentItemId, targetLanguages);
    return NextResponse.json({ ok: true, translations: created }, { status: 201 });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Translation failed";
    const status = message.includes("not found") ? 404
      : message.includes("not configured") ? 503
      : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

/* GET /api/i18n/translate?contentItemId=xxx — Get existing translations for a content item */
export async function GET(request: NextRequest) {
  const contentItemId = request.nextUrl.searchParams.get("contentItemId");
  if (!contentItemId) {
    return NextResponse.json({ error: "contentItemId query param is required" }, { status: 400 });
  }

  try {
    const translations = await getTranslations(contentItemId);
    return NextResponse.json({ translations });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to fetch translations" },
      { status: 500 },
    );
  }
}
