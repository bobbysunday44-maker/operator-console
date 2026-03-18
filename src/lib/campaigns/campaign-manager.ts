/* ── Campaign Manager ──
 * Create campaigns, track revenue, calculate ROI for business deals.
 * Each campaign ties a business to an AI character that advertises for them.
 */

import { prisma } from "@/lib/db/prisma";

interface CreateCampaignInput {
  businessName: string;
  businessEmail?: string;
  businessUrl?: string;
  characterId?: string;
  niche: string;
  commission?: number;
  notes?: string;
  status?: string;
}

interface CampaignFilters {
  status?: string;
  niche?: string;
  characterId?: string;
}

/** Create a new campaign record */
export async function createCampaign(data: CreateCampaignInput) {
  const campaign = await prisma.campaign.create({
    data: {
      businessName: data.businessName,
      businessEmail: data.businessEmail || null,
      businessUrl: data.businessUrl || null,
      characterId: data.characterId || null,
      niche: data.niche,
      commission: data.commission ?? 0,
      notes: data.notes || null,
      status: data.status || "active",
    },
    include: { outreaches: true },
  });

  await prisma.activityLog.create({
    data: {
      type: "success",
      message: `Campaign created: ${data.businessName} (${data.niche})`,
      source: "system",
      metadata: { campaignId: campaign.id },
    },
  });

  return campaign;
}

/** List campaigns with optional filters */
export async function getCampaigns(filters: CampaignFilters = {}) {
  const where: Record<string, unknown> = {};
  if (filters.status) where.status = filters.status;
  if (filters.niche) where.niche = filters.niche;
  if (filters.characterId) where.characterId = filters.characterId;

  return prisma.campaign.findMany({
    where,
    include: { outreaches: { select: { id: true, status: true } } },
    orderBy: { createdAt: "desc" },
  });
}

/** Recalculate campaign stats from linked affiliate events and outreach data */
export async function updateCampaignStats(campaignId: string) {
  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    include: { outreaches: true },
  });
  if (!campaign) throw new Error("Campaign not found");

  // Count revenue from affiliate links matching this campaign's business/niche
  const affiliateLinks = await prisma.affiliateLink.findMany({
    where: {
      niche: campaign.niche,
      campaign: campaign.businessName,
      isActive: true,
    },
  });

  const totalClicks = affiliateLinks.reduce((sum, l) => sum + l.clicks, 0);
  const totalConversions = affiliateLinks.reduce((sum, l) => sum + l.conversions, 0);
  const totalRevenue = affiliateLinks.reduce((sum, l) => sum + l.revenue, 0);

  // Count content items in this niche that are published
  const contentCount = await prisma.contentItem.count({
    where: { niche: campaign.niche, status: "published" },
  });

  const updated = await prisma.campaign.update({
    where: { id: campaignId },
    data: {
      totalClicks,
      totalConversions,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      contentCount,
    },
  });

  return updated;
}

/** Calculate ROI for a specific campaign */
export async function getCampaignROI(campaignId: string) {
  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
  });
  if (!campaign) throw new Error("Campaign not found");

  // Get AI costs attributed to this campaign's niche
  const costs = await prisma.modelUsageLog.aggregate({
    where: {
      createdAt: { gte: campaign.startedAt },
    },
    _sum: { cost: true },
  });
  const totalCost = costs._sum.cost || 0;

  const grossRevenue = campaign.totalRevenue;
  const commissionEarned = grossRevenue * campaign.commission;
  const roi = totalCost > 0 ? ((commissionEarned - totalCost) / totalCost) * 100 : 0;

  return {
    campaignId: campaign.id,
    businessName: campaign.businessName,
    grossRevenue: Math.round(grossRevenue * 100) / 100,
    commissionRate: campaign.commission,
    commissionEarned: Math.round(commissionEarned * 100) / 100,
    totalCost: Math.round(totalCost * 100) / 100,
    roi: Math.round(roi * 100) / 100,
    totalClicks: campaign.totalClicks,
    totalConversions: campaign.totalConversions,
    contentCount: campaign.contentCount,
    conversionRate: campaign.totalClicks > 0
      ? Math.round((campaign.totalConversions / campaign.totalClicks) * 10000) / 100
      : 0,
  };
}

/** Get dashboard-level campaign stats */
export async function getDashboardStats() {
  const activeCampaigns = await prisma.campaign.count({
    where: { status: "active" },
  });

  const allCampaigns = await prisma.campaign.findMany({
    where: { status: { in: ["active", "completed"] } },
  });

  const totalRevenue = allCampaigns.reduce((sum, c) => sum + c.totalRevenue, 0);
  const totalCommission = allCampaigns.reduce(
    (sum, c) => sum + c.totalRevenue * c.commission,
    0
  );
  const totalClicks = allCampaigns.reduce((sum, c) => sum + c.totalClicks, 0);
  const totalConversions = allCampaigns.reduce((sum, c) => sum + c.totalConversions, 0);

  // Top campaigns by revenue
  const topCampaigns = [...allCampaigns]
    .sort((a, b) => b.totalRevenue - a.totalRevenue)
    .slice(0, 5)
    .map((c) => ({
      id: c.id,
      businessName: c.businessName,
      niche: c.niche,
      revenue: c.totalRevenue,
      commission: Math.round(c.totalRevenue * c.commission * 100) / 100,
    }));

  // Campaigns by niche
  const nicheMap = new Map<string, { count: number; revenue: number }>();
  for (const c of allCampaigns) {
    const existing = nicheMap.get(c.niche) || { count: 0, revenue: 0 };
    existing.count++;
    existing.revenue += c.totalRevenue;
    nicheMap.set(c.niche, existing);
  }
  const byNiche = Object.fromEntries(nicheMap);

  return {
    activeCampaigns,
    totalCampaigns: allCampaigns.length,
    totalRevenue: Math.round(totalRevenue * 100) / 100,
    totalCommission: Math.round(totalCommission * 100) / 100,
    totalClicks,
    totalConversions,
    conversionRate: totalClicks > 0
      ? Math.round((totalConversions / totalClicks) * 10000) / 100
      : 0,
    topCampaigns,
    byNiche,
  };
}
