"use client";

import { useState } from "react";
import { SectionHeader } from "@/components/shared/section-header";
import { OcCard, StatusDot, OcBadge } from "@/components/shared";
import {
  Bot,
  Zap,
  Clock,
  Hash,
  ChevronDown,
  ChevronUp,
  Activity,
  Cpu,
  DollarSign,
  RefreshCw,
} from "lucide-react";
import type { Agent, AgentStatus } from "@/lib/agents/agent-data";

/* ── Mock data (same as seed, imported statically for SSG) ── */
const now = Date.now();

const AGENTS: Agent[] = [
  {
    id: "agent-ideator",
    name: "Ideator",
    role: "Content Strategist",
    description: "Scans trends, generates content ideas, and builds content calendars.",
    model: "Claude Sonnet 4.6",
    status: "online",
    currentTask: "Scanning TikTok trends",
    tasksCompleted: 147,
    tokensUsed: 2_840_000,
    costToday: 1.42,
    uptime: 86400,
    lastHeartbeat: now,
    capabilities: ["trend-scanning", "idea-generation", "content-calendar", "audience-analysis"],
  },
  {
    id: "agent-writer",
    name: "Writer",
    role: "Script & Copy Writer",
    description: "Writes video scripts, social media captions, blog posts, and all text content.",
    model: "Claude Sonnet 4.6",
    status: "busy",
    currentTask: "Writing TikTok script #CNT-0048",
    tasksCompleted: 312,
    tokensUsed: 5_120_000,
    costToday: 2.56,
    uptime: 86400,
    lastHeartbeat: now,
    capabilities: ["script-writing", "caption-generation", "blog-posts", "tone-adaptation"],
  },
  {
    id: "agent-designer",
    name: "Designer",
    role: "Image Generator",
    description: "Generates images via Gemini Nano Banana 2 with character consistency.",
    model: "Gemini Nano Banana 2",
    status: "online",
    currentTask: null,
    tasksCompleted: 89,
    tokensUsed: 1_200_000,
    costToday: 0.84,
    uptime: 72000,
    lastHeartbeat: now,
    capabilities: ["image-generation", "character-consistency", "scene-composition", "thumbnails"],
  },
  {
    id: "agent-filmmaker",
    name: "Filmmaker",
    role: "Video Producer",
    description: "Generates video clips via Gemini Veo 3.1 using first/last frame guidance.",
    model: "Gemini Veo 3.1",
    status: "online",
    currentTask: null,
    tasksCompleted: 34,
    tokensUsed: 800_000,
    costToday: 1.20,
    uptime: 72000,
    lastHeartbeat: now,
    capabilities: ["video-generation", "frame-guidance", "character-refs", "vertical-video"],
  },
  {
    id: "agent-editor",
    name: "Editor",
    role: "Quality & Assembly",
    description: "Reviews content quality, triggers voiceover, runs FFmpeg assembly.",
    model: "Claude Sonnet 4.6",
    status: "offline",
    currentTask: null,
    tasksCompleted: 28,
    tokensUsed: 640_000,
    costToday: 0.32,
    uptime: 0,
    lastHeartbeat: now - 120_000,
    capabilities: ["quality-review", "voiceover", "video-assembly", "quality-gate"],
  },
  {
    id: "agent-social-bot",
    name: "Social Bot",
    role: "Post Publisher",
    description: "Publishes content via Chrome automation. Handles scheduling and rate limiting.",
    model: "Claude Sonnet 4.6",
    status: "online",
    currentTask: "Posting to Instagram @digitalcreator",
    tasksCompleted: 256,
    tokensUsed: 980_000,
    costToday: 0.49,
    uptime: 86400,
    lastHeartbeat: now,
    capabilities: ["chrome-posting", "scheduling", "rate-limiting", "multi-platform"],
  },
  {
    id: "agent-engage-bot",
    name: "Engage Bot",
    role: "Community Manager",
    description: "Monitors mentions, responds to comments, manages conversations.",
    model: "Claude Sonnet 4.6",
    status: "busy",
    currentTask: "Replying to 3 Twitter mentions",
    tasksCompleted: 891,
    tokensUsed: 3_400_000,
    costToday: 1.70,
    uptime: 86400,
    lastHeartbeat: now,
    capabilities: ["mention-monitoring", "auto-reply", "conversation-management", "sentiment-analysis"],
  },
  {
    id: "agent-scanner",
    name: "Scanner",
    role: "Trend & Competitor Analyst",
    description: "Continuous monitoring of trends, competitor activity, and viral content.",
    model: "Claude Sonnet 4.6",
    status: "online",
    currentTask: "Monitoring trending hashtags",
    tasksCompleted: 1_204,
    tokensUsed: 4_100_000,
    costToday: 2.05,
    uptime: 86400,
    lastHeartbeat: now,
    capabilities: ["trend-monitoring", "competitor-analysis", "viral-detection", "hashtag-tracking"],
  },
];

