/* ── Direct API Publisher ──
 * Posts content to social platforms via third-party API services.
 * Supports 3 providers: Post for Me, Upload-Post, Ayrshare.
 * User configures provider + API key in Settings.
 */

import { getSetting } from "@/lib/db/settings";

export interface PublishResult {
  success: boolean;
  postUrl?: string;
  platformPostId?: string;
  error?: string;
  provider?: string;
}

/* ── Platform Name Mapping ── */
const PLATFORM_MAP: Record<string, string> = {
  "Twitter/X": "twitter",
  "Instagram": "instagram",
  "Facebook": "facebook",
  "LinkedIn": "linkedin",
  "TikTok": "tiktok",
  "YouTube": "youtube",
  "Reddit": "reddit",
  "Threads": "threads",
  "Pinterest": "pinterest",
};

function normalizePlatform(openClawName: string): string {
  return PLATFORM_MAP[openClawName] || openClawName.toLowerCase().replace(/[^a-z]/g, "");
}

/* ── Post for Me API ──
 * https://www.postforme.dev/
 * POST https://api.postforme.dev/v1/posts
 * Body: { platforms: ["tiktok"], text, media_url }
 * Auth: Bearer token in Authorization header
 */
async function publishViaPostForMe(
  apiKey: string,
  platform: string,
  content: string,
  mediaUrl?: string
): Promise<PublishResult> {
  try {
    const body: Record<string, unknown> = {
      platforms: [platform],
      text: content,
    };
    if (mediaUrl) {
      body.media_url = mediaUrl;
    }

    const res = await fetch("https://api.postforme.dev/v1/posts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(30000),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      return {
        success: false,
        error: `Post for Me API error (${res.status}): ${data.message || data.error || res.statusText}`,
        provider: "postforme",
      };
    }

    // Extract post URL and ID from response
    const postResult = Array.isArray(data.posts) ? data.posts[0] : data;
    return {
      success: true,
      postUrl: postResult?.url || postResult?.post_url || undefined,
      platformPostId: postResult?.id || postResult?.post_id || undefined,
      provider: "postforme",
    };
  } catch (err) {
    return {
      success: false,
      error: `Post for Me request failed: ${err instanceof Error ? err.message : "Unknown error"}`,
      provider: "postforme",
    };
  }
}

/* ── Upload-Post API ──
 * https://www.upload-post.com/
 * POST https://api.upload-post.com/post
 * Body: { platform, caption, media_url }
 * Auth: Authorization: Bearer <key>
 */
async function publishViaUploadPost(
  apiKey: string,
  platform: string,
  content: string,
  mediaUrl?: string
): Promise<PublishResult> {
  try {
    const body: Record<string, unknown> = {
      platform,
      caption: content,
    };
    if (mediaUrl) {
      body.media_url = mediaUrl;
    }

    const res = await fetch("https://api.upload-post.com/post", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(30000),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      return {
        success: false,
        error: `Upload-Post API error (${res.status}): ${data.message || data.error || res.statusText}`,
        provider: "uploadpost",
      };
    }

    return {
      success: true,
      postUrl: data.url || data.post_url || undefined,
      platformPostId: data.id || data.post_id || undefined,
      provider: "uploadpost",
    };
  } catch (err) {
    return {
      success: false,
      error: `Upload-Post request failed: ${err instanceof Error ? err.message : "Unknown error"}`,
      provider: "uploadpost",
    };
  }
}

/* ── Ayrshare API ──
 * https://www.ayrshare.com/
 * POST https://app.ayrshare.com/api/post
 * Body: { post, platforms: ["tiktok"], mediaUrls: [...] }
 * Auth: Authorization: Bearer <key>
 */
async function publishViaAyrshare(
  apiKey: string,
  platform: string,
  content: string,
  mediaUrl?: string
): Promise<PublishResult> {
  try {
    const body: Record<string, unknown> = {
      post: content,
      platforms: [platform],
    };
    if (mediaUrl) {
      body.mediaUrls = [mediaUrl];
    }

    const res = await fetch("https://app.ayrshare.com/api/post", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(30000),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      return {
        success: false,
        error: `Ayrshare API error (${res.status}): ${data.message || data.error || res.statusText}`,
        provider: "ayrshare",
      };
    }

    // Ayrshare returns postIds object keyed by platform
    const postIds = data.postIds || {};
    const platformPostId = postIds[platform] || data.id || undefined;
    const postUrl = data.postUrl || (Array.isArray(data.postUrls) ? data.postUrls[0] : undefined);

    return {
      success: true,
      postUrl,
      platformPostId,
      provider: "ayrshare",
    };
  } catch (err) {
    return {
      success: false,
      error: `Ayrshare request failed: ${err instanceof Error ? err.message : "Unknown error"}`,
      provider: "ayrshare",
    };
  }
}

/* ── Provider Router ── */
const PROVIDERS: Record<string, (apiKey: string, platform: string, content: string, mediaUrl?: string) => Promise<PublishResult>> = {
  postforme: publishViaPostForMe,
  uploadpost: publishViaUploadPost,
  ayrshare: publishViaAyrshare,
};

/* ── Main Entry Point ──
 * Reads provider + key from settings, routes to the correct API.
 * Returns success/failure — caller decides what to do with the result.
 */
export async function publishToSocialMedia(
  platformName: string,
  content: string,
  mediaUrl?: string
): Promise<PublishResult> {
  try {
    // 1. Read provider preference
    const provider = (await getSetting("SOCIAL_API_PROVIDER")) || "postforme";

    // 2. Read API key
    const apiKey = await getSetting("SOCIAL_API_KEY");
    if (!apiKey) {
      return {
        success: false,
        error: "No social API key configured. Set in Settings.",
        provider,
      };
    }

    // 3. Validate provider
    const publishFn = PROVIDERS[provider];
    if (!publishFn) {
      return {
        success: false,
        error: `Unknown social API provider "${provider}". Use: postforme, uploadpost, or ayrshare.`,
        provider,
      };
    }

    // 4. Normalize platform name
    const normalizedPlatform = normalizePlatform(platformName);
    console.log(`[Social API] Publishing to ${normalizedPlatform} via ${provider}`);

    // 5. Call provider
    const result = await publishFn(apiKey, normalizedPlatform, content, mediaUrl);

    if (result.success) {
      console.log(`[Social API] Successfully posted to ${normalizedPlatform} via ${provider}${result.postUrl ? ` — ${result.postUrl}` : ""}`);
    } else {
      console.error(`[Social API] Failed to post to ${normalizedPlatform} via ${provider}: ${result.error}`);
    }

    return result;
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Unknown error";
    console.error(`[Social API] Unexpected error: ${errorMsg}`);
    return {
      success: false,
      error: `Social API publisher error: ${errorMsg}`,
    };
  }
}
