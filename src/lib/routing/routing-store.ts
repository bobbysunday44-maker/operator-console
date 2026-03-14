/* ── OpenClaw Routing & Observatory Store ──
 * In-memory store for model routing, LLM traces, and browser sessions.
 */

import type {
  ModelConfig, ModelId, RoutingRule, LLMTrace,
  ModelUsageStats, BrowserSession,
} from "./types";

/* ── Model Configs (v3.1 stack) ── */
export const MODEL_CONFIGS: ModelConfig[] = [
  { id: "claude-sonnet", name: "Claude Sonnet 4.6", provider: "Anthropic", type: "language", costPer: "$3/1M tok", available: true, colorClass: "bg-oc-purple", bgClass: "bg-oc-purple-light" },
  { id: "nano-banana", name: "Gemini Nano Banana 2", provider: "Google", type: "image", costPer: "$0.002/img", available: true, colorClass: "bg-oc-blue", bgClass: "bg-oc-blue-light" },
  { id: "veo-3.1", name: "Gemini Veo 3.1", provider: "Google", type: "video", costPer: "$0.05/clip", available: true, colorClass: "bg-oc-teal", bgClass: "bg-oc-teal-light" },
  { id: "kling-lipsync", name: "Kling Lip Sync", provider: "Kling AI", type: "lipsync", costPer: "$0.03/clip", available: true, colorClass: "bg-oc-pink", bgClass: "bg-oc-pink-light" },
  { id: "edge-tts", name: "edge-tts", provider: "Microsoft", type: "audio", costPer: "Free", available: true, colorClass: "bg-oc-amber", bgClass: "bg-oc-amber-light" },
  { id: "ffmpeg", name: "FFmpeg", provider: "Local", type: "assembly", costPer: "Free", available: true, colorClass: "bg-oc-green", bgClass: "bg-oc-green-light" },
];

class RoutingStore {
  private rules = new Map<string, RoutingRule>();
  private traces: LLMTrace[] = [];
  private sessions = new Map<string, BrowserSession>();
  private counter = 0;

  private nextId(prefix: string): string {
    this.counter++;
    return `${prefix}-${this.counter}`;
  }

  /* ── Routing Rules ── */

  listRules(): RoutingRule[] {
    return Array.from(this.rules.values()).sort((a, b) => a.priority - b.priority);
  }

  getRule(id: string): RoutingRule | null {
    return this.rules.get(id) || null;
  }

  updateRule(id: string, updates: Partial<Pick<RoutingRule, "assignedModel" | "fallbackModel" | "enabled">>): RoutingRule | null {
    const rule = this.rules.get(id);
    if (!rule) return null;
    Object.assign(rule, updates);
    return rule;
  }

  /* ── LLM Traces ── */

  addTrace(trace: Omit<LLMTrace, "id" | "timestamp">): LLMTrace {
    const full: LLMTrace = {
      ...trace,
      id: this.nextId("trace"),
      timestamp: Date.now(),
    };
    this.traces.push(full);
    if (this.traces.length > 200) this.traces.shift();
    return full;
  }

  listTraces(limit = 50): LLMTrace[] {
    return this.traces.slice(-limit).reverse();
  }

  getUsageStats(): ModelUsageStats[] {
    const byModel = new Map<ModelId, LLMTrace[]>();
    for (const t of this.traces) {
      const arr = byModel.get(t.model) || [];
      arr.push(t);
      byModel.set(t.model, arr);
    }

    return Array.from(byModel.entries()).map(([modelId, traces]) => {
      const cfg = MODEL_CONFIGS.find((m) => m.id === modelId);
      const errors = traces.filter((t) => t.status === "error").length;
      const totalLatency = traces.reduce((sum, t) => sum + t.latency, 0);
      return {
        modelId,
        modelName: cfg?.name || modelId,
        totalRequests: traces.length,
        totalTokensIn: traces.reduce((sum, t) => sum + t.inputTokens, 0),
        totalTokensOut: traces.reduce((sum, t) => sum + t.outputTokens, 0),
        totalCost: traces.reduce((sum, t) => sum + t.cost, 0),
        avgLatency: traces.length > 0 ? Math.round(totalLatency / traces.length) : 0,
        errorRate: traces.length > 0 ? Math.round((errors / traces.length) * 100) : 0,
      };
    }).sort((a, b) => b.totalRequests - a.totalRequests);
  }

  /* ── Browser Sessions ── */

  listSessions(): BrowserSession[] {
    return Array.from(this.sessions.values()).sort((a, b) => b.lastActivityAt - a.lastActivityAt);
  }

  getSession(id: string): BrowserSession | null {
    return this.sessions.get(id) || null;
  }
}

/* ── Singleton ── */
const globalForRouting = globalThis as unknown as { routingStore: RoutingStore };
export const routingStore = globalForRouting.routingStore || new RoutingStore();
if (process.env.NODE_ENV !== "production") {
  globalForRouting.routingStore = routingStore;
}

