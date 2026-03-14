/* ── OpenClaw Model Routing & Observatory Types ── */

export type ModelId = "claude-sonnet" | "nano-banana" | "veo-3.1" | "kling-lipsync" | "edge-tts" | "ffmpeg";

export interface ModelConfig {
  id: ModelId;
  name: string;
  provider: string;
  type: "language" | "image" | "video" | "lipsync" | "audio" | "assembly";
  /** Cost per 1K tokens or per request */
  costPer: string;
  /** Whether this model is available */
  available: boolean;
  colorClass: string;
  bgClass: string;
}

export interface RoutingRule {
  id: string;
  taskType: string;
  assignedModel: ModelId;
  fallbackModel?: ModelId;
  priority: number;
  enabled: boolean;
  description: string;
}

/* ── LLM Observatory ── */

export type TraceStatus = "success" | "error" | "timeout" | "cached";

export interface LLMTrace {
  id: string;
  model: ModelId;
  modelName: string;
  /** Which agent triggered this */
  agentId?: string;
  agentName?: string;
  /** What was requested */
  taskType: string;
  /** Input/output tokens */
  inputTokens: number;
  outputTokens: number;
  /** Cost in USD */
  cost: number;
  /** Latency in ms */
  latency: number;
  status: TraceStatus;
  /** Error message if failed */
  error?: string;
  /** Content ID if linked */
  contentId?: string;
  timestamp: number;
}

export interface ModelUsageStats {
  modelId: ModelId;
  modelName: string;
  totalRequests: number;
  totalTokensIn: number;
  totalTokensOut: number;
  totalCost: number;
  avgLatency: number;
  errorRate: number;
}

/* ── Browser Sessions ── */

export type SessionStatus = "active" | "idle" | "disconnected" | "error";

export interface BrowserSession {
  id: string;
  platform: string;
  tabTitle: string;
  url: string;
  status: SessionStatus;
  /** Current automation action */
  currentAction?: string;
  /** Whether authenticated on this platform */
  authenticated: boolean;
  lastActivityAt: number;
  createdAt: number;
}
