import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { queueOutreach, getOutreachStats, processOutreachQueue } from "@/lib/outreach/outreach-engine";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const campaignId = searchParams.get("campaignId");
    const stats = searchParams.get("stats");

    // Return stats if requested
    if (stats === "true") {
      const outreachStats = await getOutreachStats();
      return NextResponse.json({ stats: outreachStats });
    }

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (campaignId) where.campaignId = campaignId;

    const outreaches = await prisma.outreach.findMany({
      where,
      include: { campaign: { select: { id: true, businessName: true, niche: true } } },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json({ outreaches });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch outreaches" },
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

  // Check if this is a queue processing request
  if (body.action === "process_queue") {
    try {
      const result = await processOutreachQueue();
      return NextResponse.json({ result });
    } catch (err) {
      return NextResponse.json(
        { error: err instanceof Error ? err.message : "Failed to process queue" },
        { status: 500 }
      );
    }
  }

  // Validate required fields for creating outreach
  if (!body.businessName || typeof body.businessName !== "string") {
    return NextResponse.json({ error: "businessName is required" }, { status: 400 });
  }
  if (!body.businessEmail || typeof body.businessEmail !== "string") {
    return NextResponse.json({ error: "businessEmail is required" }, { status: 400 });
  }

  try {
    const outreach = await queueOutreach({
      campaignId: body.campaignId as string | undefined,
      businessName: body.businessName as string,
      businessEmail: body.businessEmail as string,
      businessUrl: body.businessUrl as string | undefined,
      contactName: body.contactName as string | undefined,
      channel: body.channel as string | undefined,
      characterName: body.characterName as string | undefined,
      niche: body.niche as string | undefined,
    });

    return NextResponse.json({ outreach }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to create outreach" },
      { status: 500 }
    );
  }
}
