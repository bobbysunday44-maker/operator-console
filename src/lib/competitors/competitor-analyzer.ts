/* ── Competitor Analyzer ──
 * Track competitors across platforms, scan their performance,
 * generate AI-powered insights comparing our performance vs theirs.
 */

import { prisma } from "@/lib/db/prisma";

interface AddCompetitorInput {
  name: string;
  platform: string;
  handle: string;
  niche: string;
  followers?: number;
  followingCount?: number;
}

/** Add a new competitor to track */
export async function addCompetitor(data: AddCompetitorInput) {
  const competitor = await prisma.competitor.create({
    data: {
      name: data.name,
      platform: data.platform,
      handle: data.handle,
      niche: data.niche,
      followers: data.followers ?? 0,
      followingCount: data.followingCount ?? 0,
      topHashtags: [],
    },
  });

  await prisma.activityLog.create({
    data: {
      type: "info",
      message: `Competitor added: ${data.name} (@${data.handle} on ${data.platform})`,
      source: "system",
      metadata: { competitorId: competitor.id },
    },
  });

  return competitor;
}

/** Scan a competitor — uses Claude Sonnet to analyze their presence and generate insights */
export async function scanCompetitor(competitorId: string) {
  const competitor = await prisma.competitor.findUnique({
    where: { id: competitorId },
  });
  if (!competitor) throw new Error("Competitor not found");

  // Get API key from settings
  const apiKeySetting = await prisma.setting.findUnique({
    where: { key: "ANTHROPIC_API_KEY" },
  });

  let insights: string | null = null;
  let estimatedFollowers = competitor.followers;
  let estimatedEngagement = competitor.avgEngagement ?? 0;
  let postsFound = 0;
  let topContent: Record<string, unknown>[] | null = null;

  if (apiKeySetting?.value) {
    const prompt = `You are a social media competitor analyst. Analyze this competitor account.

Platform: ${competitor.platform}
Handle: @${competitor.handle}
Name: ${competitor.name}
Niche: ${competitor.niche}
Known followers: ${competitor.followers}

Based on your knowledge of this account (or similar accounts in the ${competitor.niche} niche on ${competitor.platform}):

1. Estimate their current follower count (if you know it)
2. Estimate their posting frequency (posts per day)
3. Estimate their average engagement rate
4. Identify their top content formats (video %, carousel %, image %)
5. Identify their best posting times
6. List their top hashtags
7. Describe their content strategy and what makes them successful
8. Identify weaknesses or gaps we could exploit

Respond in JSON format:
{
  "estimatedFollowers": number,
  "postFrequency": number,
  "avgEngagement": number,
  "contentFormats": { "video": number, "carousel": number, "image": number },
  "bestPostingTime": { "hour": number, "dayOfWeek": number },
  "topHashtags": ["tag1", "tag2", ...],
  "topContent": [{ "description": "...", "estimatedViews": number, "engagementRate": number }],
  "postsFound": number,
  "insights": "Detailed analysis paragraph..."
}`;

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKeySetting.value,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 2048,
          messages: [{ role: "user", content: prompt }],
        }),
      });

      if (response.ok) {
        const result = await response.json();
        const text = result.content?.[0]?.text || "";
        const jsonMatch = text.match(/\{[\s\S]*\}/);

        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          estimatedFollowers = parsed.estimatedFollowers ?? competitor.followers;
          estimatedEngagement = parsed.avgEngagement ?? 0;
          postsFound = parsed.postsFound ?? 0;
          topContent = parsed.topContent ?? null;
          insights = parsed.insights ?? null;

          // Update competitor with scan data
          await prisma.competitor.update({
            where: { id: competitorId },
            data: {
              followers: estimatedFollowers,
              postFrequency: parsed.postFrequency ?? null,
              avgEngagement: estimatedEngagement,
              topHashtags: parsed.topHashtags ?? [],
              contentFormats: parsed.contentFormats ?? null,
              bestPostingTime: parsed.bestPostingTime ?? null,
              lastScanned: new Date(),
            },
          });
        }
      }
    } catch (err) {
      console.error("Competitor scan API error:", err);
      insights = `Scan failed: ${err instanceof Error ? err.message : "Unknown error"}. Manual data entry required.`;
    }
  } else {
    insights = "No API key configured. Add ANTHROPIC_API_KEY in Settings to enable AI-powered competitor scanning.";
  }

  // Create scan record
  const scan = await prisma.competitorScan.create({
    data: {
      competitorId,
      followers: estimatedFollowers,
      engagement: estimatedEngagement,
      postsFound,
      topContent: (topContent || []) as object,
      insights,
    },
  });

  // Update lastScanned even if API call failed
  await prisma.competitor.update({
    where: { id: competitorId },
    data: { lastScanned: new Date() },
  });

  await prisma.activityLog.create({
    data: {
      type: "success",
      message: `Competitor scanned: ${competitor.name} (@${competitor.handle})`,
      source: "system",
      metadata: { competitorId, scanId: scan.id },
    },
  });

  return scan;
}

