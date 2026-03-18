/* ── Campaign Lifecycle ──
 * Full campaign lifecycle: pitched -> accepted -> content creation -> publishing -> tracking -> invoice
 * Wires the advertising agency business model into the agent workflow.
 * AI models advertise for businesses, earn commission per sale.
 *
 * Usage:
 *   import { createCampaignFromAcceptedPitch, assignModelToCampaign } from "@/lib/business/campaign-lifecycle";
 */

import { prisma } from "@/lib/db/prisma";
import { sendMessage } from "@/lib/agent-runtime/agent-chat";
import { addMemory } from "@/lib/agent-runtime/memory-stream";

// ── Types ──

export interface CampaignDashboard {
  totalActiveCampaigns: number;
  totalRevenue: number;
  totalCommissionEarned: number;
  revenueThisMonth: number;
  commissionThisMonth: number;
  topCampaigns: Array<{
    id: string;
    businessName: string;
    niche: string;
    revenue: number;
    commission: number;
    status: string;
  }>;
  campaignsNeedingContent: Array<{
    id: string;
    businessName: string;
    niche: string;
    characterId: string | null;
  }>;
  pipeline: {
    pitched: number;
    active: number;
    paused: number;
    completed: number;
  };
}

// ── Core Lifecycle Functions ──

/**
 * When a business accepts the pitch:
 * - Update outreach status to "accepted"
 * - Create Campaign record from outreach data
 * - Notify Writer agent via agent chat
 * - Create affiliate link for this campaign
 * - Create CTA template for this business
 * - Log activity
 */
export async function createCampaignFromAcceptedPitch(outreachId: string) {
  try {
    // 1. Fetch the outreach record
    const outreach = await prisma.outreach.findUnique({
      where: { id: outreachId },
      include: { campaign: true },
    });
    if (!outreach) {
      throw new Error(`Outreach ${outreachId} not found`);
    }

    // 2. Update outreach status to "accepted"
    await prisma.outreach.update({
      where: { id: outreachId },
      data: {
        status: "accepted",
        repliedAt: new Date(),
      },
    });

    // 3. Create Campaign record from outreach data
    const campaign = await prisma.campaign.create({
      data: {
        businessName: outreach.businessName,
        businessEmail: outreach.businessEmail,
        businessUrl: outreach.businessUrl,
        niche: outreach.campaign?.niche || "general",
        status: "active",
        commission: outreach.campaign?.commission ?? 0.15, // default 15%
        notes: `Created from accepted pitch. Contact: ${outreach.contactName || outreach.businessEmail}`,
      },
    });

    // Link the outreach to the new campaign
    await prisma.outreach.update({
      where: { id: outreachId },
      data: { campaignId: campaign.id },
    });

    // 4. Notify Writer agent via agent chat
    try {
      await sendMessage(
        "outreach",
        "system",
        "System",
        "system",
        `New campaign: ${outreach.businessName}. @Writer create ad content for ${outreach.businessName}'s products in the ${campaign.niche} niche. Campaign ID: ${campaign.id}`,
        undefined,
        "text",
        { campaignId: campaign.id, event: "pitch_accepted" }
      );
    } catch (chatErr) {
      console.error("[CampaignLifecycle] Failed to notify via chat:", chatErr);
    }

    // 5. Create affiliate link for this campaign
    try {
      const shortCode = `oc-${campaign.businessName.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 10)}-${Date.now().toString(36)}`;
      await prisma.affiliateLink.create({
        data: {
          niche: campaign.niche,
          name: `${campaign.businessName} - Campaign Link`,
          url: outreach.businessUrl || `https://${campaign.businessName.toLowerCase().replace(/\s/g, "")}.com`,
          shortCode,
          platform: "all",
          campaign: campaign.businessName,
          commissionRate: campaign.commission,
          isActive: true,
        },
      });
    } catch (linkErr) {
      console.error("[CampaignLifecycle] Failed to create affiliate link:", linkErr);
    }

    // 6. Create CTA template for this business
    try {
      await prisma.cTATemplate.create({
        data: {
          niche: campaign.niche,
          name: `${campaign.businessName} CTA`,
          type: "link_in_bio",
          template: `Check out ${campaign.businessName} — link in bio! Use our exclusive link for special offers.`,
          platform: "all",
          isActive: true,
        },
      });
    } catch (ctaErr) {
      console.error("[CampaignLifecycle] Failed to create CTA template:", ctaErr);
    }

    // 7. Log activity
    await prisma.activityLog.create({
      data: {
        type: "success",
        message: `Campaign created from accepted pitch: ${outreach.businessName} (${campaign.niche}). Commission: ${(campaign.commission * 100).toFixed(0)}%`,
        source: "system",
        metadata: {
          campaignId: campaign.id,
          outreachId: outreach.id,
          businessName: outreach.businessName,
        },
      },
    });

    // 8. Store memory for Outreach Bot
    try {
      await addMemory(
        "agent-outreach",
        `${outreach.businessName} accepted our pitch! Created campaign with ${(campaign.commission * 100).toFixed(0)}% commission. Next step: content creation.`,
        "experience",
        9, // high importance — deal closed
        "campaign-lifecycle",
        campaign.id,
        ["deal", "accepted", outreach.businessName.toLowerCase(), campaign.niche]
      );
    } catch (memErr) {
      console.error("[CampaignLifecycle] Failed to store memory:", memErr);
    }

    return campaign;
  } catch (err) {
    console.error("[CampaignLifecycle] createCampaignFromAcceptedPitch failed:", err);
    throw err;
  }
}

