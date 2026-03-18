import { NextResponse } from "next/server";
import { createCampaign, getCampaigns, getDashboardStats } from "@/lib/campaigns/campaign-manager";
import { getCampaignDashboard } from "@/lib/business/campaign-lifecycle";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const niche = searchParams.get("niche");
    const characterId = searchParams.get("characterId");
    const dashboard = searchParams.get("dashboard");

    // Return dashboard stats if requested
    if (dashboard === "true") {
      const stats = await getDashboardStats();
      // Phase 15: Include full business model dashboard stats
      let businessDashboard = null;
      try {
        businessDashboard = await getCampaignDashboard();
      } catch (dashErr) {
        console.error("[Campaigns API] Business dashboard failed:", dashErr);
      }
      return NextResponse.json({ stats, businessDashboard });
    }

    const filters: Record<string, string> = {};
    if (status) filters.status = status;
    if (niche) filters.niche = niche;
    if (characterId) filters.characterId = characterId;

    const campaigns = await getCampaigns(filters);
    return NextResponse.json({ campaigns });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch campaigns" },
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

  if (!body.businessName || typeof body.businessName !== "string") {
    return NextResponse.json({ error: "businessName is required" }, { status: 400 });
  }
  if (!body.niche || typeof body.niche !== "string") {
    return NextResponse.json({ error: "niche is required" }, { status: 400 });
  }

  try {
    const campaign = await createCampaign({
      businessName: body.businessName as string,
      businessEmail: body.businessEmail as string | undefined,
      businessUrl: body.businessUrl as string | undefined,
      characterId: body.characterId as string | undefined,
      niche: body.niche as string,
      commission: body.commission as number | undefined,
      notes: body.notes as string | undefined,
      status: body.status as string | undefined,
    });
    return NextResponse.json({ campaign }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to create campaign" },
      { status: 500 }
    );
  }
}
