/* GET /api/browser — List browser sessions
 * POST /api/browser — Create a new browser session
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const sessions = await prisma.browserSession.findMany({
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return NextResponse.json({ sessions });
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { site, action } = body as { site?: string; action?: string };
  if (!site) {
    return NextResponse.json({ error: "site is required" }, { status: 400 });
  }

  const session = await prisma.browserSession.create({
    data: {
      site,
      action: action || "navigate",
      status: "active",
    },
  });

  return NextResponse.json({ session }, { status: 201 });
}
