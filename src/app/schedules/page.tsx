"use client";

import { useState, useEffect, useCallback } from "react";
import { OcBadge, ProgressBar } from "@/components/shared";
import type { Schedule } from "@/lib/tasks/types";

function formatTime(ts: string | null): string {
  if (!ts) return "—";
  const d = new Date(ts);
  const now = Date.now();
  const diff = d.getTime() - now;
  if (diff < 0) {
    const mins = Math.floor((now - d.getTime()) / 60000);
    if (mins < 60) return `${mins}m ago`;
    return `${Math.floor(mins / 60)}h ago`;
  }
  if (diff < 3600000) return `in ${Math.floor(diff / 60000)}m`;
  if (diff < 86400000) return `in ${Math.floor(diff / 3600000)}h`;
  return d.toLocaleDateString([], { weekday: "short", hour: "2-digit", minute: "2-digit" });
}

export default function SchedulesPage() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/schedules");
      const data = await res.json();
      setSchedules(data.schedules || []);
    } catch {
      console.error("[Schedules] Fetch failed");
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleToggle = async (id: string) => {
    try {
      await fetch(`/api/schedules/${id}`, { method: "PATCH" });
      await fetchData();
    } catch {
      console.error("[Schedules] Toggle failed");
    }
  };

  const activeCount = schedules.filter((s) => s.enabled).length;
  const totalRuns = schedules.reduce((sum, s) => sum + (s._count?.runs || 0), 0);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-2.5">
        <span className="text-page-title text-oc-text">Scheduled Tasks</span>
        <OcBadge label={`${activeCount} active`} color="#059669" bg="#ECFDF5" />
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Active Schedules", value: activeCount, color: "text-oc-green" },
          { label: "Total Runs", value: totalRuns, color: "text-oc-blue" },
          { label: "Total Schedules", value: schedules.length, color: "text-oc-text" },
        ].map((s) => (
          <div key={s.label} className="p-[14px_16px] bg-oc-card border border-oc-border rounded-oc">
            <div className="text-[9px] font-semibold text-oc-text-muted uppercase tracking-[0.05em] mb-1">{s.label}</div>
            <div className={`text-[22px] font-bold font-mono ${s.color}`}>{s.value}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3">
        {schedules.length === 0 ? (
          <div className="text-center py-8 text-tiny text-oc-text-muted">No schedules configured</div>
        ) : schedules.map((sched) => (
          <div key={sched.id} className={`p-[16px_18px] bg-oc-card border rounded-[10px] transition-opacity ${sched.enabled ? "border-oc-border" : "border-oc-border-light opacity-60"}`}>
            <div className="flex items-start gap-3">
              <button onClick={() => handleToggle(sched.id)}
                className={`w-10 h-5 rounded-full shrink-0 mt-0.5 transition-colors cursor-pointer border-none relative ${sched.enabled ? "bg-oc-green" : "bg-oc-border"}`}>
                <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${sched.enabled ? "translate-x-[22px]" : "translate-x-0.5"}`} />
              </button>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-small font-semibold text-oc-text">{sched.name}</span>
                  <OcBadge label={sched.enabled ? "Active" : "Paused"} color={sched.enabled ? "#059669" : "#9C9590"} bg={sched.enabled ? "#ECFDF5" : "#F0EDE6"} />
                  <span className="text-[9px] font-mono text-oc-text-muted bg-oc-bg px-1.5 py-0.5 rounded">{sched.cronExpr}</span>
                </div>
                <div className="text-tiny text-oc-text-secondary mb-2">{sched.taskType}</div>
                <div className="flex items-center gap-4 text-[9px]">
                  <div className="flex items-center gap-1">
                    <span className="text-oc-text-muted">Next run:</span>
                    <span className="font-mono font-semibold text-oc-blue">{sched.enabled ? formatTime(sched.nextRunAt) : "—"}</span>
                  </div>
                  {sched.lastRunAt && (
                    <div className="flex items-center gap-1">
                      <span className="text-oc-text-muted">Last run:</span>
                      <span className="font-mono text-oc-text-secondary">{formatTime(sched.lastRunAt)}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1 ml-auto">
                    <span className="text-oc-text-muted">{sched._count?.runs || 0} runs</span>
                  </div>
                </div>
                {(sched._count?.runs || 0) > 0 && (
                  <div className="mt-2"><ProgressBar value={100} color="#059669" /></div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