/* ── Seed data ── */
function seedIfEmpty() {
  if (routingStore.listRules().length > 0) return;

  // Routing rules
  const rules: Omit<RoutingRule, "id">[] = [
    { taskType: "Script Writing", assignedModel: "claude-sonnet", priority: 1, enabled: true, description: "Hooks, scripts, captions, hashtags" },
    { taskType: "Trend Analysis", assignedModel: "claude-sonnet", priority: 2, enabled: true, description: "Platform trend scanning and topic extraction" },
    { taskType: "Sentiment Analysis", assignedModel: "claude-sonnet", priority: 3, enabled: true, description: "Mention sentiment classification + auto-replies" },
    { taskType: "Image Generation", assignedModel: "nano-banana", priority: 4, enabled: true, description: "Scene images, thumbnails, character refs" },
    { taskType: "Video Generation", assignedModel: "veo-3.1", priority: 5, enabled: true, description: "Video clips from text/image prompts" },
    { taskType: "Lip Sync", assignedModel: "kling-lipsync", priority: 6, enabled: true, description: "Character mouth sync on video + audio" },
    { taskType: "Voiceover", assignedModel: "edge-tts", priority: 7, enabled: true, description: "Text-to-speech narration" },
    { taskType: "Final Assembly", assignedModel: "ffmpeg", priority: 8, enabled: true, description: "Video + audio + overlay assembly" },
    { taskType: "Quality Review", assignedModel: "claude-sonnet", priority: 9, enabled: true, description: "Content scoring and approval" },
    { taskType: "Scheduling", assignedModel: "claude-sonnet", priority: 10, enabled: true, description: "Optimal posting time selection" },
  ];

  for (const r of rules) {
    // Access private map through the class — use type assertion for seeding
    (routingStore as unknown as { rules: Map<string, RoutingRule> }).rules.set(
      `rule-${r.priority}`,
      { ...r, id: `rule-${r.priority}` }
    );
  }

  // LLM traces
  const now = Date.now();
  const traceData: Omit<LLMTrace, "id" | "timestamp">[] = [
    { model: "claude-sonnet", modelName: "Claude Sonnet 4.6", agentName: "Writer", taskType: "Script Writing", inputTokens: 124, outputTokens: 287, cost: 0.003, latency: 2100, status: "success", contentId: "CNT-0047" },
    { model: "nano-banana", modelName: "Nano Banana 2", agentName: "Designer", taskType: "Image Generation", inputTokens: 0, outputTokens: 0, cost: 0.002, latency: 4800, status: "success", contentId: "CNT-0047" },
    { model: "veo-3.1", modelName: "Veo 3.1", agentName: "Filmmaker", taskType: "Video Generation", inputTokens: 0, outputTokens: 0, cost: 0.05, latency: 45000, status: "success", contentId: "CNT-0047" },
    { model: "claude-sonnet", modelName: "Claude Sonnet 4.6", agentName: "Scanner", taskType: "Sentiment Analysis", inputTokens: 340, outputTokens: 52, cost: 0.002, latency: 1200, status: "success" },
    { model: "claude-sonnet", modelName: "Claude Sonnet 4.6", agentName: "Engage Bot", taskType: "Sentiment Analysis", inputTokens: 280, outputTokens: 95, cost: 0.002, latency: 1800, status: "success" },
    { model: "edge-tts", modelName: "edge-tts", agentName: "System", taskType: "Voiceover", inputTokens: 0, outputTokens: 0, cost: 0, latency: 3200, status: "success", contentId: "CNT-0046" },
    { model: "claude-sonnet", modelName: "Claude Sonnet 4.6", agentName: "Ideator", taskType: "Trend Analysis", inputTokens: 520, outputTokens: 430, cost: 0.005, latency: 3400, status: "success" },
    { model: "claude-sonnet", modelName: "Claude Sonnet 4.6", agentName: "Editor", taskType: "Quality Review", inputTokens: 890, outputTokens: 120, cost: 0.004, latency: 2800, status: "success", contentId: "CNT-0046" },
    { model: "nano-banana", modelName: "Nano Banana 2", agentName: "Designer", taskType: "Image Generation", inputTokens: 0, outputTokens: 0, cost: 0.002, latency: 5200, status: "error", error: "Rate limit exceeded" },
    { model: "claude-sonnet", modelName: "Claude Sonnet 4.6", agentName: "Writer", taskType: "Script Writing", inputTokens: 98, outputTokens: 210, cost: 0.002, latency: 1900, status: "cached", contentId: "CNT-0048" },
  ];

  for (let i = 0; i < traceData.length; i++) {
    const trace: LLMTrace = {
      ...traceData[i],
      id: `trace-${i + 1}`,
      timestamp: now - (traceData.length - i) * 300000,
    };
    (routingStore as unknown as { traces: LLMTrace[] }).traces.push(trace);
  }

  // Browser sessions
  const sessionData: BrowserSession[] = [
    { id: "sess-1", platform: "Twitter/X", tabTitle: "@openclaw_ai — Home", url: "https://x.com/openclaw_ai", status: "active", currentAction: "Monitoring timeline", authenticated: true, lastActivityAt: now - 30000, createdAt: now - 3600000 },
    { id: "sess-2", platform: "Instagram", tabTitle: "openclaw.ai — Profile", url: "https://instagram.com/openclaw.ai", status: "idle", authenticated: true, lastActivityAt: now - 600000, createdAt: now - 7200000 },
    { id: "sess-3", platform: "TikTok", tabTitle: "TikTok — Upload", url: "https://tiktok.com/upload", status: "active", currentAction: "Uploading CNT-0047 video", authenticated: true, lastActivityAt: now - 10000, createdAt: now - 1800000 },
    { id: "sess-4", platform: "LinkedIn", tabTitle: "LinkedIn — Login", url: "https://linkedin.com/login", status: "disconnected", authenticated: false, lastActivityAt: now - 86400000, createdAt: now - 86400000 },
  ];

  for (const s of sessionData) {
    (routingStore as unknown as { sessions: Map<string, BrowserSession> }).sessions.set(s.id, s);
  }
}

seedIfEmpty();
