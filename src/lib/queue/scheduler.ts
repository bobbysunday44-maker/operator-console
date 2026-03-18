/* ── Schedule Cron Runner ──
 * Reads Schedule table, evaluates cron expressions,
 * and dispatches jobs to BullMQ when schedules are due.
 * Runs as an interval check every 60 seconds.
 */

import { parseExpression } from "cron-parser";
import { prisma } from "@/lib/db/prisma";
import { socialPostingQueue } from "./queues";
import { startPipeline } from "@/lib/pipeline/orchestrator";
import { eventBus } from "@/lib/events/event-bus";

let schedulerInterval: ReturnType<typeof setInterval> | null = null;

async function checkSchedules() {
  try {
    const now = new Date();
    const schedules = await prisma.schedule.findMany({
      where: { enabled: true },
    });

    for (const schedule of schedules) {
      // Check if this schedule is due
      if (schedule.nextRunAt && schedule.nextRunAt > now) {
        continue; // Not due yet
      }

      // Parse cron and check
      try {
        const interval = parseExpression(schedule.cronExpr, { currentDate: schedule.lastRunAt || new Date(0) });
        const nextDate = interval.next().toDate();

        if (nextDate > now) {
          // Update nextRunAt and skip
          await prisma.schedule.update({
            where: { id: schedule.id },
            data: { nextRunAt: nextDate },
          });
          continue;
        }
      } catch {
        console.error(`[Scheduler] Invalid cron expression for schedule ${schedule.id}: ${schedule.cronExpr}`);
        continue;
      }

      // Schedule is due — execute it
      console.log(`[Scheduler] Executing schedule: ${schedule.name} (${schedule.taskType})`);

      const run = await prisma.scheduleRun.create({
        data: { scheduleId: schedule.id, status: "in_progress" },
      });

      try {
        const config = schedule.taskConfig as Record<string, unknown>;

        switch (schedule.taskType) {
          case "pipeline": {
            const contentItemId = config.contentItemId as string;
            if (contentItemId) {
              await startPipeline(contentItemId, { includeLipSync: !!config.includeLipSync });
            }
            break;
          }
          case "post": {
            const postId = config.postId as string;
            if (postId) {
              await socialPostingQueue().add("scheduled-post", {
                postId,
                platformId: config.platformId as string || "",
                content: config.content as string || "",
                mediaUrls: (config.mediaUrls as string[]) || [],
              });
            }
            break;
          }
          case "scan": {
            eventBus.emit({ type: "task_started", message: `Scheduled scan: ${schedule.name}` });
            break;
          }
          default:
            console.log(`[Scheduler] Unknown task type: ${schedule.taskType}`);
        }

        // Update schedule run and next run time
        const nextInterval = parseExpression(schedule.cronExpr);
        const nextRunAt = nextInterval.next().toDate();

        await prisma.scheduleRun.update({
          where: { id: run.id },
          data: { status: "completed", completedAt: new Date() },
        });

        await prisma.schedule.update({
          where: { id: schedule.id },
          data: { lastRunAt: now, nextRunAt },
        });

        eventBus.emit({
          type: "task_completed",
          message: `Schedule "${schedule.name}" executed successfully`,
          metadata: { scheduleId: schedule.id },
        });
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Unknown error";
        await prisma.scheduleRun.update({
          where: { id: run.id },
          data: { status: "failed", error: errorMsg, completedAt: new Date() },
        });

        eventBus.emit({
          type: "error",
          message: `Schedule "${schedule.name}" failed: ${errorMsg}`,
          metadata: { scheduleId: schedule.id },
        });
      }
    }
  } catch (err) {
    console.error("[Scheduler] Error checking schedules:", err);
  }
}

export function startScheduler() {
  if (schedulerInterval) return;
  console.log("[Scheduler] Started — checking every 60s");
  checkSchedules(); // Run immediately
  schedulerInterval = setInterval(checkSchedules, 60_000);
}

export function stopScheduler() {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
    schedulerInterval = null;
    console.log("[Scheduler] Stopped");
  }
}
