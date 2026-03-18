/* ── Trend Scanner ──
 * Uses Claude Sonnet with web search to find trending topics
 * across platforms for configured niches.
 * Each niche runs as its own independent scan.
 * Captures deep intel — not just titles, but WHY it's viral and HOW to use it.
 */

import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/db/prisma";
import { getRequiredSetting, getSetting } from "@/lib/db/settings";
import { logModelUsage } from "@/lib/queue/usage-logger";
import { eventBus } from "@/lib/events/event-bus";

const DEFAULT_NICHES = ["AI", "tech", "automation"];

interface ScannedTopic {
  title: string;
  description: string;
  source: string;
  sourceUrl?: string;
  sourceAuthor?: string;
  sourceFollowers?: number;
  platform: string;
  niche: string;
  tags: string[];
  viralityScore: number;
  growthRate?: string;
  contentFormat?: string;
  hookUsed?: string;
  whyViral?: string;
  contentAngle?: string;
  audienceDemo?: string;
  engagementData?: Record<string, unknown>;
  competitorsCovering?: string[];
}

const SCAN_PROMPT = (niche: string) => `You are an elite trend researcher. Search the internet RIGHT NOW for what's blowing up in the "${niche}" space.

Search these sources:
1. Twitter/X — trending tweets, viral threads, ratio'd posts about ${niche}
2. TikTok — viral videos, trending sounds, creator content about ${niche}
3. YouTube — trending shorts, popular new videos about ${niche}
4. Reddit — hot posts, rising discussions in ${niche}-related subreddits
5. Instagram — viral reels, trending carousel posts about ${niche}
6. Google Trends — search spikes related to ${niche}
7. News/blogs — articles getting shared about ${niche}
8. LinkedIn — viral professional posts about ${niche}

For EACH trending topic (find 8-15), return ALL of these fields:

{
  "title": "clear headline of what's trending",
  "description": "2-3 sentences explaining the trend",
  "source": "twitter|tiktok|youtube|reddit|instagram|google_trends|news|linkedin",
  "sourceUrl": "direct link to the trending post/page",
  "sourceAuthor": "@username or channel name who posted it",
  "sourceFollowers": 0 (follower count of the source account, estimate if unknown),
  "platform": "Twitter/X|TikTok|YouTube|Reddit|Instagram|LinkedIn",
  "niche": "${niche}",
  "tags": ["relevant", "hashtags", "keywords"],
  "viralityScore": 0-100 (how viral is this RIGHT NOW),
  "growthRate": "how fast it's growing — e.g. '12K likes in 3 hours', '+400% engagement in 24h'",
  "contentFormat": "what format the original content is — thread|video|carousel|article|meme|short|reel|post",
  "hookUsed": "copy the EXACT first line or describe the first 3 seconds that made people stop scrolling",
  "whyViral": "deep analysis: what emotion does it hit? what pattern is it following? why are people sharing it?",
  "contentAngle": "how should WE cover this topic? what unique angle can we take? what would make our version BETTER than the original?",
  "audienceDemo": "who is engaging with this — age group, profession, interest type",
  "engagementData": { "likes": 0, "comments": 0, "shares": 0, "views": 0, "saves": 0 },
  "competitorsCovering": ["list", "of", "creators", "who", "already", "covered", "this"]
}

CRITICAL: The hookUsed and whyViral fields are the MOST IMPORTANT. Without understanding WHY something went viral and WHAT hook was used, we can't create better content.

Return ONLY a valid JSON array. No markdown, no explanation.`;

export async function scanTrends(niches?: string[]): Promise<number> {
  const trackedNiches = niches || await getTrackedNiches();
  const apiKey = await getRequiredSetting("ANTHROPIC_API_KEY");
  const client = new Anthropic({ apiKey });

  let totalTopics = 0;

  // Each niche runs as its own independent scan
  for (const niche of trackedNiches) {
    const startTime = Date.now();

    try {
      const response = await client.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 8192,
        tools: [
          { type: "web_search_20260209" as const, name: "web_search" as const },
        ],
        messages: [{
          role: "user",
          content: SCAN_PROMPT(niche),
        }],
      });

      const latency = Date.now() - startTime;
      const tokensIn = response.usage.input_tokens;
      const tokensOut = response.usage.output_tokens;
      const cost = (tokensIn * 3 + tokensOut * 15) / 1_000_000;

      await logModelUsage({
        model: "claude",
        taskType: "trend_scan",
        tokensIn,
        tokensOut,
        cost,
        latency,
        success: true,
      });

      // Extract text from response (may have tool use blocks mixed in)
      const textBlocks = response.content.filter((b) => b.type === "text");
      const fullText = textBlocks.map((b) => b.type === "text" ? b.text : "").join("\n");

      // Parse JSON array from response
      let topics: ScannedTopic[] = [];
      try {
        const jsonMatch = fullText.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          topics = JSON.parse(jsonMatch[0]);
        }
      } catch {
        console.error(`[Scanner] Failed to parse topics for niche "${niche}"`);
        continue;
      }

      // Save to DB — skip duplicates
      for (const topic of topics) {
        const existing = await prisma.trendingTopic.findFirst({
          where: {
            title: topic.title,
            scannedAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
          },
        });

        if (existing) {
          if (topic.viralityScore > existing.viralityScore) {
            await prisma.trendingTopic.update({
              where: { id: existing.id },
              data: {
                viralityScore: topic.viralityScore,
                growthRate: topic.growthRate || existing.growthRate,
                engagementData: topic.engagementData as object || undefined,
              },
            });
          }
          continue;
        }

        await prisma.trendingTopic.create({
          data: {
            title: topic.title,
            description: topic.description,
            source: topic.source || "web",
            sourceUrl: topic.sourceUrl,
            sourceAuthor: topic.sourceAuthor,
            sourceFollowers: topic.sourceFollowers,
            platform: topic.platform,
            niche: topic.niche || niche,
            tags: topic.tags || [],
            viralityScore: topic.viralityScore || 50,
            growthRate: topic.growthRate,
            contentFormat: topic.contentFormat,
            hookUsed: topic.hookUsed,
            whyViral: topic.whyViral,
            contentAngle: topic.contentAngle,
            audienceDemo: topic.audienceDemo,
            engagementData: topic.engagementData as object || undefined,
            competitorsCovering: topic.competitorsCovering || [],
            status: "new",
          },
        });
        totalTopics++;
      }

      eventBus.emit({
        type: "task_completed",
        agentName: "Scanner",
        message: `Found ${topics.length} trending topics in "${niche}" (${totalTopics} new)`,
      });
    } catch (err) {
      const latency = Date.now() - startTime;
      console.error(`[Scanner] Error scanning niche "${niche}":`, err);
      await logModelUsage({
        model: "claude",
        taskType: "trend_scan",
        tokensIn: 0,
        tokensOut: 0,
        cost: 0,
        latency,
        success: false,
        error: err instanceof Error ? err.message : "Unknown",
      });
    }
  }

  await prisma.activityLog.create({
    data: {
      type: "success",
      message: `Trend scan complete: ${totalTopics} new topics across ${trackedNiches.join(", ")}`,
      source: "scanner",
    },
  });

  return totalTopics;
}

async function getTrackedNiches(): Promise<string[]> {
  const setting = await getSetting("TRACKED_NICHES");
  if (setting) {
    try {
      return JSON.parse(setting);
    } catch {
      return setting.split(",").map((s) => s.trim());
    }
  }
  return DEFAULT_NICHES;
}
