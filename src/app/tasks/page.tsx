"use client";

import { useState, useEffect, useCallback } from "react";
import { OcBadge } from "@/components/shared";
import type { Task, TaskStatus, TaskPriority } from "@/lib/tasks/types";

const STATUS_STYLES: Record<TaskStatus, { label: string; color: string; bg: string }> = {
  pending: { label: "Pending", color: "#9C9590", bg: "#F0EDE6" },
  in_progress: { label: "Running", color: "#2563EB", bg: "#EFF4FF" },
  completed: { label: "Complete", color: "#059669", bg: "#ECFDF5" },
  failed: { label: "Failed", color: "#DC2626", bg: "#FEF2F2" },
  cancelled: { label: "Cancelled", color: "#D97706", bg: "#FFFBEB" },
};

const PRIORITY_STYLES: Record<TaskPriority, { label: string; color: string; bg: string }> = {
  low: { label: "Low", color: "#9C9590", bg: "#F0EDE6" },
  medium: { label: "Med", color: "#2563EB", bg: "#EFF4FF" },
  high: { label: "High", color: "#D97706", bg: "#FFFBEB" },
  urgent: { label: "Urgent", color: "#DC2626", bg: "#FEF2F2" },
};

function timeAgo(ts: string): string {
  const mins = Math.floor((Date.now() - new Date(ts).getTime()) / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

type FilterTab = "all" | TaskStatus;

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filter, setFilter] = useState<FilterTab>("all");
  const [stats, setStats] = useState<Record<string, number>>({});

  const fetchData = useCallback(async () => {
    try {
      const [tasksRes, statsRes] = await Promise.all([
        fetch(filter === "all" ? "/api/tasks" : `/api/tasks?status=${filter}`),
        fetch("/api/tasks?view=stats"),
      ]);
      const tasksData = await tasksRes.json();
      const statsData = await statsRes.json();
      setTasks(tasksData.tasks || []);
      setStats(statsData);
    } catch {
      console.error("[Tasks] Fetch failed");
    }
  }, [filter]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleRetry = async (taskId: string) => {
    try {
      await fetch(`/api/tasks/${taskId}`, { method: "POST" });
      await fetchData();
    } catch {
      console.error("[Tasks] Retry failed");
    }
  };

  const TABS: { id: FilterTab; label: string; count?: number }[] = [
    { id: "all", label: "All", count: stats.total },
    { id: "in_progress", label: "Running", count: stats.in_progress },
    { id: "pending", label: "Pending", count: stats.pending },
    { id: "completed", label: "Completed", count: stats.completed },
    { id: "failed", label: "Failed", count: stats.failed },
  ];

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-2.5">
        <span className="text-page-title text-oc-text">Task Manager</span>
        <OcBadge label={`${stats.in_progress || 0} active`} color="#2563EB" bg="#EFF4FF" />
      </div>

      <div className="grid grid-cols-5 gap-3">
        {[
          { label: "Total", value: stats.total ?? 0, color: "text-oc-text" },
          { label: "Running", value: stats.in_progress ?? 0, color: "text-oc-blue" },
          { label: "Pending", value: stats.pending ?? 0, color: "text-oc-text-muted" },
          { label: "Completed", value: stats.completed ?? 0, color: "text-oc-green" },
          { label: "Failed", value: stats.failed ?? 0, color: "text-oc-red" },
        ].map((s) => (
          <div key={s.label} className="p-[14px_16px] bg-oc-card border border-oc-border rounded-oc">
            <div className="text-[9px] font-semibold text-oc-text-muted uppercase tracking-[0.05em] mb-1">{s.label}</div>
            <div className={`text-[22px] font-bold font-mono ${s.color}`}>{s.value}</div>
          </div>
        ))}
      </div>

      <div className="flex gap-1 border-b border-oc-border">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setFilter(t.id)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-small font-semibold border-b-2 transition-colors cursor-pointer bg-transparent ${
              filter === t.id ? "text-oc-blue border-oc-blue" : "text-oc-text-muted border-transparent hover:text-oc-text-secondary"
            }`}
          >
            {t.label}
            {t.count !== undefined && t.count > 0 && (
              <span className="text-[9px] font-bold bg-oc-bg text-oc-text-secondary rounded-full px-1.5 py-0.5 min-w-[18px] text-center">{t.count}</span>
            )}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-2">
        {tasks.length === 0 ? (
          <div className="text-center py-8 text-tiny text-oc-text-muted">No tasks found</div>
        ) : (
          tasks.map((task) => {
            const statusStyle = STATUS_STYLES[task.status] || STATUS_STYLES.pending;
            const priorityStyle = PRIORITY_STYLES[task.priority] || PRIORITY_STYLES.medium;
            return (
              <div key={task.id} className="p-[14px_16px] bg-oc-card border border-oc-border rounded-[10px] hover:bg-oc-bg/50 transition-colors">
                <div className="flex items-start gap-3">
                  <div
                    className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${task.status === "in_progress" ? "animate-pulse" : ""}`}
                    style={{ backgroundColor: statusStyle.color }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-small font-semibold text-oc-text">{task.title}</span>
                      <OcBadge label={statusStyle.label} color={statusStyle.color} bg={statusStyle.bg} />
                      <OcBadge label={priorityStyle.label} color={priorityStyle.color} bg={priorityStyle.bg} />
                    </div>
                    {task.description && (
                      <div className="text-tiny text-oc-text-secondary mb-1.5">{task.description}</div>
                    )}
                    <div className="flex items-center gap-3 text-[9px]">
                      {task.assignee && (
                        <span className="font-semibold text-oc-text-secondary">{task.assignee.name}</span>
                      )}
                      <span className="text-oc-text-muted ml-auto">{timeAgo(task.createdAt)}</span>
                    </div>
                  </div>
                  {task.status === "failed" && (
                    <button
                      onClick={() => handleRetry(task.id)}
                      className="text-tiny font-semibold text-oc-blue bg-oc-blue-light border-none rounded-[6px] px-3 py-1.5 cursor-pointer hover:opacity-80 transition-opacity shrink-0"
                    >
                      Retry
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
