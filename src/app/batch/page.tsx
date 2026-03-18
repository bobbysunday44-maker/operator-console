"use client";

import { useState, useEffect, useCallback } from "react";
import { OcBadge } from "@/components/shared";
import { Layers, TrendingUp, Calendar, Zap, Clock, RefreshCw } from "lucide-react";

interface BatchResult { created: number; pipelinesStarted: number; contentIds: string[]; errors: string[]; }
interface BatchStatus { total: number; processing: number; review: number; approved: number; published: number; failed: number; totalCost: number; }
interface ScheduleOverview { niche: string; postsPerDay: number; postTimes: string[]; }

export default function BatchPage() {
  const [tab, setTab] = useState<"create" | "status" | "schedule">("create");
  const [niche, setNiche] = useState("AI");
  const [count, setCount] = useState(5);
  const [mode, setMode] = useState<"trending" | "calendar" | "manual">("trending");
  const [autoStart, setAutoStart] = useState(true);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<BatchResult | null>(null);
  const [batchStatus, setBatchStatus] = useState<{ items: { id: string; title: string; status: string; totalCost: number }[]; statuses: BatchStatus } | null>(null);
  const [scheduleOverview, setScheduleOverview] = useState<ScheduleOverview[]>([]);
  const [postsPerDay, setPostsPerDay] = useState(3);
  const [trackingIds, setTrackingIds] = useState<string[]>([]);

  // Schedule config
  const [schedStartHour, setSchedStartHour] = useState(9);
  const [schedEndHour, setSchedEndHour] = useState(21);

  const fetchSchedules = useCallback(async () => {
    const res = await fetch("/api/batch/schedule").then((r) => r.json()).catch(() => ({ overview: [] }));
    setScheduleOverview(res.overview || []);
  }, []);

  useEffect(() => { fetchSchedules(); }, [fetchSchedules]);

  const refreshStatus = async () => {
    if (trackingIds.length === 0) return;
    const res = await fetch(`/api/batch/status?ids=${trackingIds.join(",")}`).then((r) => r.json()).catch(() => null);
    if (res) setBatchStatus(res);
  };

  useEffect(() => {
    if (trackingIds.length === 0) return;
    refreshStatus();
    const interval = setInterval(refreshStatus, 10000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trackingIds]);

  const runBatch = async () => {
    setRunning(true);
    setResult(null);
    const body: Record<string, unknown> = {
      mode,
      niche,
      count,
      options: { autoStartPipeline: autoStart, staggerMinutes: 1 },
    };

    if (mode === "manual") {
      body.items = Array.from({ length: count }, (_, i) => ({
        title: `${niche} Content #${i + 1}`,
        niche,
        targetPlatforms: ["TikTok", "Instagram", "YouTube"],
      }));
    }

    const res = await fetch("/api/batch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then((r) => r.json()).catch(() => ({ result: null }));

    if (res.result) {
      setResult(res.result);
      setTrackingIds(res.result.contentIds || []);
      setTab("status");
    }
    setRunning(false);
  };

  const createSchedule = async () => {
    await fetch("/api/batch/schedule", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ niche, postsPerDay, startHour: schedStartHour, endHour: schedEndHour }),
    });
    fetchSchedules();
  };

  const clearSchedule = async (nicheToDelete: string) => {
    await fetch(`/api/batch/schedule?niche=${nicheToDelete}`, { method: "DELETE" });
    fetchSchedules();
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-2.5">
        <span className="text-page-title text-oc-text">Mass Operations</span>
        <OcBadge label="Factory Mode" color="#8B5CF6" bg="#F5F3FF" />
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-oc-border">
        {([
          { key: "create", label: "Batch Create", icon: Layers },
          { key: "status", label: "Batch Status", icon: RefreshCw },
          { key: "schedule", label: "Mass Schedule", icon: Clock },
        ] as const).map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)} className={`flex items-center gap-1.5 pb-2 text-small font-semibold ${tab === t.key ? "text-oc-text border-b-2 border-oc-blue" : "text-oc-text-muted"}`}>
            <t.icon className="w-3.5 h-3.5" />{t.label}
          </button>
        ))}
      </div>

      {/* Batch Create */}
      {tab === "create" && (
        <div className="max-w-xl flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-tiny font-semibold text-oc-text-muted uppercase mb-1 block">Niche</label>
              <select value={niche} onChange={(e) => setNiche(e.target.value)} className="w-full p-2.5 border border-oc-border rounded-oc text-small bg-oc-card text-oc-text">
                <option>AI</option><option>Fitness</option><option>Finance</option><option>Tech</option>
              </select>
            </div>
            <div>
              <label className="text-tiny font-semibold text-oc-text-muted uppercase mb-1 block">Content Count</label>
              <input type="number" value={count} onChange={(e) => setCount(parseInt(e.target.value) || 1)} min={1} max={20} className="w-full p-2.5 border border-oc-border rounded-oc text-small bg-oc-card text-oc-text font-mono" />
            </div>
          </div>

          <div>
            <label className="text-tiny font-semibold text-oc-text-muted uppercase mb-2 block">Source Mode</label>
            <div className="grid grid-cols-3 gap-2">
              {([
                { key: "trending", label: "From Trending", desc: "Pick top viral topics", icon: TrendingUp },
                { key: "calendar", label: "From Calendar", desc: "Fill planned slots", icon: Calendar },
                { key: "manual", label: "Quick Generate", desc: "Auto-titled content", icon: Zap },
              ] as const).map((m) => (
                <button key={m.key} onClick={() => setMode(m.key)} className={`p-3 rounded-oc border text-left ${mode === m.key ? "border-oc-blue bg-oc-blue-light" : "border-oc-border bg-oc-card"}`}>
                  <m.icon className={`w-4 h-4 mb-1 ${mode === m.key ? "text-oc-blue" : "text-oc-text-muted"}`} />
                  <div className="text-small font-semibold text-oc-text">{m.label}</div>
                  <div className="text-[9px] text-oc-text-muted">{m.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={autoStart} onChange={(e) => setAutoStart(e.target.checked)} className="rounded" />
            <span className="text-small text-oc-text">Auto-start pipelines (generate content immediately)</span>
          </label>

          <button onClick={runBatch} disabled={running} className="flex items-center justify-center gap-2 px-4 py-2.5 bg-oc-text text-white rounded-oc text-small font-semibold hover:opacity-90 disabled:opacity-50">
            <Layers className="w-4 h-4" />
            {running ? `Creating ${count} items...` : `Create ${count} Content Items`}
          </button>

          {result && (
            <div className="p-3 bg-oc-green-light border border-oc-green rounded-oc">
              <div className="text-small font-semibold text-oc-green">Batch Complete</div>
              <div className="text-tiny text-oc-text mt-1">
                Created: {result.created} · Pipelines: {result.pipelinesStarted} · Errors: {result.errors.length}
              </div>
              {result.errors.length > 0 && result.errors.map((e, i) => <div key={i} className="text-tiny text-red-500 mt-0.5">{e}</div>)}
            </div>
          )}
        </div>
      )}

      {/* Batch Status */}
      {tab === "status" && (
        <div>
          {!batchStatus ? (
            <div className="p-8 bg-oc-card border border-oc-border rounded-oc text-center text-small text-oc-text-muted">
              No batch in progress. Create a batch first.
            </div>
          ) : (
            <>
              <div className="grid grid-cols-6 gap-3 mb-4">
                {[
                  { label: "Total", value: batchStatus.statuses.total, color: "text-oc-text" },
                  { label: "Processing", value: batchStatus.statuses.processing, color: "text-oc-blue" },
                  { label: "Review", value: batchStatus.statuses.review, color: "text-oc-purple" },
                  { label: "Approved", value: batchStatus.statuses.approved, color: "text-oc-green" },
                  { label: "Published", value: batchStatus.statuses.published, color: "text-oc-teal" },
                  { label: "Cost", value: `$${batchStatus.statuses.totalCost.toFixed(2)}`, color: "text-oc-text" },
                ].map((kpi) => (
                  <div key={kpi.label} className="p-3 bg-oc-card border border-oc-border rounded-oc text-center">
                    <div className={`text-[20px] font-bold font-mono ${kpi.color}`}>{kpi.value}</div>
                    <div className="text-[9px] text-oc-text-muted uppercase">{kpi.label}</div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between mb-2">
                <span className="text-small font-semibold text-oc-text">Content Items</span>
                <button onClick={refreshStatus} className="flex items-center gap-1 text-tiny text-oc-blue font-semibold"><RefreshCw className="w-3 h-3" />Refresh</button>
              </div>

              <div className="bg-oc-card border border-oc-border rounded-oc overflow-hidden">
                <table className="w-full">
                  <thead><tr className="border-b border-oc-border">
                    <th className="text-left p-3 text-[9px] font-semibold text-oc-text-muted uppercase">Title</th>
                    <th className="text-center p-3 text-[9px] font-semibold text-oc-text-muted uppercase">Status</th>
                    <th className="text-right p-3 text-[9px] font-semibold text-oc-text-muted uppercase">Cost</th>
                  </tr></thead>
                  <tbody>
                    {batchStatus.items.map((item) => (
                      <tr key={item.id} className="border-b border-oc-border-light">
                        <td className="p-3 text-small text-oc-text">{item.title}</td>
                        <td className="p-3 text-center">
                          <OcBadge
                            label={item.status}
                            color={item.status === "published" ? "#059669" : item.status === "approved" ? "#3B82F6" : item.status === "failed" ? "#EF4444" : "#9CA3AF"}
                            bg={item.status === "published" ? "#ECFDF5" : item.status === "approved" ? "#EFF6FF" : item.status === "failed" ? "#FEF2F2" : "#F3F4F6"}
                          />
                        </td>
                        <td className="p-3 text-right text-small font-mono text-oc-text">${item.totalCost.toFixed(3)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {/* Mass Schedule */}
      {tab === "schedule" && (
        <div className="flex gap-6">
          <div className="flex-1 max-w-md flex flex-col gap-4">
            <h3 className="text-small font-semibold text-oc-text">Create Posting Schedule</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-tiny font-semibold text-oc-text-muted uppercase mb-1 block">Niche</label>
                <select value={niche} onChange={(e) => setNiche(e.target.value)} className="w-full p-2.5 border border-oc-border rounded-oc text-small bg-oc-card text-oc-text">
                  <option>AI</option><option>Fitness</option><option>Finance</option>
                </select>
              </div>
              <div>
                <label className="text-tiny font-semibold text-oc-text-muted uppercase mb-1 block">Posts/Day</label>
                <input type="number" value={postsPerDay} onChange={(e) => setPostsPerDay(parseInt(e.target.value) || 1)} min={1} max={10} className="w-full p-2.5 border border-oc-border rounded-oc text-small bg-oc-card text-oc-text font-mono" />
              </div>
              <div>
                <label className="text-tiny font-semibold text-oc-text-muted uppercase mb-1 block">Start Hour</label>
                <input type="number" value={schedStartHour} onChange={(e) => setSchedStartHour(parseInt(e.target.value) || 8)} min={0} max={23} className="w-full p-2.5 border border-oc-border rounded-oc text-small bg-oc-card text-oc-text font-mono" />
              </div>
              <div>
                <label className="text-tiny font-semibold text-oc-text-muted uppercase mb-1 block">End Hour</label>
                <input type="number" value={schedEndHour} onChange={(e) => setSchedEndHour(parseInt(e.target.value) || 21)} min={0} max={23} className="w-full p-2.5 border border-oc-border rounded-oc text-small bg-oc-card text-oc-text font-mono" />
              </div>
            </div>
            <button onClick={createSchedule} className="px-4 py-2 bg-oc-text text-white rounded-oc text-small font-semibold hover:opacity-90">
              Create {postsPerDay} Daily Schedules
            </button>
          </div>

          <div className="flex-1">
            <h3 className="text-small font-semibold text-oc-text mb-3">Active Schedules</h3>
            {scheduleOverview.length === 0 ? (
              <div className="p-6 bg-oc-card border border-oc-border rounded-oc text-center text-small text-oc-text-muted">No mass schedules configured.</div>
            ) : (
              <div className="flex flex-col gap-2">
                {scheduleOverview.map((s) => (
                  <div key={s.niche} className="p-3 bg-oc-card border border-oc-border rounded-oc flex items-center justify-between">
                    <div>
                      <span className="text-small font-semibold text-oc-text">{s.niche}</span>
                      <div className="text-tiny text-oc-text-muted">{s.postsPerDay} posts/day at {s.postTimes.join(", ")}</div>
                    </div>
                    <button onClick={() => clearSchedule(s.niche)} className="text-tiny text-red-500 font-semibold">Clear</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
