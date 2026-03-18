import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getCampaignROI, updateCampaignStats } from "@/lib/campaigns/campaign-manager";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const includeROI = searchParams.get("roi") === "true";

  try {
    const campaign = await prisma.campaign.findUnique({
      where: { id },
      include: {
        outreaches: {
          orderBy: { createdAt: "desc" },
          take: 20,
        },
      },
    });

    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    let roi = null;
    if (includeROI) {
      try {
        roi = await getCampaignROI(id);
      } catch {
        // ROI calculation is optional
      }
    }

    return NextResponse.json({ campaign, roi });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch campaign" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  try {
    // Check if campaign exists
    const existing = await prisma.campaign.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    // Build update data — only include provided fields
    const data: Record<string, unknown> = {};
    if (body.businessName !== undefined) data.businessName = body.businessName;
    if (body.businessEmail !== undefined) data.businessEmail = body.businessEmail;
    if (body.businessUrl !== undefined) data.businessUrl = body.businessUrl;
    if (body.characterId !== undefined) data.characterId = body.characterId;
    if (body.niche !== undefined) data.niche = body.niche;
    if (body.status !== undefined) data.status = body.status;
    if (body.commission !== undefined) data.commission = body.commission;
    if (body.notes !== undefined) data.notes = body.notes;
    if (body.endedAt !== undefined) data.endedAt = body.endedAt ? new Date(body.endedAt as string) : null;

    // If status changed to completed, set endedAt
    if (body.status === "completed" && !existing.endedAt) {
      data.endedAt = new Date();
    }

    // Recalculate stats if requested
    if (body.recalculate === true) {
      await updateCampaignStats(id);
    }

    const campaign = await prisma.campaign.update({ where: { id }, data });
    return NextResponse.json({ campaign });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to update campaign" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const existing = await prisma.campaign.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    await prisma.campaign.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to delete campaign" },
      { status: 500 }
    );
  }
}
