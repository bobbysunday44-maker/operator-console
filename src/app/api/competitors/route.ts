import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { addCompetitor, getCompetitorInsights } from "@/lib/competitors/competitor-analyzer";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const niche = searchParams.get("niche");
    const platform = searchParams.get("platform");
    const insights = searchParams.get("insights");

    // Return niche-level insights if requested
    if (insights === "true" && niche) {
      const nicheInsights = await getCompetitorInsights(niche);
      return NextResponse.json({ insights: nicheInsights });
    }

    const where: Record<string, unknown> = { isActive: true };
    if (niche) where.niche = niche;
    if (platform) where.platform = platform;

    const competitors = await prisma.competitor.findMany({
      where,
      include: {
        scans: { orderBy: { scannedAt: "desc" }, take: 1 },
      },
      orderBy: { followers: "desc" },
    });

    return NextResponse.json({ competitors });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch competitors" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.name || typeof body.name !== "string") {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }
  if (!body.platform || typeof body.platform !== "string") {
    return NextResponse.json({ error: "platform is required" }, { status: 400 });
  }
  if (!body.handle || typeof body.handle !== "string") {
    return NextResponse.json({ error: "handle is required" }, { status: 400 });
  }
  if (!body.niche || typeof body.niche !== "string") {
    return NextResponse.json({ error: "niche is required" }, { status: 400 });
  }

  try {
    const competitor = await addCompetitor({
      name: body.name as string,
      platform: body.platform as string,
      handle: body.handle as string,
      niche: body.niche as string,
      followers: body.followers as number | undefined,
      followingCount: body.followingCount as number | undefined,
    });

    return NextResponse.json({ competitor }, { status: 201 });
  } catch (err) {
    // Handle unique constraint violation (duplicate platform+handle)
    const message = err instanceof Error ? err.message : "Failed to add competitor";
    const status = message.includes("Unique constraint") ? 409 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
