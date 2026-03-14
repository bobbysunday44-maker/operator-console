/* ── OpenClaw Analytics Mock Data ── */

import type { AnalyticsSummary, DailyMetric } from "./types";

function generateTrend(days: number, base: number, variance: number, growth: number): DailyMetric[] {
  const result: DailyMetric[] = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const noise = (Math.random() - 0.5) * variance;
    const trend = base + (days - i) * growth + noise;
    result.push({
      date: d.toISOString().slice(5, 10),
      value: Math.round(Math.max(0, trend)),
    });
  }
  return result;
}

export function getAnalyticsSummary(): AnalyticsSummary {
  return {
    totalFollowers: 14820,
    followersGrowth: 342,
    totalEngagement: "4.2%",
    contentCreated: 47,
    totalCostToday: 1.24,
    totalCostMonth: 34.50,

    platformMetrics: [
      { platform: "TikTok", followers: 5200, followersGrowth: 180, engagement: 6.8, posts: 18, impressions: 45000 },
      { platform: "Instagram", followers: 4100, followersGrowth: 95, engagement: 3.4, posts: 14, impressions: 28000 },
      { platform: "Twitter/X", followers: 3800, followersGrowth: 52, engagement: 2.1, posts: 22, impressions: 31000 },
      { platform: "YouTube", followers: 1200, followersGrowth: 12, engagement: 5.2, posts: 3, impressions: 8500 },
      { platform: "LinkedIn", followers: 520, followersGrowth: 3, engagement: 1.8, posts: 4, impressions: 2200 },
    ],

    costByModel: [
      { model: "Claude Sonnet 4.6", dailyCost: 0.89, monthlyCost: 26.70, requests: 142, color: "#7C3AED" },
      { model: "Veo 3.1", dailyCost: 0.23, monthlyCost: 6.90, requests: 14, color: "#0D9488" },
      { model: "Nano Banana 2", dailyCost: 0.12, monthlyCost: 3.60, requests: 47, color: "#2563EB" },
      { model: "Kling Lip Sync", dailyCost: 0.00, monthlyCost: 0.00, requests: 0, color: "#DB2777" },
      { model: "edge-tts", dailyCost: 0.00, monthlyCost: 0.00, requests: 38, color: "#D97706" },
      { model: "FFmpeg", dailyCost: 0.00, monthlyCost: 0.00, requests: 14, color: "#059669" },
    ],

    followerTrend: generateTrend(14, 13800, 100, 70),
    engagementTrend: generateTrend(14, 35, 8, 0.5),
    contentTrend: generateTrend(14, 2, 2, 0.2),
    costTrend: generateTrend(14, 0.8, 0.4, 0.03),
  };
}
