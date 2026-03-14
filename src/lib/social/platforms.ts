/* ── Platform Connector Stubs ──
 * API stubs for each platform. Will be replaced with real API calls
 * (or Chrome automation via Browser module) once keys are configured.
 */

import type { PlatformConfig, PlatformId } from "./types";

export const PLATFORM_CONFIGS: PlatformConfig[] = [
  {
    id: "tiktok",
    name: "TikTok",
    handle: "@openclaw_ai",
    icon: "🎵",
    connected: true,
    color: "#1A1A1A",
    bgColor: "#F0EDE6",
    dailyLimit: 5,
    postsToday: 2,
  },
  {
    id: "instagram",
    name: "Instagram",
    handle: "@openclaw.ai",
    icon: "📸",
    connected: true,
    color: "#E1306C",
    bgColor: "#FDF2F8",
    dailyLimit: 8,
    postsToday: 3,
  },
  {
    id: "twitter",
    name: "Twitter/X",
    handle: "@openclaw_ai",
    icon: "🐦",
    connected: true,
    color: "#1DA1F2",
    bgColor: "#EFF6FF",
    dailyLimit: 15,
    postsToday: 5,
  },
  {
    id: "youtube",
    name: "YouTube",
    handle: "@OpenClawAI",
    icon: "▶️",
    connected: false,
    color: "#FF0000",
    bgColor: "#FEF2F2",
    dailyLimit: 2,
    postsToday: 0,
  },
  {
    id: "linkedin",
    name: "LinkedIn",
    handle: "OpenClaw AI",
    icon: "💼",
    connected: false,
    color: "#0A66C2",
    bgColor: "#EFF6FF",
    dailyLimit: 3,
    postsToday: 0,
  },
  {
    id: "reddit",
    name: "Reddit",
    handle: "u/openclaw_ai",
    icon: "🔴",
    connected: false,
    color: "#FF4500",
    bgColor: "#FFF7ED",
    dailyLimit: 5,
    postsToday: 0,
  },
];

/** Stub: publish content to a platform */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function publishToPlatform(
  platformId: PlatformId,
  content: { caption: string; mediaUrl?: string }
): Promise<{ success: boolean; postUrl?: string; error?: string }> {
  const platform = PLATFORM_CONFIGS.find((p) => p.id === platformId);
  if (!platform) return { success: false, error: "Platform not found" };
  if (!platform.connected) return { success: false, error: `${platform.name} not connected` };

  // Stub: simulate publish delay — will use real API / Chrome automation
  void content;
  await new Promise((r) => setTimeout(r, 500));

  return {
    success: true,
    postUrl: `https://${platformId}.com/openclaw/${Date.now()}`,
  };
}

export function getPlatformConfig(id: PlatformId): PlatformConfig | undefined {
  return PLATFORM_CONFIGS.find((p) => p.id === id);
}
