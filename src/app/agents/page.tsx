"use client";

import { useState, useEffect, useCallback } from "react";
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

/* ── Types ── */
interface Agent {
  id: string;
  name: string;
  type: string;
  status: string;
  currentTask: string | null;
  personality: string | null;
  config: { capabilities?: string[] } | null;
  lastHeartbeat: string | null;
  createdAt: string;
  tasksCompleted: number;
  tokensUsed: number;
  costToday: number;
  capabilities: string[];
}

type FilterStatus = "all" | "active" | "idle" | "offline" | "error";

/* ── Helpers ── */
function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
}

function timeSince(dateStr: string | null): string {
  if (!dateStr) return "Never";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const statusLabel: Record<string, string> = {
  active: "Active",
  idle: "Idle",
  offline: "Offline",
  error: "Error",
};

/* ── Agent Row Component ── */
function AgentRow({ agent }: { agent: Agent }) {
  const [expanded, setExpanded] = useState(false);

  const statusMap: Record<string, string> = {
    active: "connected",
    idle: "idle",
    error: "error",
    offline: "disconnected",
  };

  return (
    <div className="border-b border-oc-border-light last:border-b-0">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-4 py-3.5 px-4 hover:bg-oc-bg/50 transition-colors duration-hover text-left"
      >
        {/* Status + Name */}
        <div className="flex items-center gap-3 w-[200px] shrink-0">
          <StatusDot status={statusMap[agent.status] as "connected" | "idle" | "error" | "disconnected"} />
          <div>
            <div className="text-small font-semibold text-oc-text">{agent.name}</div>
            <div className="text-tiny text-oc-text-muted">{agent.type}</div>
          </div>
        </div>

        {/* Status Badge */}
        <div className="w-[80px] shrink-0">
          <OcBadge
            label={statusLabel[agent.status] || agent.status}
            color={
              agent.status === "active" ? "#059669"
                : agent.status === "idle" ? "#2563EB"
                : agent.status === "error" ? "#DC2626"
                : "#9C9590"
            }
            bg={
              agent.status === "active" ? "#ECFDF5"
                : agent.status === "idle" ? "#EFF4FF"
                : agent.status === "error" ? "#FEF2F2"
                : "#F0EDE6"
            }
          />
        </div>

        {/* Current Task */}
        <div className="flex-1 min-w-0">
          {agent.currentTask ? (
            <span className="text-small text-oc-text truncate block">{agent.currentTask}</span>
          ) : (
            <span className="text-small text-oc-text-muted italic">Idle</span>
          )}
        </div>

        {/* Tasks */}
        <div className="w-[60px] shrink-0 text-right hidden md:block">
          <span className="text-small font-mono text-oc-text">{agent.tasksCompleted}</span>
        </div>

        {/* Tokens */}
        <div className="w-[70px] shrink-0 text-right hidden md:block">
          <span className="text-small font-mono text-oc-text">{formatTokens(agent.tokensUsed)}</span>
        </div>

        {/* Cost */}
        <div className="w-[60px] shrink-0 text-right hidden lg:block">
          <span className="text-small font-mono text-oc-text">${agent.costToday.toFixed(2)}</span>
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
                Personality
              </div>
              <p className="text-small text-oc-text-secondary leading-relaxed">
                {agent.personality || "No personality configured"}
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
                <span className="text-oc-text-secondary">Last heartbeat:</span>
                <span className="font-mono text-oc-text">{timeSince(agent.lastHeartbeat)}</span>
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
  const [filter, setFilter] = useState<FilterStatus>("all");
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAgents = useCallback(async () => {
    try {
      const res = await fetch("/api/agents");
      const data = await res.json();
      setAgents(data);
    } catch {
      // keep existing data
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAgents();
    const interval = setInterval(fetchAgents, 10000);
    return () => clearInterval(interval);
  }, [fetchAgents]);

  const filtered = filter === "all" ? agents : agents.filter((a) => a.status === filter);

  const stats = {
    active: agents.filter((a) => a.status === "active").length,
    idle: agents.filter((a) => a.status === "idle").length,
    offline: agents.filter((a) => a.status === "offline").length,
    error: agents.filter((a) => a.status === "error").length,
    totalCost: agents.reduce((s, a) => s + (a.costToday || 0), 0),
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
          { label: "Active", value: stats.active, color: "text-oc-green", bg: "bg-oc-green-light", icon: <Activity className="w-4 h-4" /> },
          { label: "Idle", value: stats.idle, color: "text-oc-blue", bg: "bg-oc-blue-light", icon: <Zap className="w-4 h-4" /> },
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
                <div className="text-kpi-value text-oc-text leading-none">{stat.value}</div>
                <div className="text-tiny text-oc-text-muted mt-0.5">{stat.label}</div>
              </div>
            </div>
          </OcCard>
        ))}
      </div>

      {/* ── Filter Tabs ── */}
      <div className="flex items-center gap-1.5 mb-4">
        {(["all", "active", "idle", "offline", "error"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`text-tiny font-semibold uppercase tracking-[0.04em] px-3 py-1.5 rounded-oc-pill transition-colors duration-hover ${
              filter === f
                ? "bg-oc-text text-white"
                : "bg-oc-bg text-oc-text-secondary hover:bg-oc-border-light"
            }`}
          >
            {f === "all" ? `All (${agents.length})` : `${f} (${agents.filter((a) => a.status === f).length})`}
          </button>
        ))}
        <div className="flex-1" />
        <button
          onClick={fetchAgents}
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
          <div className="w-[60px] shrink-0 text-right hidden md:block">Tasks</div>
          <div className="w-[70px] shrink-0 text-right hidden md:block">Tokens</div>
          <div className="w-[60px] shrink-0 text-right hidden lg:block">Cost</div>
          <div className="w-[24px] shrink-0" />
        </div>

        {/* Loading */}
        {loading && (
          <div className="text-center py-12 text-small text-oc-text-muted">Loading agents...</div>
        )}

        {/* Rows */}
        {!loading && filtered.map((agent) => (
          <AgentRow key={agent.id} agent={agent} />
        ))}

        {!loading && filtered.length === 0 && (
          <div className="text-center py-12 text-small text-oc-text-muted">
            No agents match the selected filter.
          </div>
        )}
      </OcCard>
    </>
  );
}
