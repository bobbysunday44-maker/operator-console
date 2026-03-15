"use client";

import { useState, useEffect, useCallback } from "react";
import { OcBadge } from "@/components/shared";
import type { ArchivedContent, ContentStatus } from "@/lib/archive/types";

const STATUS_COLORS: Record<string, { color: string; bg: string }> = {
  idea: { color: "#9C9590", bg: "#F0EDE6" },
  scripting: { color: "#2563EB", bg: "#EFF4FF" },
  imaging: { color: "#7C3AED", bg: "#F5F3FF" },
  filming: { color: "#D97706", bg: "#FFFBEB" },
  voiceover: { color: "#0D9488", bg: "#F0FDFA" },
  assembly: { color: "#2563EB", bg: "#EFF4FF" },
  review: { color: "#D97706", bg: "#FFFBEB" },
  approved: { color: "#059669", bg: "#ECFDF5" },
  published: { color: "#059669", bg: "#ECFDF5" },
  failed: { color: "#DC2626", bg: "#FEF2F2" },
};

type FilterStatus = ContentStatus | "all";

function timeAgo(ts: string): string {
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function ArchivePage() {
  const [items, setItems] = useState<ArchivedContent[]>([]);
  const [stats, setStats] = useState<{ total: number; byStatus: Record<string, number> } | null>(null);
  const [filter, setFilter] = useState<FilterStatus>("all");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchData = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (filter !== "all") params.set("status", filter);
      if (debouncedSearch) params.set("search", debouncedSearch);
      const [itemsRes, statsRes] = await Promise.all([
        fetch(`/api/archive?${params}`),
        fetch("/api/archive?view=stats"),
      ]);
      setItems((await itemsRes.json()).items || []);
      setStats(await statsRes.json());
    } catch {
      console.error("[Archive] Fetch failed");
    }
  }, [filter, debouncedSearch]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filterTabs: { label: string; value: FilterStatus }[] = [
    { label: "All", value: "all" },
    { label: "Published", value: "published" },
    { label: "Review", value: "review" },
    { label: "In Progress", value: "scripting" },
    { label: "Failed", value: "failed" },
  ];

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-2.5">
        <span className="text-page-title text-oc-text">Content Archive</span>
        <OcBadge label={`${stats?.total ?? 0} items`} color="#6B7280" bg="#F3F4F6" />
      </div>

      <div className="flex items-center gap-3">
        <input
          type="text" placeholder="Search by title or tag..."
          value={search} onChange={(e) => setSearch(e.target.value)}
          className="flex-1 px-3 py-2 text-small bg-oc-card border border-oc-border rounded-[8px] text-oc-text placeholder:text-oc-text-muted focus:outline-none focus:border-oc-blue"
        />
        <div className="flex gap-1">
          {filterTabs.map((tab) => (
            <button key={tab.value} onClick={() => setFilter(tab.value)}
              className={`px-3 py-1.5 text-[11px] font-semibold rounded-[8px] transition-colors ${
                filter === tab.value ? "bg-oc-text text-white" : "bg-oc-bg text-oc-text-muted hover:text-oc-text"
              }`}>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: "Total Content", value: stats.total, color: "text-oc-text" },
            { label: "Published", value: stats.byStatus?.published || 0, color: "text-oc-green" },
            { label: "In Review", value: stats.byStatus?.review || 0, color: "text-oc-amber" },
            { label: "Failed", value: stats.byStatus?.failed || 0, color: "text-oc-red" },
          ].map((s) => (
            <div key={s.label} className="p-[14px_16px] bg-oc-card border border-oc-border rounded-oc">
              <div className="text-[9px] font-semibold text-oc-text-muted uppercase tracking-[0.05em] mb-1">{s.label}</div>
              <div className={`text-[20px] font-bold font-mono ${s.color}`}>{s.value}</div>
            </div>
          ))}
        </div>
      )}

      {items.length === 0 ? (
        <div className="flex items-center justify-center h-[200px] bg-oc-card border border-oc-border rounded-oc">
          <span className="text-small text-oc-text-muted">No content found</span>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3">
          {items.map((item) => {
            const sc = STATUS_COLORS[item.status] || STATUS_COLORS.idea;
            return (
              <div key={item.id} className="p-4 bg-oc-card border border-oc-border rounded-[10px] flex flex-col gap-3">
                <div className="flex items-start justify-between">
                  <span className="text-[10px] font-mono text-oc-text-muted">{item.id.slice(0, 12)}</span>
                  <OcBadge label={item.status} color={sc.color} bg={sc.bg} />
                </div>
                <div>
                  <div className="text-small font-semibold text-oc-text leading-tight mb-1">{item.title}</div>
                  {item.description && <div className="text-[11px] text-oc-text-muted line-clamp-2">{item.description}</div>}
                </div>
                {item.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {item.tags.slice(0, 3).map((tag) => (
                      <span key={tag} className="px-1.5 py-0.5 text-[9px] font-medium bg-oc-bg text-oc-text-muted rounded-[4px]">{tag}</span>
                    ))}
                  </div>
                )}
                <div className="flex items-center justify-between pt-2 border-t border-oc-border-light">
                  <span className="text-[11px] font-mono text-oc-text-muted">${item.totalCost.toFixed(3)}</span>
                  <span className="text-[10px] text-oc-text-muted">{timeAgo(item.createdAt)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
