/* ── OpenClaw Task Store ──
 * In-memory task queue with retry tracking.
 * Will be replaced by BullMQ + Redis once infra is connected.
 */

import type { Task, TaskStatus, TaskPriority, Schedule } from "./types";
import { eventBus } from "@/lib/events/event-bus";

class TaskStore {
  private tasks = new Map<string, Task>();
  private schedules = new Map<string, Schedule>();
  private counter = 0;

  private nextId(prefix: string): string {
    this.counter++;
    return `${prefix}-${Date.now()}-${this.counter}`;
  }

  /* ── Tasks ── */

  createTask(task: Omit<Task, "id" | "createdAt" | "attempts">): Task {
    const full: Task = {
      ...task,
      id: this.nextId("task"),
      attempts: 0,
      createdAt: Date.now(),
    };
    this.tasks.set(full.id, full);
    return full;
  }

  getTask(id: string): Task | null {
    return this.tasks.get(id) || null;
  }

  listTasks(filters?: { status?: TaskStatus; priority?: TaskPriority; agentId?: string }): Task[] {
    let all = Array.from(this.tasks.values()).sort((a, b) => b.createdAt - a.createdAt);
    if (filters?.status) all = all.filter((t) => t.status === filters.status);
    if (filters?.priority) all = all.filter((t) => t.priority === filters.priority);
    if (filters?.agentId) all = all.filter((t) => t.agentId === filters.agentId);
    return all;
  }

  updateTask(id: string, updates: Partial<Pick<Task, "status" | "lastError" | "attempts" | "startedAt" | "completedAt" | "duration">>): Task | null {
    const task = this.tasks.get(id);
    if (!task) return null;
    Object.assign(task, updates);
    return task;
  }

  retryTask(id: string): Task | null {
    const task = this.tasks.get(id);
    if (!task) return null;
    if (task.attempts >= task.maxAttempts) {
      task.status = "failed";
      task.lastError = "Max retries exceeded";
      return task;
    }
    task.status = "retrying";
    task.attempts++;
    task.lastError = undefined;

    eventBus.emit({
      type: "task_started",
      agentName: task.agentName || "System",
      agentId: task.agentId,
      message: `Retrying task: ${task.title} (attempt ${task.attempts}/${task.maxAttempts})`,
    });

    return task;
  }

  getTaskStats() {
    const all = Array.from(this.tasks.values());
    return {
      total: all.length,
      pending: all.filter((t) => t.status === "pending").length,
      running: all.filter((t) => t.status === "running").length,
      completed: all.filter((t) => t.status === "completed").length,
      failed: all.filter((t) => t.status === "failed").length,
      retrying: all.filter((t) => t.status === "retrying").length,
    };
  }

  /* ── Schedules ── */

  createSchedule(schedule: Omit<Schedule, "id" | "createdAt" | "totalRuns" | "failedRuns"> & { totalRuns?: number; failedRuns?: number }): Schedule {
    const full: Schedule = {
      ...schedule,
      id: this.nextId("sched"),
      totalRuns: schedule.totalRuns ?? 0,
      failedRuns: schedule.failedRuns ?? 0,
      createdAt: Date.now(),
    };
    this.schedules.set(full.id, full);
    return full;
  }

  getSchedule(id: string): Schedule | null {
    return this.schedules.get(id) || null;
  }

  listSchedules(): Schedule[] {
    return Array.from(this.schedules.values()).sort((a, b) => a.nextRunAt - b.nextRunAt);
  }

  toggleSchedule(id: string): Schedule | null {
    const schedule = this.schedules.get(id);
    if (!schedule) return null;
    schedule.enabled = !schedule.enabled;
    return schedule;
  }
}

/* ── Singleton ── */
const globalForTasks = globalThis as unknown as { taskStore: TaskStore };
export const taskStore = globalForTasks.taskStore || new TaskStore();
if (process.env.NODE_ENV !== "production") {
  globalForTasks.taskStore = taskStore;
}