/** Scan all active competitors (for scheduled/batch runs) */
export async function scanAllCompetitors() {
  const competitors = await prisma.competitor.findMany({
    where: { isActive: true },
    orderBy: { lastScanned: { sort: "asc", nulls: "first" } },
  });

  const results = {
    total: competitors.length,
    scanned: 0,
    errors: [] as string[],
  };

  for (const competitor of competitors) {
    try {
      await scanCompetitor(competitor.id);
      results.scanned++;

      // Small delay between scans to avoid API rate limits
      await new Promise((resolve) => setTimeout(resolve, 2000));
    } catch (err) {
      results.errors.push(
        `Failed to scan ${competitor.name}: ${err instanceof Error ? err.message : "Unknown"}`
      );
    }
  }

  return results;
}

/** Get competitor insights for a niche — compare our performance vs competitors */
export async function getCompetitorInsights(niche: string) {
  const competitors = await prisma.competitor.findMany({
    where: { niche, isActive: true },
    include: {
      scans: { orderBy: { scannedAt: "desc" }, take: 1 },
    },
  });

  // Get our performance in this niche
  const ourPosts = await prisma.socialPost.findMany({
    where: {
      status: "posted",
      contentItem: { niche },
    },
    include: { performances: { orderBy: { capturedAt: "desc" }, take: 1 } },
  });

  const ourTotalViews = ourPosts.reduce(
    (sum, p) => sum + (p.performances[0]?.views ?? 0),
    0
  );
  const ourTotalEngagements = ourPosts.reduce(
    (sum, p) =>
      sum +
      (p.performances[0]?.likes ?? 0) +
      (p.performances[0]?.shares ?? 0) +
      (p.performances[0]?.comments ?? 0),
    0
  );
  const ourAvgEngagement =
    ourTotalViews > 0
      ? Math.round((ourTotalEngagements / ourTotalViews) * 10000) / 100
      : 0;

  // Get our follower count across platforms
  const ourPlatforms = await prisma.platform.findMany({
    where: { OR: [{ niche }, { niche: "" }], connected: true },
  });
  const ourFollowers = ourPlatforms.reduce((sum, p) => sum + p.followers, 0);

  const competitorSummaries = competitors.map((c) => ({
    id: c.id,
    name: c.name,
    platform: c.platform,
    handle: c.handle,
    followers: c.followers,
    avgEngagement: c.avgEngagement ?? 0,
    postFrequency: c.postFrequency ?? 0,
    lastScanned: c.lastScanned,
    latestInsights: c.scans[0]?.insights ?? null,
  }));

  const avgCompetitorFollowers =
    competitors.length > 0
      ? Math.round(
          competitors.reduce((sum, c) => sum + c.followers, 0) / competitors.length
        )
      : 0;
  const avgCompetitorEngagement =
    competitors.length > 0
      ? Math.round(
          (competitors.reduce((sum, c) => sum + (c.avgEngagement ?? 0), 0) /
            competitors.length) *
            100
        ) / 100
      : 0;

  return {
    niche,
    ourStats: {
      followers: ourFollowers,
      postsPublished: ourPosts.length,
      totalViews: ourTotalViews,
      avgEngagement: ourAvgEngagement,
    },
    competitorCount: competitors.length,
    avgCompetitorFollowers,
    avgCompetitorEngagement,
    competitors: competitorSummaries,
    followerGap: avgCompetitorFollowers - ourFollowers,
    engagementGap:
      Math.round((avgCompetitorEngagement - ourAvgEngagement) * 100) / 100,
  };
}

/** Get a detailed report on a single competitor */
export async function getCompetitorReport(competitorId: string) {
  const competitor = await prisma.competitor.findUnique({
    where: { id: competitorId },
    include: {
      scans: { orderBy: { scannedAt: "desc" }, take: 10 },
    },
  });
  if (!competitor) throw new Error("Competitor not found");

  // Calculate trends from scan history
  const scans = competitor.scans;
  const followerTrend =
    scans.length >= 2
      ? scans[0].followers - scans[scans.length - 1].followers
      : 0;
  const engagementTrend =
    scans.length >= 2
      ? Math.round(
          ((scans[0].engagement ?? 0) - (scans[scans.length - 1].engagement ?? 0)) *
            100
        ) / 100
      : 0;

  return {
    competitor: {
      id: competitor.id,
      name: competitor.name,
      platform: competitor.platform,
      handle: competitor.handle,
      niche: competitor.niche,
      followers: competitor.followers,
      followingCount: competitor.followingCount,
      postFrequency: competitor.postFrequency,
      avgEngagement: competitor.avgEngagement,
      topHashtags: competitor.topHashtags,
      contentFormats: competitor.contentFormats,
      bestPostingTime: competitor.bestPostingTime,
      lastScanned: competitor.lastScanned,
      isActive: competitor.isActive,
    },
    scanHistory: scans.map((s) => ({
      id: s.id,
      followers: s.followers,
      engagement: s.engagement,
      postsFound: s.postsFound,
      topContent: s.topContent,
      insights: s.insights,
      scannedAt: s.scannedAt,
    })),
    trends: {
      followerChange: followerTrend,
      engagementChange: engagementTrend,
      totalScans: scans.length,
    },
  };
}
