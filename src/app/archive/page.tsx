"use client";

import { useState, useEffect, useCallback } from "react";
import { OcBadge } from "@/components/shared";
import type { ArchivedContent, ContentStatus, MediaType } from "@/lib/archive/types";

const STATUS_COLORS: Record<ContentStatus, { color: string; bg: string }> = {
  complete: { color: "#059669", bg: "#ECFDF5" },
  processing: { color: "#D97706", bg: "#FFFBEB" },
  failed: { color: "#DC2626", bg: "#FEF2F2" },
  archived: { color: "#6B7280", bg: "#F3F4F6" },
};

const MEDIA_ICONS: Record<MediaType, string> = {
  video: "🎬",
  image: "🖼️",
  text: "📝",
  carousel: "🎠",
};

type ViewMode = "grid" | "list";
type FilterStatus = ContentStatus | "all";

export default function ArchivePage() {
  const [items, setItems] = useState<ArchivedContent[]>([]);
  const [stats, setStats] = useState<{ total: number; complete: number; processing: number; failed: number; archived: number; totalCost: number } | null>(null);
  const [filter, setFilter] = useState<FilterStatus>("all");
  const [search, setSearch] = useState("");
  const [view, setView] = useState<ViewMode>("grid");

  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Debounce search input
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
      if (!itemsRes.ok || !statsRes.ok) throw new Error("Fetch failed");
      const itemsJson = await itemsRes.json();
      const statsJson = await statsRes.json();
      setItems(itemsJson.items || []);
      setStats(statsJson);
    } catch {
      console.error("[Archive] Fetch failed");
    }
  }, [filter, debouncedSearch]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filterTabs: { label: string; value: FilterStatus; count?: number }[] = [
    { label: "All", value: "all", count: stats?.total },
    { label: "Complete", value: "complete", count: stats?.complete },
    { label: "Processing", value: "processing", count: stats?.processing },
    { label: "Failed", value: "failed", count: stats?.failed },
    { label: "Archived", value: "archived", count: stats?.archived },
  ];

  function timeAgo(ts: number): string {
    const diff = Date.now() - ts;
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="text-page-title text-oc-text">Content Archive</span>
          <OcBadge label={`${stats?.total ?? 0} items`} color="#6B7280" bg="#F3F4F6" />
        </div>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex bg-oc-bg border border-oc-border rounded-[8px] overflow-hidden">
            <button
              onClick={() => setView("grid")}
              className={`px-2.5 py-1.5 text-[11px] font-semibold transition-colors ${view === "grid" ? "bg-oc-card text-oc-text" : "text-oc-text-muted hover:text-oc-text"}`}
            >
              ▦ Grid
            </button>
            <button
              onClick={() => setView("list")}
              className={`px-2.5 py-1.5 text-[11px] font-semibold transition-colors ${view === "list" ? "bg-oc-card text-oc-text" : "text-oc-text-muted hover:text-oc-text"}`}
            >
              ☰ List
            </button>
          </div>
        </div>
      </div>

      {/* Search + filters */}
      <div className="flex items-center gap-3">
        <input
          type="text"
          placeholder="Search by title, tag, or ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 px-3 py-2 text-small bg-oc-card border border-oc-border rounded-[8px] text-oc-text placeholder:text-oc-text-muted focus:outline-none focus:border-oc-blue"
        />
        <div className="flex gap-1">
          {filterTabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setFilter(tab.value)}
              className={`px-3 py-1.5 text-[11px] font-semibold rounded-[8px] transition-colors ${
                filter === tab.value
                  ? "bg-oc-text text-white"
                  : "bg-oc-bg text-oc-text-muted hover:text-oc-text"
              }`}
            >
              {tab.label}
              {tab.count !== undefined && (
                <span className="ml-1 opacity-60">{tab.count}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Stats row */}
      {stats && (
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: "Total Content", value: stats.total, color: "text-oc-text" },
            { label: "Completed", value: stats.complete, color: "text-oc-green" },
            { label: "Processing", value: stats.processing, color: "text-oc-amber" },
            { label: "Total Cost", value: `$${stats.totalCost.toFixed(2)}`, color: "text-oc-blue" },
          ].map((s) => (
            <div key={s.label} className="p-[14px_16px] bg-oc-card border border-oc-border rounded-oc">
              <div className="text-[9px] font-semibold text-oc-text-muted uppercase tracking-[0.05em] mb-1">
                {s.label}
              </div>
              <div className={`text-[20px] font-bold font-mono ${s.color}`}>{s.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Content grid/list */}
      {items.length === 0 ? (
        <div className="flex items-center justify-center h-[200px] bg-oc-card border border-oc-border rounded-oc">
          <span className="text-small text-oc-text-muted">No content found</span>
        </div>
      ) : view === "grid" ? (
        <div className="grid grid-cols-3 gap-3">
          {items.map((item) => (
            <div key={item.id} className="p-4 bg-oc-card border border-oc-border rounded-[10px] flex flex-col gap-3">
              {/* Card header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[16px]">{MEDIA_ICONS[item.mediaType]}</span>
                  <span className="text-[10px] font-mono text-oc-text-muted">{item.id}</span>
                </div>
                <OcBadge
                  label={item.status}
                  color={STATUS_COLORS[item.status].color}
                  bg={STATUS_COLORS[item.status].bg}
                />
              </div>
              {/* Title + description */}
              <div>
                <div className="text-small font-semibold text-oc-text leading-tight mb-1">
                  {item.title}
                </div>
                <div className="text-[11px] text-oc-text-muted line-clamp-2">
                  {item.description}
                </div>
              </div>
              {/* Tags */}
              <div className="flex flex-wrap gap-1">
                {item.tags.slice(0, 3).map((tag) => (
                  <span key={tag} className="px-1.5 py-0.5 text-[9px] font-medium bg-oc-bg text-oc-text-muted rounded-[4px]">
                    {tag}
                  </span>
                ))}
                {item.tags.length > 3 && (
                  <span className="text-[9px] text-oc-text-muted">+{item.tags.length - 3}</span>
                )}
              </div>
              {/* Footer */}
              <div className="flex items-center justify-between pt-2 border-t border-oc-border-light">
                <div className="flex items-center gap-3">
                  {item.qualityScore !== undefined && (
                    <span className="text-[11px] font-mono font-semibold text-oc-green">
                      {item.qualityScore}/10
                    </span>
                  )}
                  <span className="text-[11px] font-mono text-oc-text-muted">
                    ${item.cost.toFixed(3)}
                  </span>
                </div>
                <span className="text-[10px] text-oc-text-muted">{timeAgo(item.createdAt)}</span>
              </div>
              {/* Models used */}
              <div className="flex flex-wrap gap-1">
                {item.models.map((m) => (
                  <span key={m} className="px-1.5 py-0.5 text-[9px] font-mono bg-oc-bg text-oc-text-secondary rounded-[4px]">
                    {m}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* List view */
        <div className="bg-oc-card border border-oc-border rounded-[10px] overflow-hidden">
          {/* Table header */}
          <div className="grid grid-cols-[1fr_80px_80px_80px_80px_100px_80px] gap-3 p-[10px_16px] bg-oc-bg border-b border-oc-border text-[9px] font-semibold text-oc-text-muted uppercase tracking-[0.05em]">
            <span>Content</span>
            <span>Status</span>
            <span>Type</span>
            <span className="text-right">Quality</span>
            <span className="text-right">Cost</span>
            <span className="text-right">Platforms</span>
            <span className="text-right">Created</span>
          </div>
          {items.map((item) => (
            <div
              key={item.id}
              className="grid grid-cols-[1fr_80px_80px_80px_80px_100px_80px] gap-3 p-[10px_16px] border-b border-oc-border-light items-center"
            >
              <div>
                <div className="text-small font-semibold text-oc-text">{item.title}</div>
                <div className="text-[10px] text-oc-text-muted font-mono">{item.id}</div>
              </div>
              <OcBadge
                label={item.status}
                color={STATUS_COLORS[item.status].color}
                bg={STATUS_COLORS[item.status].bg}
              />
              <span className="text-small text-oc-text-secondary">
                {MEDIA_ICONS[item.mediaType]} {item.mediaType}
              </span>
              <span className="text-right text-small font-mono font-semibold text-oc-green">
                {item.qualityScore !== undefined ? `${item.qualityScore}/10` : "—"}
              </span>
              <span className="text-right text-small font-mono text-oc-text-secondary">
                ${item.cost.toFixed(3)}
              </span>
              <span className="text-right text-[10px] text-oc-text-muted">
                {item.platforms.length > 0 ? item.platforms.join(", ") : "—"}
              </span>
              <span className="text-right text-[10px] text-oc-text-muted">
                {timeAgo(item.createdAt)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
