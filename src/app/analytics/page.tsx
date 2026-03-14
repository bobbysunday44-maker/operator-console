"use client";

import { useState, useEffect, useCallback } from "react";
import { OcBadge } from "@/components/shared";
import { Sparkline } from "@/components/shared";
import type { AnalyticsSummary } from "@/lib/analytics/types";

const PLATFORM_ICONS: Record<string, string> = {
  TikTok: "🎵",
  Instagram: "📸",
  "Twitter/X": "🐦",
  YouTube: "▶️",
  LinkedIn: "💼",
};

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsSummary | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/analytics");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData(json);
    } catch {
      console.error("[Analytics] Fetch failed");
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (!data) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <span className="text-small text-oc-text-muted">Loading analytics...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center gap-2.5">
        <span className="text-page-title text-oc-text">Analytics & Reporting</span>
        <OcBadge label="Live" color="#059669" bg="#ECFDF5" />
      </div>

      {/* Top KPI cards */}
      <div className="grid grid-cols-6 gap-3">
        {[
          { label: "Total Followers", value: data.totalFollowers.toLocaleString(), sub: `+${data.followersGrowth} this week`, color: "text-oc-blue", trend: data.followerTrend },
          { label: "Engagement Rate", value: data.totalEngagement, sub: "avg across platforms", color: "text-oc-green", trend: data.engagementTrend },
          { label: "Content Created", value: data.contentCreated, sub: "all time", color: "text-oc-purple", trend: data.contentTrend },
          { label: "Cost Today", value: `$${data.totalCostToday.toFixed(2)}`, sub: "within budget", color: "text-oc-amber", trend: data.costTrend },
          { label: "Monthly Cost", value: `$${data.totalCostMonth.toFixed(2)}`, sub: "projected", color: "text-oc-text-secondary", trend: null },
          { label: "Cost/Content", value: `$${(data.totalCostMonth / Math.max(data.contentCreated, 1)).toFixed(2)}`, sub: "average", color: "text-oc-teal", trend: null },
        ].map((kpi) => (
          <div key={kpi.label} className="p-[14px_16px] bg-oc-card border border-oc-border rounded-oc">
            <div className="text-[9px] font-semibold text-oc-text-muted uppercase tracking-[0.05em] mb-1">
              {kpi.label}
            </div>
            <div className={`text-[20px] font-bold font-mono ${kpi.color}`}>{kpi.value}</div>
            <div className="flex items-center justify-between mt-1">
              <span className="text-[9px] text-oc-text-muted">{kpi.sub}</span>
              {kpi.trend && (
                <Sparkline data={kpi.trend.map((t) => t.value)} width={48} height={16} />
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Platform breakdown */}
      <div>
        <div className="text-tiny font-semibold text-oc-text-muted uppercase tracking-[0.05em] mb-3">
          Platform Performance
        </div>
        <div className="bg-oc-card border border-oc-border rounded-[10px] overflow-hidden">
          {/* Table header */}
          <div className="grid grid-cols-[1fr_100px_100px_80px_80px_100px] gap-3 p-[10px_16px] bg-oc-bg border-b border-oc-border text-[9px] font-semibold text-oc-text-muted uppercase tracking-[0.05em]">
            <span>Platform</span>
            <span className="text-right">Followers</span>
            <span className="text-right">Growth</span>
            <span className="text-right">Engage%</span>
            <span className="text-right">Posts</span>
            <span className="text-right">Impressions</span>
          </div>
          {data.platformMetrics.map((pm) => (
            <div
              key={pm.platform}
              className="grid grid-cols-[1fr_100px_100px_80px_80px_100px] gap-3 p-[10px_16px] border-b border-oc-border-light items-center"
            >
              <div className="flex items-center gap-2">
                <span className="text-[14px]">{PLATFORM_ICONS[pm.platform] || "🌐"}</span>
                <span className="text-small font-semibold text-oc-text">{pm.platform}</span>
              </div>
              <span className="text-right text-small font-mono font-semibold text-oc-text">
                {pm.followers.toLocaleString()}
              </span>
              <span className="text-right text-small font-mono text-oc-green font-semibold">
                +{pm.followersGrowth}
              </span>
              <span className="text-right text-small font-mono text-oc-text-secondary">
                {pm.engagement}%
              </span>
              <span className="text-right text-small font-mono text-oc-text-secondary">
                {pm.posts}
              </span>
              <span className="text-right text-small font-mono text-oc-text-muted">
                {(pm.impressions / 1000).toFixed(1)}K
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Cost breakdown */}
      <div>
        <div className="text-tiny font-semibold text-oc-text-muted uppercase tracking-[0.05em] mb-3">
          AI Model Costs
        </div>
        <div className="grid grid-cols-3 gap-3">
          {data.costByModel.map((cm) => (
            <div key={cm.model} className="p-[14px_16px] bg-oc-card border border-oc-border rounded-[10px]">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cm.color }} />
                <span className="text-small font-semibold text-oc-text">{cm.model}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <div className="text-[9px] text-oc-text-muted uppercase mb-0.5">Daily</div>
                  <div className="text-small font-mono font-semibold text-oc-text">
                    ${cm.dailyCost.toFixed(2)}
                  </div>
                </div>
                <div>
                  <div className="text-[9px] text-oc-text-muted uppercase mb-0.5">Monthly</div>
                  <div className="text-small font-mono font-semibold text-oc-text">
                    ${cm.monthlyCost.toFixed(2)}
                  </div>
                </div>
                <div>
                  <div className="text-[9px] text-oc-text-muted uppercase mb-0.5">Requests</div>
                  <div className="text-small font-mono font-semibold text-oc-text">{cm.requests}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
