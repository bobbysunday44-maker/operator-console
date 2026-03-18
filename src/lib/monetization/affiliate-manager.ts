/* ── Affiliate Manager ──
 * Manage affiliate links, inject CTAs into posts, track revenue.
 */

import { prisma } from "@/lib/db/prisma";

export async function getActiveLinks(niche: string, platform?: string) {
  return prisma.affiliateLink.findMany({
    where: { niche, isActive: true, ...(platform ? { platform } : {}) },
    orderBy: { revenue: "desc" },
  });
}

export async function injectCTA(content: string, niche: string, platform: string): Promise<string> {
  // Find best CTA template for this niche/platform
  const cta = await prisma.cTATemplate.findFirst({
    where: { niche, platform, isActive: true },
    orderBy: { conversionRate: "desc" },
  });

  if (!cta) return content;

  // Find best affiliate link
  const link = await prisma.affiliateLink.findFirst({
    where: { niche, platform, isActive: true },
    orderBy: { revenue: "desc" },
  });

  let ctaText = cta.template;
  if (link) {
    ctaText = ctaText.replace("{{link}}", link.shortCode || link.url);
    ctaText = ctaText.replace("{{url}}", link.url);
  }

  // Increment usage
  await prisma.cTATemplate.update({
    where: { id: cta.id },
    data: { timesUsed: { increment: 1 } },
  });

  return `${content}\n\n${ctaText}`;
}

export async function trackClick(shortCode: string, source?: string) {
  const link = await prisma.affiliateLink.findUnique({ where: { shortCode } });
  if (!link) return null;

  await prisma.$transaction([
    prisma.affiliateLink.update({
      where: { id: link.id },
      data: { clicks: { increment: 1 } },
    }),
    prisma.revenueEvent.create({
      data: { affiliateLinkId: link.id, type: "click", source },
    }),
  ]);

  return link;
}

export async function trackConversion(shortCode: string, amount: number, type: string, postId?: string) {
  const link = await prisma.affiliateLink.findUnique({ where: { shortCode } });
  if (!link) return null;

  await prisma.$transaction([
    prisma.affiliateLink.update({
      where: { id: link.id },
      data: { conversions: { increment: 1 }, revenue: { increment: amount } },
    }),
    prisma.revenueEvent.create({
      data: { affiliateLinkId: link.id, type, amount, postId },
    }),
  ]);

  return link;
}

export async function getROIReport(niche?: string, startDate?: Date, endDate?: Date) {
  const where: Record<string, unknown> = {};
  if (niche) where.niche = niche;
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) (where.createdAt as Record<string, Date>).gte = startDate;
    if (endDate) (where.createdAt as Record<string, Date>).lte = endDate;
  }

  const linkWhere: Record<string, unknown> = {};
  if (niche) linkWhere.niche = niche;
  if (startDate) linkWhere.createdAt = { gte: startDate, ...(endDate ? { lte: endDate } : {}) };
  const links = await prisma.affiliateLink.findMany({ where: linkWhere });
  const totalClicks = links.reduce((sum, l) => sum + l.clicks, 0);
  const totalConversions = links.reduce((sum, l) => sum + l.conversions, 0);
  const totalRevenue = links.reduce((sum, l) => sum + l.revenue, 0);

  // Get AI costs for the period
  const costWhere: Record<string, unknown> = {};
  if (startDate) costWhere.createdAt = { gte: startDate };
  const costs = await prisma.modelUsageLog.aggregate({
    where: costWhere,
    _sum: { cost: true },
  });
  const totalCost = costs._sum.cost || 0;

  const roi = totalCost > 0 ? ((totalRevenue - totalCost) / totalCost) * 100 : 0;
  const postCount = await prisma.socialPost.count({ where: { status: "posted" } });
  const revenuePerPost = postCount > 0 ? totalRevenue / postCount : 0;

  return {
    totalClicks,
    totalConversions,
    totalRevenue: Math.round(totalRevenue * 100) / 100,
    totalCost: Math.round(totalCost * 100) / 100,
    roi: Math.round(roi * 100) / 100,
    revenuePerPost: Math.round(revenuePerPost * 100) / 100,
    conversionRate: totalClicks > 0 ? Math.round((totalConversions / totalClicks) * 10000) / 100 : 0,
    topLinks: links.sort((a, b) => b.revenue - a.revenue).slice(0, 5),
  };
}
