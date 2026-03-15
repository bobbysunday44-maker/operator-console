/* ── OpenClaw Task & Schedule Types (matches Prisma API responses) ── */

export type TaskStatus = "pending" | "in_progress" | "completed" | "failed" | "cancelled";
export type TaskPriority = "low" | "medium" | "high" | "urgent";

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId: string | null;
  assignee: { id: string; name: string } | null;
  parentId: string | null;
  dueAt: string | null;
  completedAt: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export interface Schedule {
  id: string;
  name: string;
  cronExpr: string;
  taskType: string;
  taskConfig: Record<string, unknown> | null;
  enabled: boolean;
  lastRunAt: string | null;
  nextRunAt: string | null;
  createdAt: string;
  updatedAt: string;
  _count: { runs: number };
}
