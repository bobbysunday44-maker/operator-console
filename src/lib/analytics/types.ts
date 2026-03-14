/* ── OpenClaw Analytics Types ── */

export interface DailyMetric {
  date: string;
  value: number;
}

export interface PlatformMetrics {
  platform: string;
  followers: number;
  followersGrowth: number;
  engagement: number;
  posts: number;
  impressions: number;
}

export interface CostMetric {
  model: string;
  dailyCost: number;
  monthlyCost: number;
  requests: number;
  color: string;
}

export interface AnalyticsSummary {
  totalFollowers: number;
  followersGrowth: number;
  totalEngagement: string;
  contentCreated: number;
  totalCostToday: number;
  totalCostMonth: number;
  platformMetrics: PlatformMetrics[];
  costByModel: CostMetric[];
  followerTrend: DailyMetric[];
  engagementTrend: DailyMetric[];
  contentTrend: DailyMetric[];
  costTrend: DailyMetric[];
}