/**
 * Assign an AI model (character) to a campaign.
 * Notifies the team to start creating content featuring this character.
 */
export async function assignModelToCampaign(campaignId: string, characterId: string) {
  try {
    // Fetch campaign and character
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
    });
    if (!campaign) throw new Error(`Campaign ${campaignId} not found`);

    const character = await prisma.character.findUnique({
      where: { id: characterId },
    });
    if (!character) throw new Error(`Character ${characterId} not found`);

    // Update campaign with character assignment
    const updated = await prisma.campaign.update({
      where: { id: campaignId },
      data: { characterId },
    });

    // Notify the team
    try {
      await sendMessage(
        "pipeline",
        "system",
        "System",
        "system",
        `@Writer create content featuring ${character.name} for ${campaign.businessName}. Niche: ${campaign.niche}. Campaign ID: ${campaign.id}. This is a paid campaign — content should showcase their products naturally.`,
        undefined,
        "text",
        { campaignId, characterId, event: "model_assigned" }
      );
    } catch (chatErr) {
      console.error("[CampaignLifecycle] Failed to notify team:", chatErr);
    }

    // Log activity
    await prisma.activityLog.create({
      data: {
        type: "info",
        message: `Character ${character.name} assigned to campaign: ${campaign.businessName}`,
        source: "system",
        metadata: { campaignId, characterId, characterName: character.name },
      },
    });

    return updated;
  } catch (err) {
    console.error("[CampaignLifecycle] assignModelToCampaign failed:", err);
    throw err;
  }
}

/**
 * Track campaign performance by aggregating data from affiliate links.
 * Sums clicks/conversions/revenue from linked affiliate links.
 * Updates campaign stats.
 */
export async function trackCampaignPerformance(campaignId: string) {
  try {
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
    });
    if (!campaign) throw new Error(`Campaign ${campaignId} not found`);

    // Get all affiliate links for this campaign
    const affiliateLinks = await prisma.affiliateLink.findMany({
      where: {
        OR: [
          { campaign: campaign.businessName },
          { niche: campaign.niche, campaign: campaign.businessName },
        ],
        isActive: true,
      },
    });

    const totalClicks = affiliateLinks.reduce((sum, l) => sum + l.clicks, 0);
    const totalConversions = affiliateLinks.reduce((sum, l) => sum + l.conversions, 0);
    const totalRevenue = affiliateLinks.reduce((sum, l) => sum + l.revenue, 0);

    // Also sum from RevenueEvent records for more granular tracking
    const affiliateLinkIds = affiliateLinks.map((l) => l.id);
    let revenueFromEvents = 0;
    let conversionsFromEvents = 0;
    let clicksFromEvents = 0;

    if (affiliateLinkIds.length > 0) {
      const eventAgg = await prisma.revenueEvent.groupBy({
        by: ["type"],
        where: {
          affiliateLinkId: { in: affiliateLinkIds },
        },
        _sum: { amount: true },
        _count: true,
      });

      for (const group of eventAgg) {
        if (group.type === "sale") {
          revenueFromEvents += group._sum.amount || 0;
          conversionsFromEvents += group._count;
        } else if (group.type === "click") {
          clicksFromEvents += group._count;
        }
      }
    }

    // Use the higher of aggregate vs event-based counts
    const finalClicks = Math.max(totalClicks, clicksFromEvents);
    const finalConversions = Math.max(totalConversions, conversionsFromEvents);
    const finalRevenue = Math.max(totalRevenue, revenueFromEvents);

    // Count content items tied to this campaign's niche
    const contentCount = await prisma.contentItem.count({
      where: { niche: campaign.niche, status: "published" },
    });

    const updated = await prisma.campaign.update({
      where: { id: campaignId },
      data: {
        totalClicks: finalClicks,
        totalConversions: finalConversions,
        totalRevenue: Math.round(finalRevenue * 100) / 100,
        contentCount,
      },
    });

    return updated;
  } catch (err) {
    console.error("[CampaignLifecycle] trackCampaignPerformance failed:", err);
    throw err;
  }
}

/**
 * Get comprehensive campaign dashboard stats.
 */
