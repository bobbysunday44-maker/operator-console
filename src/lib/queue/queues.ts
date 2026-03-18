/* ── BullMQ Queue Definitions ──
 * Central registry of all job queues in the platform.
 * Workers import these queue names to process jobs.
 */

import { Queue } from "bullmq";
import { redisConnection } from "./connection";

// Queue names as constants
export const QUEUE_NAMES = {
  CONTENT_PIPELINE: "content-pipeline",
  SOCIAL_POSTING: "social-posting",
  AGENT_TASKS: "agent-tasks",
  SCHEDULES: "schedules",
} as const;

// Pipeline stage job data
export interface PipelineJobData {
  contentItemId: string;
  stage: "prompt" | "image" | "video" | "voiceover" | "lip_sync" | "assembly";
  pipelineRunId: string;
  previousOutput?: string; // output from previous stage
  config?: Record<string, unknown>;
}

// Social posting job data
export interface SocialPostJobData {
  postId: string;
  platformId: string;
  content: string;
  mediaUrls?: string[];
}

// Agent task job data
export interface AgentTaskJobData {
  taskId: string;
  agentId: string;
  taskType: string;
  config?: Record<string, unknown>;
}

// Schedule job data
export interface ScheduleJobData {
  scheduleId: string;
  taskType: string;
  taskConfig: Record<string, unknown>;
}

// Create queue instances (lazy singletons)
const queueCache = new Map<string, Queue>();

function getQueue(name: string): Queue {
  if (!queueCache.has(name)) {
    queueCache.set(name, new Queue(name, { connection: redisConnection }));
  }
  return queueCache.get(name)!;
}

export const contentPipelineQueue = () => getQueue(QUEUE_NAMES.CONTENT_PIPELINE);
export const socialPostingQueue = () => getQueue(QUEUE_NAMES.SOCIAL_POSTING);
export const agentTaskQueue = () => getQueue(QUEUE_NAMES.AGENT_TASKS);
export const schedulesQueue = () => getQueue(QUEUE_NAMES.SCHEDULES);
