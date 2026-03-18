"use client";

import { useState, useEffect, useCallback } from "react";
import { OcBadge } from "@/components/shared";
import { Calendar, Plus, RefreshCw } from "lucide-react";

interface Bucket { id: string; name: string; targetRatio: number; actualRatio: number; gap: number; color: string; }
interface CalendarEntry { id: string; niche: string; scheduledDate: string; timeSlot: string; status: string; bucket?: { name: string; color: string }; series?: { name: string }; contentItem?: { title: string; status: string }; }
interface Series { id: string; name: string; niche: string; episodeCount: number; nextEpisodeNum: number; isActive: boolean; schedule: string | null; }

export default function StrategyPage() {
  const [buckets, setBuckets] = useState<Bucket[]>([]);
  const [calendar, setCalendar] = useState<CalendarEntry[]>([]);
  const [series, setSeries] = useState<Series[]>([]);
  const [suggestion, setSuggestion] = useState<{ bucket: string; gap: number; suggestion: string } | null>(null);
  const [niche, setNiche] = useState("AI");
  const [generating, setGenerating] = useState(false);

  const fetchData = useCallback(async () => {
    const [bucketsRes, calendarRes, seriesRes] = await Promise.all([
      fetch(`/api/strategy/buckets?niche=${niche}`).then((r) => r.json()).catch(() => ({ ratios: [], suggestion: null })),
      fetch(`/api/strategy/calendar?niche=${niche}`).then((r) => r.json()).catch(() => ({ entries: [] })),
      fetch(`/api/strategy/series?niche=${niche}`).then((r) => r.json()).catch(() => ({ series: [] })),
    ]);
    setBuckets(bucketsRes.ratios || []);
    setSuggestion(bucketsRes.suggestion || null);
    setCalendar(calendarRes.entries || []);
    setSeries(seriesRes.series || []);
  }, [niche]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const generateWeek = async () => {
    setGenerating(true);
    await fetch("/api/strategy/calendar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ niche, startDate: new Date().toISOString() }),
    });
    await fetchData();
    setGenerating(false);
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="text-page-title text-oc-text">Content Strategy</span>
          <OcBadge label="Live" color="#059669" bg="#ECFDF5" />
        </div>
        <div className="flex items-center gap-2">
          <select value={niche} onChange={(e) => setNiche(e.target.value)} className="text-small px-3 py-1.5 border border-oc-border rounded-oc bg-oc-card text-oc-text">
            <option>AI</option><option>Fitness</option><option>Finance</option>
          </select>
          <button onClick={generateWeek} disabled={generating} className="flex items-center gap-1.5 px-3 py-1.5 bg-oc-text text-white rounded-oc text-small font-semibold hover:opacity-90">
            <Calendar className="w-3.5 h-3.5" />{generating ? "Generating..." : "Generate Week"}
          </button>
        </div>
      </div>

      {/* Suggestion */}
      {suggestion && (
        <div className="p-3 bg-oc-blue-light border-l-2 border-oc-blue rounded-oc">
          <span className="text-small text-oc-text">{suggestion.suggestion}</span>
        </div>
      )}

      {/* Content Buckets */}
      <div>
        <h2 className="text-section-title text-oc-text mb-3">Content Mix</h2>
        <div className="grid grid-cols-5 gap-3">
          {buckets.map((b) => (
            <div key={b.id} className="p-3 bg-oc-card border border-oc-border rounded-oc">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: b.color || "#666" }} />
                <span className="text-small font-semibold text-oc-text capitalize">{b.name.replace(/_/g, " ")}</span>
              </div>
              <div className="flex justify-between text-tiny text-oc-text-muted mb-1">
                <span>Target: {Math.round(b.targetRatio * 100)}%</span>
                <span>Actual: {Math.round(b.actualRatio * 100)}%</span>
              </div>
              <div className="w-full h-[4px] bg-oc-border-light rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, (b.actualRatio / b.targetRatio) * 100)}%`, backgroundColor: b.color || "#666" }} />
              </div>
              <div className="text-[9px] mt-1 text-right font-mono" style={{ color: b.gap > 0 ? "#EF4444" : "#10B981" }}>
                {b.gap > 0 ? `${b.gap}% under` : b.gap < 0 ? `${Math.abs(b.gap)}% over` : "On target"}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Content Series */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-section-title text-oc-text">Content Series</h2>
          <button className="flex items-center gap-1 text-tiny text-oc-blue font-semibold"><Plus className="w-3 h-3" />New Series</button>
        </div>
        {series.length === 0 ? (
          <div className="p-6 bg-oc-card border border-oc-border rounded-oc text-center text-small text-oc-text-muted">No series created yet</div>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            {series.map((s) => (
              <div key={s.id} className="p-3 bg-oc-card border border-oc-border rounded-oc">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-small font-semibold text-oc-text">{s.name}</span>
                  <OcBadge label={s.isActive ? "Active" : "Paused"} color={s.isActive ? "#059669" : "#9CA3AF"} bg={s.isActive ? "#ECFDF5" : "#F3F4F6"} />
                </div>
                <div className="text-tiny text-oc-text-muted">{s.episodeCount} episodes · Next: #{s.nextEpisodeNum}</div>
                {s.schedule && <div className="text-[9px] font-mono text-oc-text-muted mt-1">{s.schedule}</div>}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Weekly Calendar */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-section-title text-oc-text">Content Calendar</h2>
          <button onClick={fetchData} className="flex items-center gap-1 text-tiny text-oc-text-muted"><RefreshCw className="w-3 h-3" />Refresh</button>
        </div>
        {calendar.length === 0 ? (
          <div className="p-6 bg-oc-card border border-oc-border rounded-oc text-center text-small text-oc-text-muted">No calendar entries. Click &quot;Generate Week&quot; to plan content.</div>
        ) : (
          <div className="grid grid-cols-7 gap-2">
            {calendar.map((entry) => {
              const date = new Date(entry.scheduledDate);
              const dayName = date.toLocaleDateString("en-US", { weekday: "short" });
              return (
                <div key={entry.id} className="p-2.5 bg-oc-card border border-oc-border rounded-oc">
                  <div className="text-[9px] text-oc-text-muted font-semibold uppercase">{dayName} · {entry.timeSlot}</div>
                  <div className="text-tiny font-semibold text-oc-text mt-1 capitalize">{entry.bucket?.name?.replace(/_/g, " ") || "Unassigned"}</div>
                  {entry.contentItem && <div className="text-[9px] text-oc-green mt-0.5">{entry.contentItem.title.slice(0, 30)}</div>}
                  <OcBadge label={entry.status} color={entry.status === "posted" ? "#059669" : entry.status === "created" ? "#3B82F6" : "#9CA3AF"} bg={entry.status === "posted" ? "#ECFDF5" : entry.status === "created" ? "#EFF6FF" : "#F3F4F6"} />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
