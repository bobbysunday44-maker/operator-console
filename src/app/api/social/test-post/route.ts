/* POST /api/social/test-post — Test social media API posting
 * Body: { platform: string, content: string, mediaUrl?: string }
 * Returns the raw PublishResult from the configured API provider.
 * Use this to verify your API key and provider settings work.
 */

import { NextResponse } from "next/server";
import { publishToSocialMedia } from "@/lib/social/api-publisher";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { platform, content, mediaUrl } = body as {
      platform?: string;
      content?: string;
      mediaUrl?: string;
    };

    if (!platform || typeof platform !== "string") {
      return NextResponse.json(
        { error: "platform is required (e.g., 'TikTok', 'Instagram', 'Twitter/X')" },
        { status: 400 }
      );
    }

    if (!content || typeof content !== "string") {
      return NextResponse.json(
        { error: "content is required — the text to post" },
        { status: 400 }
      );
    }

    if (content.length > 10000) {
      return NextResponse.json(
        { error: "content too long (max 10,000 characters)" },
        { status: 400 }
      );
    }

    console.log(`[Test Post] Testing publish to ${platform} (${content.length} chars)`);

    const result = await publishToSocialMedia(
      platform,
      content,
      typeof mediaUrl === "string" ? mediaUrl : undefined
    );

    return NextResponse.json({
      ...result,
      testedAt: new Date().toISOString(),
      platform,
      contentLength: content.length,
    });
  } catch (err) {
    console.error("[Test Post] Error:", err);
    return NextResponse.json(
      { error: `Test post failed: ${err instanceof Error ? err.message : "Unknown error"}` },
      { status: 500 }
    );
  }
}
