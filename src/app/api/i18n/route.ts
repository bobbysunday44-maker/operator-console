/* GET /api/i18n — List supported languages and voice speakers */

import { NextResponse } from "next/server";
import { getSupportedLanguages } from "@/lib/i18n/language-engine";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const languages = getSupportedLanguages();
    return NextResponse.json({ languages });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to fetch languages" },
      { status: 500 },
    );
  }
}
