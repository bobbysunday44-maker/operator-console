/* ── OpenClaw Analytics Types (matches Prisma API responses) ── */

export interface AnalyticsSummary {
  overview: {
    totalContent: number;
    contentToday: number;
    totalPosts: number;
    postsToday: number;
    totalTasks: number;
    tasksCompleted: number;
    completionRate: number;
  };
  usage: {
    totalRequests: number;
    totalTokens: number;
    totalCost: number;
  };
  platformBreakdown: { platform: string; posts: number }[];
  snapshots: { id: string; metricType: string; platform: string | null; value: number; capturedAt: string }[];
}