/* ── Helpers ── */
function formatUptime(seconds: number): string {
  if (seconds === 0) return "Offline";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h >= 24) return `${Math.floor(h / 24)}d ${h % 24}h`;
  return `${h}h ${m}m`;
}

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
}

const statusLabel: Record<AgentStatus, string> = {
  online: "Online",
  busy: "Busy",
  offline: "Offline",
  error: "Error",
};

/* ── Agent Row Component ── */
function AgentRow({ agent }: { agent: Agent }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border-b border-oc-border-light last:border-b-0">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-4 py-3.5 px-4 hover:bg-oc-bg/50 transition-colors duration-hover text-left"
      >
        {/* Status + Name */}
        <div className="flex items-center gap-3 w-[200px] shrink-0">
          <StatusDot status={agent.status === "busy" ? "active" : agent.status === "online" ? "connected" : agent.status === "error" ? "error" : "idle"} />
          <div>
            <div className="text-small font-semibold text-oc-text">{agent.name}</div>
            <div className="text-tiny text-oc-text-muted">{agent.role}</div>
          </div>
        </div>

        {/* Status Badge */}
        <div className="w-[80px] shrink-0">
          <OcBadge
            label={statusLabel[agent.status]}
            color={
              agent.status === "online"
                ? "#059669"
                : agent.status === "busy"
                ? "#2563EB"
                : agent.status === "error"
                ? "#DC2626"
                : "#9C9590"
            }
            bg={
              agent.status === "online"
                ? "#ECFDF5"
                : agent.status === "busy"
                ? "#EFF4FF"
                : agent.status === "error"
                ? "#FEF2F2"
                : "#F0EDE6"
            }
          />
        </div>

        {/* Current Task */}
        <div className="flex-1 min-w-0">
          {agent.currentTask ? (
            <span className="text-small text-oc-text truncate block">
              {agent.currentTask}
            </span>
          ) : (
            <span className="text-small text-oc-text-muted italic">Idle</span>
          )}
        </div>

        {/* Model */}
        <div className="w-[150px] shrink-0 hidden lg:block">
          <span className="text-tiny font-mono text-oc-text-secondary">
            {agent.model}
          </span>
        </div>

        {/* Tasks */}
        <div className="w-[60px] shrink-0 text-right hidden md:block">
          <span className="text-small font-mono text-oc-text">
            {agent.tasksCompleted}
          </span>
        </div>

        {/* Tokens */}
        <div className="w-[70px] shrink-0 text-right hidden md:block">
          <span className="text-small font-mono text-oc-text">
            {formatTokens(agent.tokensUsed)}
          </span>
        </div>

        {/* Cost */}
        <div className="w-[60px] shrink-0 text-right hidden lg:block">
          <span className="text-small font-mono text-oc-text">
            ${agent.costToday.toFixed(2)}
          </span>
        </div>

        {/* Expand */}
        <div className="w-[24px] shrink-0 text-oc-text-muted">
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {/* Expanded Detail */}
      {expanded && (
        <div className="px-4 pb-4 pt-1 bg-oc-bg/30">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Description */}
            <div className="md:col-span-2">
              <div className="text-tiny font-semibold text-oc-text-secondary uppercase tracking-[0.06em] mb-1.5">
                Description
              </div>
              <p className="text-small text-oc-text-secondary leading-relaxed">
                {agent.description}
              </p>
              <div className="flex flex-wrap gap-1.5 mt-3">
                {agent.capabilities.map((cap) => (
                  <span
                    key={cap}
                    className="text-tiny font-mono px-2 py-0.5 rounded-oc-pill bg-oc-blue-light text-oc-blue"
                  >
                    {cap}
                  </span>
                ))}
              </div>
            </div>

            {/* Metrics */}
            <div className="space-y-2">
              <div className="text-tiny font-semibold text-oc-text-secondary uppercase tracking-[0.06em] mb-1.5">
                Metrics
              </div>
              <div className="flex items-center gap-2 text-small">
                <Clock className="w-3.5 h-3.5 text-oc-text-muted" />
                <span className="text-oc-text-secondary">Uptime:</span>
                <span className="font-mono text-oc-text">{formatUptime(agent.uptime)}</span>
              </div>
              <div className="flex items-center gap-2 text-small">
                <Hash className="w-3.5 h-3.5 text-oc-text-muted" />
                <span className="text-oc-text-secondary">Tasks:</span>
                <span className="font-mono text-oc-text">{agent.tasksCompleted.toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-2 text-small">
                <Cpu className="w-3.5 h-3.5 text-oc-text-muted" />
                <span className="text-oc-text-secondary">Tokens:</span>
                <span className="font-mono text-oc-text">{formatTokens(agent.tokensUsed)}</span>
              </div>
              <div className="flex items-center gap-2 text-small">
                <DollarSign className="w-3.5 h-3.5 text-oc-text-muted" />
                <span className="text-oc-text-secondary">Cost today:</span>
                <span className="font-mono text-oc-text">${agent.costToday.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Agent Fleet Page ── */
export default function AgentsPage() {
  const [filter, setFilter] = useState<"all" | AgentStatus>("all");

  const filtered =
    filter === "all" ? AGENTS : AGENTS.filter((a) => a.status === filter);

  const stats = {
    online: AGENTS.filter((a) => a.status === "online").length,
    busy: AGENTS.filter((a) => a.status === "busy").length,
    offline: AGENTS.filter((a) => a.status === "offline").length,
    error: AGENTS.filter((a) => a.status === "error").length,
    totalCost: AGENTS.reduce((s, a) => s + a.costToday, 0),
  };

  return (
    <>
      <SectionHeader
        title="Agent Fleet"
        subtitle="Real-time agent status, workload, and lifecycle management"
      />

      {/* ── Stats Row ── */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-5">
        {[
          { label: "Online", value: stats.online, color: "text-oc-green", bg: "bg-oc-green-light", icon: <Activity className="w-4 h-4" /> },
          { label: "Busy", value: stats.busy, color: "text-oc-blue", bg: "bg-oc-blue-light", icon: <Zap className="w-4 h-4" /> },
          { label: "Offline", value: stats.offline, color: "text-oc-text-muted", bg: "bg-oc-bg", icon: <Clock className="w-4 h-4" /> },
          { label: "Errors", value: stats.error, color: "text-oc-red", bg: "bg-oc-red-light", icon: <Bot className="w-4 h-4" /> },
          { label: "Cost Today", value: `$${stats.totalCost.toFixed(2)}`, color: "text-oc-amber", bg: "bg-oc-amber-light", icon: <DollarSign className="w-4 h-4" /> },
        ].map((stat) => (
          <OcCard key={stat.label} className="!p-3.5">
            <div className="flex items-center gap-2.5">
              <div className={`flex items-center justify-center w-8 h-8 rounded-oc-sm ${stat.bg} ${stat.color}`}>
                {stat.icon}
              </div>
              <div>
                <div className="text-kpi-value text-oc-text leading-none">
                  {stat.value}
                </div>
                <div className="text-tiny text-oc-text-muted mt-0.5">
                  {stat.label}
                </div>
              </div>
            </div>
          </OcCard>
        ))}
      </div>

      {/* ── Filter Tabs ── */}
      <div className="flex items-center gap-1.5 mb-4">
        {(["all", "online", "busy", "offline", "error"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`text-tiny font-semibold uppercase tracking-[0.04em] px-3 py-1.5 rounded-oc-pill transition-colors duration-hover ${
              filter === f
                ? "bg-oc-text text-white"
                : "bg-oc-bg text-oc-text-secondary hover:bg-oc-border-light"
            }`}
          >
            {f === "all" ? `All (${AGENTS.length})` : `${f} (${AGENTS.filter((a) => a.status === f).length})`}
          </button>
        ))}
        <div className="flex-1" />
        <button
          onClick={() => setFilter("all")}
          className="flex items-center gap-1.5 text-tiny font-semibold text-oc-blue hover:text-oc-blue/80 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </button>
      </div>

      {/* ── Agent Table ── */}
      <OcCard className="!p-0 overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-4 py-2.5 px-4 bg-oc-bg/60 border-b border-oc-border text-tiny font-semibold text-oc-text-muted uppercase tracking-[0.06em]">
          <div className="w-[200px] shrink-0">Agent</div>
          <div className="w-[80px] shrink-0">Status</div>
          <div className="flex-1">Current Task</div>
          <div className="w-[150px] shrink-0 hidden lg:block">Model</div>
          <div className="w-[60px] shrink-0 text-right hidden md:block">Tasks</div>
          <div className="w-[70px] shrink-0 text-right hidden md:block">Tokens</div>
          <div className="w-[60px] shrink-0 text-right hidden lg:block">Cost</div>
          <div className="w-[24px] shrink-0" />
        </div>

        {/* Rows */}
        {filtered.map((agent) => (
          <AgentRow key={agent.id} agent={agent} />
        ))}

        {filtered.length === 0 && (
          <div className="text-center py-12 text-small text-oc-text-muted">
            No agents match the selected filter.
          </div>
        )}
      </OcCard>
    </>
  );
}