export async function getCampaignDashboard(): Promise<CampaignDashboard> {
  try {
    // Pipeline status counts
    const pipelineCounts = await prisma.campaign.groupBy({
      by: ["status"],
      _count: true,
    });

    const pipeline = {
      pitched: 0,
      active: 0,
      paused: 0,
      completed: 0,
    };
    for (const group of pipelineCounts) {
      if (group.status in pipeline) {
        pipeline[group.status as keyof typeof pipeline] = group._count;
      }
    }

    // All campaigns for revenue calculations
    const allCampaigns = await prisma.campaign.findMany({
      orderBy: { totalRevenue: "desc" },
    });

    const totalRevenue = allCampaigns.reduce((sum, c) => sum + c.totalRevenue, 0);
    const totalCommissionEarned = allCampaigns.reduce(
      (sum, c) => sum + c.totalRevenue * c.commission,
      0
    );

    // Revenue this month
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const revenueEventsThisMonth = await prisma.revenueEvent.aggregate({
      where: {
        type: "sale",
        createdAt: { gte: monthStart },
      },
      _sum: { amount: true },
    });
    const revenueThisMonth = revenueEventsThisMonth._sum.amount || 0;

    // Approximate commission this month (use average commission rate)
    const avgCommission = allCampaigns.length > 0
      ? allCampaigns.reduce((sum, c) => sum + c.commission, 0) / allCampaigns.length
      : 0.15;
    const commissionThisMonth = revenueThisMonth * avgCommission;

    // Top performing campaigns
    const topCampaigns = allCampaigns
      .filter((c) => c.totalRevenue > 0 || c.status === "active")
      .slice(0, 10)
      .map((c) => ({
        id: c.id,
        businessName: c.businessName,
        niche: c.niche,
        revenue: Math.round(c.totalRevenue * 100) / 100,
        commission: Math.round(c.totalRevenue * c.commission * 100) / 100,
        status: c.status,
      }));

    // Campaigns needing content (contentCount = 0 and status is active)
    const campaignsNeedingContent = allCampaigns
      .filter((c) => c.contentCount === 0 && c.status === "active")
      .map((c) => ({
        id: c.id,
        businessName: c.businessName,
        niche: c.niche,
        characterId: c.characterId,
      }));

    return {
      totalActiveCampaigns: pipeline.active,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      totalCommissionEarned: Math.round(totalCommissionEarned * 100) / 100,
      revenueThisMonth: Math.round(revenueThisMonth * 100) / 100,
      commissionThisMonth: Math.round(commissionThisMonth * 100) / 100,
      topCampaigns,
      campaignsNeedingContent,
      pipeline,
    };
  } catch (err) {
    console.error("[CampaignLifecycle] getCampaignDashboard failed:", err);
    throw err;
  }
}

/**
 * Close/end a campaign.
 * Sets status to "completed", records final stats, stores memory.
 */
export async function closeCampaign(campaignId: string, reason: string) {
  try {
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
    });
    if (!campaign) throw new Error(`Campaign ${campaignId} not found`);

    // Final stats refresh before closing
    try {
      await trackCampaignPerformance(campaignId);
    } catch {
      // Non-critical — proceed with close even if stats refresh fails
    }

    // Re-fetch to get updated stats
    const refreshed = await prisma.campaign.findUnique({
      where: { id: campaignId },
    });

    const finalRevenue = refreshed?.totalRevenue ?? campaign.totalRevenue;
    const commissionEarned = finalRevenue * campaign.commission;

    // Update campaign to completed
    const updated = await prisma.campaign.update({
      where: { id: campaignId },
      data: {
        status: "completed",
        endedAt: new Date(),
        notes: campaign.notes
          ? `${campaign.notes}\n\nClosed: ${reason}`
          : `Closed: ${reason}`,
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        type: "info",
        message: `Campaign closed: ${campaign.businessName}. Revenue: $${finalRevenue.toFixed(2)}. Commission: $${commissionEarned.toFixed(2)}. Reason: ${reason}`,
        source: "system",
        metadata: {
          campaignId,
          businessName: campaign.businessName,
          finalRevenue,
          commissionEarned,
          reason,
        },
      },
    });

    // Memory for Outreach Bot
    try {
      await addMemory(
        "agent-outreach",
        `Campaign with ${campaign.businessName} ended. Revenue: $${finalRevenue.toFixed(2)}. Commission earned: $${commissionEarned.toFixed(2)}. Reason: ${reason}. ${finalRevenue > 0 ? "This was a paying client." : "No revenue generated."}`,
        "experience",
        7,
        "campaign-lifecycle",
        campaignId,
        ["campaign-closed", campaign.businessName.toLowerCase(), campaign.niche, reason.toLowerCase()]
      );
    } catch (memErr) {
      console.error("[CampaignLifecycle] Failed to store close memory:", memErr);
    }

    // Notify in chat
    try {
      await sendMessage(
        "outreach",
        "system",
        "System",
        "system",
        `Campaign with ${campaign.businessName} has ended. Final revenue: $${finalRevenue.toFixed(2)}. Commission: $${commissionEarned.toFixed(2)}. Reason: ${reason}`,
        undefined,
        "text",
        { campaignId, event: "campaign_closed" }
      );
    } catch (chatErr) {
      console.error("[CampaignLifecycle] Failed to notify close:", chatErr);
    }

    return updated;
  } catch (err) {
    console.error("[CampaignLifecycle] closeCampaign failed:", err);
    throw err;
  }
}
