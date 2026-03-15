"use client";

import { useState, useEffect, useCallback } from "react";
import { OcBadge } from "@/components/shared";
import type { ModelRoute, ObsTrace, ModelUsageStats } from "@/lib/routing/types";

type TabId = "routing" | "observatory" | "usage";

function formatLatency(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function timeAgo(ts: string): string {
  const mins = Math.floor((Date.now() - new Date(ts).getTime()) / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function RoutingPage() {
  const [tab, setTab] = useState<TabId>("routing");
  const [rules, setRules] = useState<ModelRoute[]>([]);
  const [traces, setTraces] = useState<ObsTrace[]>([]);
  const [usage, setUsage] = useState<ModelUsageStats[]>([]);

  const fetchData = useCallback(async () => {
    try {
      const [rulesRes, tracesRes, usageRes] = await Promise.all([
        fetch("/api/routing"),
        fetch("/api/routing?view=traces"),
        fetch("/api/routing?view=usage"),
      ]);
      setRules((await rulesRes.json()).rules || []);
      setTraces((await tracesRes.json()).traces || []);
      setUsage((await usageRes.json()).usage || []);
    } catch {
      console.error("[Routing] Fetch failed");
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

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
  const totalRequests = usage.reduce((sum, u) => sum + u.requests, 0);

  const TABS: { id: TabId; label: string }[] = [
    { id: "routing", label: "Routing Table" },
    { id: "observatory", label: "LLM Observatory" },
    { id: "usage", label: "Usage Stats" },
  ];

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-2.5">
        <span className="text-page-title text-oc-text">Model Routing & Observatory</span>
        <OcBadge label={`${rules.filter((r) => r.enabled).length} active`} color="#7C3AED" bg="#F5F3FF" />
      </div>

      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Active Rules", value: rules.filter((r) => r.enabled).length, color: "text-oc-purple" },
          { label: "Total Requests", value: totalRequests, color: "text-oc-blue" },
          { label: "Total Cost", value: `$${totalCost.toFixed(3)}`, color: "text-oc-amber" },
          { label: "Total Rules", value: rules.length, color: "text-oc-teal" },
        ].map((s) => (
          <div key={s.label} className="p-[14px_16px] bg-oc-card border border-oc-border rounded-oc">
            <div className="text-[9px] font-semibold text-oc-text-muted uppercase tracking-[0.05em] mb-1">{s.label}</div>
            <div className={`text-[22px] font-bold font-mono ${s.color}`}>{s.value}</div>
          </div>
        ))}
      </div>

      <div className="flex gap-1 border-b border-oc-border">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-2.5 text-small font-semibold border-b-2 transition-colors cursor-pointer bg-transparent ${
              tab === t.id ? "text-oc-blue border-oc-blue" : "text-oc-text-muted border-transparent hover:text-oc-text-secondary"
            }`}>{t.label}</button>
        ))}
      </div>

      {tab === "routing" && (
        <div className="bg-oc-card border border-oc-border rounded-[10px] overflow-hidden">
          <div className="grid grid-cols-[40px_1fr_1fr_80px] gap-3 p-[10px_14px] bg-oc-bg border-b border-oc-border text-[9px] font-semibold text-oc-text-muted uppercase tracking-[0.05em]">
            <span>#</span><span>Task Type</span><span>Model</span><span className="text-right">Status</span>
          </div>
          {rules.map((rule) => (
            <div key={rule.id} className={`grid grid-cols-[40px_1fr_1fr_80px] gap-3 p-[10px_14px] border-b border-oc-border-light items-center transition-opacity ${rule.enabled ? "" : "opacity-50"}`}>
              <span className="text-tiny font-mono text-oc-text-muted">{rule.priority}</span>
              <span className="text-small font-semibold text-oc-text">{rule.taskType}</span>
              <OcBadge label={rule.modelName} color="#7C3AED" bg="#F5F3FF" />
              <div className="text-right">
                <button onClick={() => handleToggleRule(rule.id, rule.enabled)}
                  className={`text-[9px] font-bold px-2 py-0.5 rounded-full border-none cursor-pointer ${
                    rule.enabled ? "bg-oc-green-light text-oc-green" : "bg-oc-bg text-oc-text-muted"
                  }`}>{rule.enabled ? "Active" : "Off"}</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "observatory" && (
        <div className="flex flex-col gap-2">
          {traces.length === 0 ? (
            <div className="text-center py-8 text-tiny text-oc-text-muted">No traces recorded</div>
          ) : traces.map((trace) => (
            <div key={trace.id} className="p-[12px_14px] bg-oc-card border border-oc-border rounded-[10px]">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-small font-semibold text-oc-text">{trace.name}</span>
                {trace.model && <OcBadge label={trace.model} color="#7C3AED" bg="#F5F3FF" />}
              </div>
              <div className="flex items-center gap-3 text-[9px]">
                {trace.totalMs != null && <span className="font-mono text-oc-text-muted">{formatLatency(trace.totalMs)}</span>}
                {trace.totalCost != null && <span className="font-mono text-oc-text-secondary">${trace.totalCost.toFixed(4)}</span>}
                <span className="font-mono text-oc-text-muted">{trace.spans.length} spans</span>
                <span className="text-oc-text-muted ml-auto">{timeAgo(trace.createdAt)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "usage" && (
        <div className="flex flex-col gap-3">
          {usage.length === 0 ? (
            <div className="text-center py-8 text-tiny text-oc-text-muted">No usage data</div>
          ) : usage.map((u) => (
            <div key={u.model} className="p-[16px_18px] bg-oc-card border border-oc-border rounded-[10px]">
              <div className="flex items-center gap-2.5 mb-3">
                <span className="text-small font-bold text-oc-text">{u.model}</span>
              </div>
              <div className="grid grid-cols-5 gap-3">
                {[
                  { label: "Requests", value: u.requests },
                  { label: "Tokens In", value: u.tokensIn.toLocaleString() },
                  { label: "Tokens Out", value: u.tokensOut.toLocaleString() },
                  { label: "Total Cost", value: `$${u.totalCost.toFixed(4)}` },
                  { label: "Avg Latency", value: formatLatency(u.avgLatencyMs) },
                ].map((stat) => (
                  <div key={stat.label}>
                    <div className="text-[9px] font-semibold text-oc-text-muted uppercase tracking-[0.05em] mb-0.5">{stat.label}</div>
                    <div className="text-small font-semibold font-mono text-oc-text">{stat.value}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
