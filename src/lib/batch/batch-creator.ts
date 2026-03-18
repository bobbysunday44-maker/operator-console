/* ── Batch Content Creator ──
 * Mass-create content items and optionally auto-start pipelines.
 * Supports: batch from trending topics, batch from templates, manual batch.
 */

import { prisma } from "@/lib/db/prisma";
import { startPipeline } from "@/lib/pipeline/orchestrator";
import { eventBus } from "@/lib/events/event-bus";

interface BatchItem {
  title: string;
  description?: string;
  niche?: string;
  tags?: string[];
  targetPlatforms?: string[];
}

interface BatchOptions {
  autoStartPipeline?: boolean;
  includeLipSync?: boolean;
  staggerMinutes?: number; // delay between pipeline starts to avoid overload
}

interface BatchResult {
  created: number;
  pipelinesStarted: number;
  contentIds: string[];
  errors: string[];
}

/** Create multiple content items at once and optionally start their pipelines */
export async function batchCreateContent(
  items: BatchItem[],
  options: BatchOptions = {}
): Promise<BatchResult> {
  const { autoStartPipeline = false, includeLipSync = false, staggerMinutes = 2 } = options;
  const result: BatchResult = { created: 0, pipelinesStarted: 0, contentIds: [], errors: [] };

  for (let i = 0; i < items.length; i++) {
    const item = items[i];

    try {
      const content = await prisma.contentItem.create({
        data: {
          title: item.title,
          description: item.description || null,
          niche: item.niche || null,
          tags: item.tags || [],
          targetPlatforms: item.targetPlatforms || [],
          status: "idea",
          qualityTier: "ai_reviewer",
          totalCost: 0,
        },
      });

      result.created++;
      result.contentIds.push(content.id);

      if (autoStartPipeline) {
        // Stagger pipeline starts to avoid overloading APIs
        if (i > 0 && staggerMinutes > 0) {
          await new Promise((resolve) => setTimeout(resolve, staggerMinutes * 60 * 1000));
        }
        await startPipeline(content.id, { includeLipSync });
        result.pipelinesStarted++;
      }
    } catch (err) {
      result.errors.push(`Failed to create "${item.title}": ${err instanceof Error ? err.message : "Unknown"}`);
    }
  }

  await prisma.activityLog.create({
    data: {
      type: "success",
      message: `Batch created: ${result.created} content items, ${result.pipelinesStarted} pipelines started`,
      source: "system",
    },
  });

  eventBus.emit({
    type: "task_completed",
    message: `Batch: ${result.created} items created, ${result.pipelinesStarted} pipelines queued`,
    metadata: { contentIds: result.contentIds },
  });

  return result;
}

/** Create batch from trending topics — pick top N topics per niche and create content */
export async function batchFromTrending(
  niche: string,
  count: number = 5,
  options: BatchOptions = {}
): Promise<BatchResult> {
  const topics = await prisma.trendingTopic.findMany({
    where: { niche, status: "new" },
    orderBy: { viralityScore: "desc" },
    take: count,
  });

  if (topics.length === 0) {
    return { created: 0, pipelinesStarted: 0, contentIds: [], errors: ["No trending topics found for this niche"] };
  }

  // Get default platforms for this niche
  const platforms = await prisma.platform.findMany({
    where: { connected: true, OR: [{ niche }, { niche: "" }] },
    select: { name: true },
  });
  const targetPlatforms = Array.from(new Set(platforms.map((p) => p.name)));

  const items: BatchItem[] = topics.map((topic) => ({
    title: topic.title,
    description: topic.contentAngle || topic.description || undefined,
    niche,
    tags: topic.tags,
    targetPlatforms,
  }));

  // Mark topics as used
  await prisma.trendingTopic.updateMany({
    where: { id: { in: topics.map((t) => t.id) } },
    data: { status: "selected" },
  });

  return batchCreateContent(items, options);
}

/** Generate batch from content calendar — create content for all planned calendar entries */
export async function batchFromCalendar(
  niche: string,
  options: BatchOptions = {}
): Promise<BatchResult> {
  const pendingEntries = await prisma.contentCalendar.findMany({
    where: { niche, status: "planned", contentItemId: null },
    include: { bucket: true, series: true },
    orderBy: { scheduledDate: "asc" },
    take: 14, // max 2 weeks
  });

  if (pendingEntries.length === 0) {
    return { created: 0, pipelinesStarted: 0, contentIds: [], errors: ["No planned calendar entries without content"] };
  }

  const platforms = await prisma.platform.findMany({
    where: { connected: true, OR: [{ niche }, { niche: "" }] },
    select: { name: true },
  });
  const targetPlatforms = Array.from(new Set(platforms.map((p) => p.name)));

  const items: BatchItem[] = pendingEntries.map((entry) => ({
    title: `${entry.bucket?.name || "content"} — ${new Date(entry.scheduledDate).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}`,
    description: entry.bucket?.description || undefined,
    niche,
    tags: [entry.bucket?.name || "content", entry.timeSlot || "general"].filter(Boolean),
    targetPlatforms,
  }));

  const result = await batchCreateContent(items, options);

  // Link created content to calendar entries
  for (let i = 0; i < result.contentIds.length && i < pendingEntries.length; i++) {
    await prisma.contentCalendar.update({
      where: { id: pendingEntries[i].id },
      data: { contentItemId: result.contentIds[i], status: "created" },
    });
  }

  return result;
}

/** Get batch job status — how many pipelines are running/completed/failed */
export async function getBatchStatus(contentIds: string[]) {
  const items = await prisma.contentItem.findMany({
    where: { id: { in: contentIds } },
    select: { id: true, title: true, status: true, totalCost: true },
  });

  const statuses = {
    total: items.length,
    idea: items.filter((i) => i.status === "idea").length,
    processing: items.filter((i) => ["scripting", "imaging", "filming", "voiceover", "assembly"].includes(i.status)).length,
    review: items.filter((i) => i.status === "review").length,
    approved: items.filter((i) => i.status === "approved").length,
    published: items.filter((i) => i.status === "published").length,
    failed: items.filter((i) => i.status === "failed").length,
    totalCost: items.reduce((sum, i) => sum + i.totalCost, 0),
  };

  return { items, statuses };
}
