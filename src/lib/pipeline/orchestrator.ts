/* ── Pipeline Orchestrator ──
 * Queues the FIRST stage of a content pipeline.
 * Each worker, on completion, queues the NEXT stage.
 * Stages run sequentially: prompt → image → video → voiceover → [lip_sync] → assembly
 */

import { contentPipelineQueue, type PipelineJobData } from "@/lib/queue/queues";
import { prisma } from "@/lib/db/prisma";
import { eventBus } from "@/lib/events/event-bus";
import type { PipelineStage } from "@/generated/prisma/client";

const STAGE_ORDER: PipelineStage[] = ["prompt", "image", "video", "voiceover", "assembly"];
const STAGE_ORDER_WITH_LIPSYNC: PipelineStage[] = ["prompt", "image", "video", "voiceover", "lip_sync", "assembly"];

const STAGE_MODELS = {
  prompt: "claude" as const,
  image: "gemini_nano_banana" as const,
  video: "gemini_veo" as const,
  voiceover: "edge_tts" as const,
  lip_sync: "kling" as const,
  assembly: "ffmpeg" as const,
};

/** Get the next stage in the pipeline after the given stage */
export function getNextStage(
  currentStage: PipelineStage,
  includeLipSync: boolean
): PipelineStage | null {
  const order = includeLipSync ? STAGE_ORDER_WITH_LIPSYNC : STAGE_ORDER;
  const idx = order.indexOf(currentStage);
  if (idx === -1 || idx === order.length - 1) return null;
  return order[idx + 1];
}

/** Queue a single pipeline stage */
export async function queueStage(
  contentItemId: string,
  stage: PipelineStage,
  pipelineRunId?: string
): Promise<string> {
  // Create pipeline run record if not provided
  let runId = pipelineRunId;
  if (!runId) {
    const run = await prisma.pipelineRun.create({
      data: {
        contentItemId,
        stage,
        model: STAGE_MODELS[stage],
        status: "pending",
      },
    });
    runId = run.id;
  }

  const jobData: PipelineJobData = {
    contentItemId,
    stage,
    pipelineRunId: runId,
  };

  await contentPipelineQueue().add(`pipeline-${stage}`, jobData);
  return runId;
}

/** Start a full pipeline — only queues the FIRST stage.
 *  Each worker queues the next stage on completion. */
export async function startPipeline(
  contentItemId: string,
  options?: { includeLipSync?: boolean }
): Promise<string> {
  const stages = options?.includeLipSync ? STAGE_ORDER_WITH_LIPSYNC : STAGE_ORDER;

  // Store pipeline config so workers know whether to include lip sync
  await prisma.contentItem.update({
    where: { id: contentItemId },
    data: {
      status: "scripting",
      // Store lip sync flag in metadata via tags
      tags: options?.includeLipSync
        ? { push: "__lip_sync__" }
        : undefined,
    },
  });

  // Only queue the FIRST stage — workers handle the rest
  const firstStage = stages[0];
  const runId = await queueStage(contentItemId, firstStage);

  eventBus.emit({
    type: "pipeline_stage",
    message: `Pipeline started for content ${contentItemId} — ${stages.length} stages, starting with ${firstStage}`,
    metadata: { contentItemId, stages },
  });

  return runId;
}
