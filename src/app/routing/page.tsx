"use client";

import { useState, useEffect, useCallback } from "react";
import { OcBadge } from "@/components/shared";
import type { RoutingRule, LLMTrace, ModelUsageStats, ModelConfig } from "@/lib/routing/types";

type TabId = "routing" | "observatory" | "usage";

const TRACE_STATUS_STYLES: Record<string, { label: string; color: string; bg: string }> = {
  success: { label: "OK", color: "#059669", bg: "#ECFDF5" },
  error: { label: "Error", color: "#DC2626", bg: "#FEF2F2" },
  timeout: { label: "Timeout", color: "#D97706", bg: "#FFFBEB" },
  cached: { label: "Cached", color: "#2563EB", bg: "#EFF4FF" },
};

function formatLatency(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function timeAgo(ts: number): string {
  const mins = Math.floor((Date.now() - ts) / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function RoutingPage() {
  const [tab, setTab] = useState<TabId>("routing");
  const [rules, setRules] = useState<RoutingRule[]>([]);
  const [models, setModels] = useState<ModelConfig[]>([]);
  const [traces, setTraces] = useState<LLMTrace[]>([]);
  const [usage, setUsage] = useState<ModelUsageStats[]>([]);

  const fetchData = useCallback(async () => {
    try {
      const [rulesRes, tracesRes, usageRes] = await Promise.all([
        fetch("/api/routing"),
        fetch("/api/routing?view=traces"),
        fetch("/api/routing?view=usage"),
      ]);
      const rulesData = await rulesRes.json();
      const tracesData = await tracesRes.json();
      const usageData = await usageRes.json();

      setRules(rulesData.rules || []);
      setModels(rulesData.models || []);
      setTraces(tracesData.traces || []);
      setUsage(usageData.usage || []);
    } catch {
      console.error("[Routing] Fetch failed");
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleToggleRule = async (ruleId: string, enabled: boolean) => {
    try {
      await fetch(`/api/routing/${ruleId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: !enabled }),
      });
      await fetchData();
    } catch {
      console.error("[Routing] Toggle failed");
    }
  };

  const totalCost = usage.reduce((sum, u) => sum + u.totalCost, 0);
  const totalRequests = usage.reduce((sum, u) => sum + u.totalRequests, 0);

  const TABS: { id: TabId; label: string }[] = [
    { id: "routing", label: "Routing Table" },
    { id: "observatory", label: "LLM Observatory" },
    { id: "usage", label: "Usage Stats" },
  ];

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center gap-2.5">
        <span className="text-page-title text-oc-text">Model Routing & Observatory</span>
        <OcBadge label={`${models.filter((m) => m.available).length} models`} color="#7C3AED" bg="#F5F3FF" />
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Active Models", value: models.filter((m) => m.available).length, color: "text-oc-purple" },
          { label: "Total Requests", value: totalRequests, color: "text-oc-blue" },
          { label: "Total Cost", value: `$${totalCost.toFixed(3)}`, color: "text-oc-amber" },
          { label: "Routing Rules", value: rules.length, color: "text-oc-teal" },
        ].map((s) => (
          <div key={s.label} className="p-[14px_16px] bg-oc-card border border-oc-border rounded-oc">
            <div className="text-[9px] font-semibold text-oc-text-muted uppercase tracking-[0.05em] mb-1">
              {s.label}
            </div>
            <div className={`text-[22px] font-bold font-mono ${s.color}`}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-oc-border">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2.5 text-small font-semibold border-b-2 transition-colors cursor-pointer bg-transparent ${
              tab === t.id
                ? "text-oc-blue border-oc-blue"
                : "text-oc-text-muted border-transparent hover:text-oc-text-secondary"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === "routing" && (
        <div className="flex flex-col gap-2">
          {/* Model cards row */}
          <div className="grid grid-cols-6 gap-2 mb-3">
            {models.map((m) => (
              <div key={m.id} className="p-[10px_12px] bg-oc-card border border-oc-border rounded-oc-sm text-center">
                <div className={`w-2.5 h-2.5 rounded-full ${m.colorClass} mx-auto mb-1`} />
                <div className="text-tiny font-semibold text-oc-text truncate">{m.name}</div>
                <div className="text-[9px] text-oc-text-muted">{m.provider}</div>
                <div className="text-[9px] font-mono text-oc-text-secondary mt-0.5">{m.costPer}</div>
              </div>
            ))}
          </div>

          {/* Routing rules table */}
          <div className="bg-oc-card border border-oc-border rounded-[10px] overflow-hidden">
            <div className="grid grid-cols-[40px_1fr_1fr_1fr_80px] gap-3 p-[10px_14px] bg-oc-bg border-b border-oc-border text-[9px] font-semibold text-oc-text-muted uppercase tracking-[0.05em]">
              <span>#</span>
              <span>Task Type</span>
              <span>Assigned Model</span>
              <span>Description</span>
              <span className="text-right">Status</span>
            </div>
            {rules.map((rule) => {
              const model = models.find((m) => m.id === rule.assignedModel);
              return (
                <div
                  key={rule.id}
                  className={`grid grid-cols-[40px_1fr_1fr_1fr_80px] gap-3 p-[10px_14px] border-b border-oc-border-light items-center transition-opacity ${
                    rule.enabled ? "" : "opacity-50"
                  }`}
                >
                  <span className="text-tiny font-mono text-oc-text-muted">{rule.priority}</span>
                  <span className="text-small font-semibold text-oc-text">{rule.taskType}</span>
                  <div className="flex items-center gap-1.5">
                    {model && <div className={`w-2 h-2 rounded-full ${model.colorClass}`} />}
                    <span className="text-tiny font-semibold text-oc-text-secondary">
                      {model?.name || rule.assignedModel}
                    </span>
                  </div>
                  <span className="text-tiny text-oc-text-muted truncate">{rule.description}</span>
                  <div className="text-right">
                    <button
                      onClick={() => handleToggleRule(rule.id, rule.enabled)}
                      className={`text-[9px] font-bold px-2 py-0.5 rounded-full border-none cursor-pointer ${
                        rule.enabled
                          ? "bg-oc-green-light text-oc-green"
                          : "bg-oc-bg text-oc-text-muted"
                      }`}
                    >
                      {rule.enabled ? "Active" : "Off"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {tab === "observatory" && (
        <div className="flex flex-col gap-2">
          {traces.length === 0 ? (
            <div className="text-center py-8 text-tiny text-oc-text-muted">No traces recorded</div>
          ) : (
            traces.map((trace) => {
              const statusStyle = TRACE_STATUS_STYLES[trace.status] || TRACE_STATUS_STYLES.success;
              return (
                <div key={trace.id} className="p-[12px_14px] bg-oc-card border border-oc-border rounded-[10px]">
                  <div className="flex items-center gap-2.5">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-small font-semibold text-oc-text">{trace.taskType}</span>
                        <OcBadge label={statusStyle.label} color={statusStyle.color} bg={statusStyle.bg} />
                        <OcBadge label={trace.modelName} color="#7C3AED" bg="#F5F3FF" />
                      </div>
                      <div className="flex items-center gap-3 text-[9px]">
                        {trace.agentName && (
                          <span className="font-semibold text-oc-text-secondary">{trace.agentName}</span>
                        )}
                        {trace.contentId && (
                          <span className="font-mono text-oc-text-muted">{trace.contentId}</span>
                        )}
                        <span className="font-mono text-oc-text-muted">
                          {formatLatency(trace.latency)}
                        </span>
                        {(trace.inputTokens > 0 || trace.outputTokens > 0) && (
                          <span className="font-mono text-oc-text-muted">
                            {trace.inputTokens}→{trace.outputTokens} tok
                          </span>
                        )}
                        <span className="font-mono text-oc-text-secondary">
                          ${trace.cost.toFixed(4)}
                        </span>
                        <span className="text-oc-text-muted ml-auto">{timeAgo(trace.timestamp)}</span>
                      </div>
                      {trace.error && (
                        <div className="mt-1 text-tiny text-oc-red font-mono">{trace.error}</div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {tab === "usage" && (
        <div className="flex flex-col gap-3">
          {usage.length === 0 ? (
            <div className="text-center py-8 text-tiny text-oc-text-muted">No usage data</div>
          ) : (
            usage.map((u) => {
              const model = models.find((m) => m.id === u.modelId);
              return (
                <div key={u.modelId} className="p-[16px_18px] bg-oc-card border border-oc-border rounded-[10px]">
                  <div className="flex items-center gap-2.5 mb-3">
                    {model && <div className={`w-3 h-3 rounded-full ${model.colorClass}`} />}
                    <span className="text-small font-bold text-oc-text">{u.modelName}</span>
                    {u.errorRate > 0 && (
                      <OcBadge label={`${u.errorRate}% errors`} color="#DC2626" bg="#FEF2F2" />
                    )}
                  </div>
                  <div className="grid grid-cols-5 gap-3">
                    {[
                      { label: "Requests", value: u.totalRequests },
                      { label: "Tokens In", value: u.totalTokensIn.toLocaleString() },
                      { label: "Tokens Out", value: u.totalTokensOut.toLocaleString() },
                      { label: "Total Cost", value: `$${u.totalCost.toFixed(4)}` },
                      { label: "Avg Latency", value: formatLatency(u.avgLatency) },
                    ].map((stat) => (
                      <div key={stat.label}>
                        <div className="text-[9px] font-semibold text-oc-text-muted uppercase tracking-[0.05em] mb-0.5">
                          {stat.label}
                        </div>
                        <div className="text-small font-semibold font-mono text-oc-text">{stat.value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
