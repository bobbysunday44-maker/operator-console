/* POST /api/workflows/[id]/run — Execute a visual workflow
 * Creates a ContentItem from the workflow, then starts the real pipeline.
 * Each node type maps to a real pipeline stage with real API calls.
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { startPipeline } from "@/lib/pipeline/orchestrator";

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const workflow = await prisma.workflow.findUnique({ where: { id } });
  if (!workflow) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const nodes = workflow.nodes as Array<{ id: string; type: string; data: Record<string, unknown> }>;

  // Extract content info from workflow nodes
  const contentNode = nodes.find((n) => n.type === "content");
  const charNode = nodes.find((n) => n.type === "character");
  const hasLipSync = nodes.some((n) => n.type === "lipSync");

  // Determine target platforms from node data
  const platforms = (contentNode?.data?.platforms as string[]) || [];
  const niche = (contentNode?.data?.niche as string) || (charNode?.data?.niche as string) || "";
  const title = (contentNode?.data?.title as string) || "Visual Editor Content";
  const description = (contentNode?.data?.description as string) || "";

  // Create a real ContentItem from the workflow
  const content = await prisma.contentItem.create({
    data: {
      title,
      description: description || null,
      niche: niche || null,
      tags: ["visual-editor", `workflow:${workflow.name}`],
      targetPlatforms: platforms,
      status: "idea",
      qualityTier: "ai_reviewer",
      totalCost: 0,
    },
  });

  // Create a workflow run record
  const run = await prisma.workflowRun.create({
    data: {
      workflowId: id,
      status: "running",
      nodeOutputs: { contentItemId: content.id },
    },
  });

  // Update workflow lastRunAt
  await prisma.workflow.update({
    where: { id },
    data: { lastRunAt: new Date() },
  });

  // Start the REAL pipeline — this queues actual API calls to Claude, Gemini, Kling, Qwen3-TTS, FFmpeg
  try {
    const pipelineRunId = await startPipeline(content.id, { includeLipSync: hasLipSync });

    // Log activity
    await prisma.activityLog.create({
      data: {
        type: "success",
        message: `Visual Editor: started pipeline for "${title}" (workflow: ${workflow.name})`,
        source: "studio",
      },
    });

    return NextResponse.json({
      run: {
        id: run.id,
        workflowId: id,
        status: "running",
        contentItemId: content.id,
        pipelineRunId,
        message: `Pipeline started with ${hasLipSync ? 6 : 5} stages. Track progress in Creation Studio.`,
      },
    });
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Pipeline start failed";

    await prisma.workflowRun.update({
      where: { id: run.id },
      data: { status: "failed", error: errorMsg, completedAt: new Date() },
    });

    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
