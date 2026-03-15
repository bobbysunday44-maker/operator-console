/* ── OpenClaw Model Routing & Observatory Types (matches Prisma API responses) ── */

export interface ModelRoute {
  id: string;
  taskType: string;
  modelName: string;
  priority: number;
  enabled: boolean;
  config: Record<string, unknown> | null;
  createdAt: string;
}

export interface ObsSpan {
  id: string;
  name: string;
  type: string;
  model: string | null;
  input: string | null;
  output: string | null;
  tokensIn: number | null;
  tokensOut: number | null;
  cost: number | null;
  duration: number | null;
  error: string | null;
  startedAt: string;
  endedAt: string | null;
}

export interface ObsTrace {
  id: string;
  name: string;
  model: string | null;
  totalCost: number | null;
  totalMs: number | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  spans: ObsSpan[];
}

export interface ModelUsageStats {
  model: string;
  requests: number;
  tokensIn: number;
  tokensOut: number;
  totalCost: number;
  avgLatencyMs: number;
}

export interface BrowserSession {
  id: string;
  site: string;
  tabId: string | null;
  action: string;
  status: string;
  screenshot: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}
