"use client";

import { useState, useEffect, useCallback } from "react";
import { OcBadge } from "@/components/shared";
import type { AnalyticsSummary } from "@/lib/analytics/types";

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsSummary | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/analytics");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setData(await res.json());
    } catch {
      console.error("[Analytics] Fetch failed");
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (!data) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <span className="text-small text-oc-text-muted">Loading analytics...</span>
      </div>
    );
  }

  const { overview, usage, platformBreakdown } = data;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-2.5">
        <span className="text-page-title text-oc-text">Analytics & Reporting</span>
        <OcBadge label="Live" color="#059669" bg="#ECFDF5" />
      </div>

      {/* Overview KPIs */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Total Content", value: overview.totalContent, color: "text-oc-purple" },
          { label: "Content Today", value: overview.contentToday, color: "text-oc-blue" },
          { label: "Total Posts", value: overview.totalPosts, color: "text-oc-green" },
          { label: "Completion Rate", value: `${overview.completionRate}%`, color: "text-oc-teal" },
        ].map((kpi) => (
          <div key={kpi.label} className="p-[14px_16px] bg-oc-card border border-oc-border rounded-oc">
            <div className="text-[9px] font-semibold text-oc-text-muted uppercase tracking-[0.05em] mb-1">{kpi.label}</div>
            <div className={`text-[22px] font-bold font-mono ${kpi.color}`}>{kpi.value}</div>
          </div>
        ))}
      </div>

      {/* Usage Stats */}
      <div>
        <div className="text-tiny font-semibold text-oc-text-muted uppercase tracking-[0.05em] mb-3">AI Usage</div>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Total Requests", value: usage.totalRequests, color: "text-oc-blue" },
            { label: "Total Tokens", value: usage.totalTokens.toLocaleString(), color: "text-oc-purple" },
            { label: "Total Cost", value: `$${usage.totalCost.toFixed(2)}`, color: "text-oc-amber" },
          ].map((stat) => (
            <div key={stat.label} className="p-[14px_16px] bg-oc-card border border-oc-border rounded-[10px]">
              <div className="text-[9px] font-semibold text-oc-text-muted uppercase tracking-[0.05em] mb-1">{stat.label}</div>
              <div className={`text-[20px] font-bold font-mono ${stat.color}`}>{stat.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Platform Breakdown */}
      {platformBreakdown.length > 0 && (
        <div>
          <div className="text-tiny font-semibold text-oc-text-muted uppercase tracking-[0.05em] mb-3">Posts by Platform</div>
          <div className="bg-oc-card border border-oc-border rounded-[10px] overflow-hidden">
            <div className="grid grid-cols-[1fr_100px] gap-3 p-[10px_16px] bg-oc-bg border-b border-oc-border text-[9px] font-semibold text-oc-text-muted uppercase tracking-[0.05em]">
              <span>Platform</span>
              <span className="text-right">Posts</span>
            </div>
            {platformBreakdown.map((pb) => (
              <div key={pb.platform} className="grid grid-cols-[1fr_100px] gap-3 p-[10px_16px] border-b border-oc-border-light items-center">
                <span className="text-small font-semibold text-oc-text">{pb.platform}</span>
                <span className="text-right text-small font-mono text-oc-text-secondary">{pb.posts}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tasks Overview */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total Tasks", value: overview.totalTasks, color: "text-oc-text" },
          { label: "Completed", value: overview.tasksCompleted, color: "text-oc-green" },
          { label: "Posts Today", value: overview.postsToday, color: "text-oc-blue" },
        ].map((stat) => (
          <div key={stat.label} className="p-[14px_16px] bg-oc-card border border-oc-border rounded-[10px]">
            <div className="text-[9px] font-semibold text-oc-text-muted uppercase tracking-[0.05em] mb-1">{stat.label}</div>
            <div className={`text-[20px] font-bold font-mono ${stat.color}`}>{stat.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
