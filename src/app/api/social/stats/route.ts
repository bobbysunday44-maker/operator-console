/* GET /api/social/stats — Social media stats + platform configs */

import { NextResponse } from "next/server";
import { socialStore } from "@/lib/social/social-store";
import { PLATFORM_CONFIGS } from "@/lib/social/platforms";

export async function GET() {
  const stats = socialStore.getStats();

  return NextResponse.json({
    stats,
    platforms: PLATFORM_CONFIGS,
  });
}
