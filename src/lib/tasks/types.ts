/* ── OpenClaw Task & Schedule Types ── */

export type TaskStatus = "pending" | "running" | "completed" | "failed" | "retrying";
export type TaskPriority = "low" | "medium" | "high" | "critical";

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  /** Agent assigned to this task */
  agentId?: string;
  agentName?: string;
  /** Content ID if linked to a pipeline */
  contentId?: string;
  /** BullMQ job ID (when connected) */
  jobId?: string;
  /** Retry tracking */
  attempts: number;
  maxAttempts: number;
  lastError?: string;
  /** Timing */
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
  /** Duration in ms */
  duration?: number;
}

export type ScheduleFrequency = "hourly" | "daily" | "weekly" | "custom";

export interface Schedule {
  id: string;
  name: string;
  description: string;
  /** Cron expression */
  cron: string;
  frequency: ScheduleFrequency;
  /** Whether this schedule is active */
  enabled: boolean;
  /** Task template to run */
  taskTemplate: {
    title: string;
    agentId?: string;
    agentName?: string;
    priority: TaskPriority;
  };
  /** Execution history */
  lastRunAt?: number;
  lastRunStatus?: TaskStatus;
  nextRunAt: number;
  totalRuns: number;
  failedRuns: number;
  createdAt: number;
}
