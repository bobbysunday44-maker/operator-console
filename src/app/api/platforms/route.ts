/* GET /api/platforms — List all platforms with connection status */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const platforms = await prisma.platform.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, handle: true, niche: true, connected: true, followers: true },
  });
  return NextResponse.json({ platforms });
}