/* ── Seed demo data ── */
function seedIfEmpty() {
  if (taskStore.listTasks().length > 0) return;

  const now = Date.now();

  // Tasks
  const taskData: Omit<Task, "id" | "createdAt" | "attempts">[] = [
    { title: "Generate TikTok script for CNT-0047", description: "Write viral hook + 30s script about AI agents", status: "completed", priority: "high", agentId: "agent-writer", agentName: "Writer", contentId: "CNT-0047", maxAttempts: 3, startedAt: now - 120000, completedAt: now - 118000, duration: 2100 },
    { title: "Generate scene image", description: "Robot hand scrolling phone, neon glow, 1024x1024", status: "completed", priority: "high", agentId: "agent-designer", agentName: "Designer", contentId: "CNT-0047", maxAttempts: 3, startedAt: now - 115000, completedAt: now - 110200, duration: 4800 },
    { title: "Generate video clip (Veo 3.1)", description: "Cinematic zoom + glitch effects, 1080p 8s vertical", status: "running", priority: "high", agentId: "agent-filmmaker", agentName: "Filmmaker", contentId: "CNT-0047", maxAttempts: 3, startedAt: now - 30000 },
    { title: "Scan Twitter mentions", description: "Hourly mention scan for brand keywords", status: "completed", priority: "medium", agentId: "agent-scanner", agentName: "Scanner", maxAttempts: 3, startedAt: now - 60000, completedAt: now - 55000, duration: 5000 },
    { title: "Reply to 3 new mentions", description: "Sentiment-aware auto-replies on Twitter", status: "completed", priority: "medium", agentId: "agent-engage-bot", agentName: "Engage Bot", maxAttempts: 3, startedAt: now - 50000, completedAt: now - 48000, duration: 2000 },
    { title: "Publish CNT-0046 to LinkedIn", description: "Cross-post AI vs Traditional Marketing", status: "failed", priority: "low", agentId: "agent-social-bot", agentName: "Social Bot", contentId: "CNT-0046", maxAttempts: 3, lastError: "LinkedIn API: rate limit exceeded (429)", startedAt: now - 90000 },
    { title: "Generate trending topics report", description: "Daily analysis of AI/tech trends across platforms", status: "pending", priority: "medium", agentId: "agent-ideator", agentName: "Ideator", maxAttempts: 3 },
    { title: "Quality review CNT-0048", description: "Review and score generated content before publish", status: "pending", priority: "high", agentId: "agent-editor", agentName: "Editor", contentId: "CNT-0048", maxAttempts: 3 },
  ];

  for (const t of taskData) {
    taskStore.createTask(t);
  }

  // Schedules
  const hour = 3600000;
  const schedData: (Omit<Schedule, "id" | "createdAt" | "totalRuns" | "failedRuns"> & { totalRuns?: number; failedRuns?: number })[] = [
    { name: "Hourly Mention Scan", description: "Scan all platforms for brand mentions", cron: "0 * * * *", frequency: "hourly", enabled: true, taskTemplate: { title: "Scan mentions", agentId: "agent-scanner", agentName: "Scanner", priority: "medium" }, lastRunAt: now - hour, lastRunStatus: "completed", nextRunAt: now + 1200000, totalRuns: 168, failedRuns: 3 },
    { name: "Daily Trend Analysis", description: "Analyze trending topics and generate content ideas", cron: "0 8 * * *", frequency: "daily", enabled: true, taskTemplate: { title: "Generate trending report", agentId: "agent-ideator", agentName: "Ideator", priority: "medium" }, lastRunAt: now - 16 * hour, lastRunStatus: "completed", nextRunAt: now + 8 * hour, totalRuns: 14, failedRuns: 1 },
    { name: "Daily Content Pipeline", description: "Auto-create one piece of content per day", cron: "0 10 * * *", frequency: "daily", enabled: true, taskTemplate: { title: "Run content pipeline", agentId: "agent-writer", agentName: "Writer", priority: "high" }, lastRunAt: now - 14 * hour, lastRunStatus: "completed", nextRunAt: now + 10 * hour, totalRuns: 12, failedRuns: 2 },
    { name: "Weekly Performance Report", description: "Generate engagement metrics and recommendations", cron: "0 9 * * 1", frequency: "weekly", enabled: true, taskTemplate: { title: "Generate weekly report", agentId: "agent-editor", agentName: "Editor", priority: "low" }, lastRunAt: now - 5 * 24 * hour, lastRunStatus: "completed", nextRunAt: now + 2 * 24 * hour, totalRuns: 8, failedRuns: 0 },
    { name: "Nightly Content Archive", description: "Archive completed content and clean up temp files", cron: "0 2 * * *", frequency: "daily", enabled: false, taskTemplate: { title: "Archive and cleanup", priority: "low" }, nextRunAt: now + 18 * hour, totalRuns: 5, failedRuns: 1 },
  ];

  for (const s of schedData) {
    taskStore.createSchedule(s);
  }
}

seedIfEmpty();
