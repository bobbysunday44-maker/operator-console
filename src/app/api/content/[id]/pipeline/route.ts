/* GET /api/content/[id]/pipeline — Get pipeline runs for content
 * POST /api/content/[id]/pipeline — Create a new pipeline run (trigger a stage)
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import type { PipelineStage, ModelProvider, TaskStatus, ContentStatus } from "@/generated/prisma/client";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const runs = await prisma.pipelineRun.findMany({
    where: { contentItemId: id },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ runs });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { stage, model, inputPrompt, status, outputPath, outputPreview, tokensIn, tokensOut, cost, duration, error } = body as {
    stage?: string;
    model?: string;
    inputPrompt?: string;
    status?: string;
    outputPath?: string;
    outputPreview?: string;
    tokensIn?: number;
    tokensOut?: number;
    cost?: number;
    duration?: number;
    error?: string;
  };

  if (!stage || !model) {
    return NextResponse.json({ error: "stage and model are required" }, { status: 400 });
  }

  // Check content exists
  const content = await prisma.contentItem.findUnique({ where: { id } });
  if (!content) {
    return NextResponse.json({ error: "Content not found" }, { status: 404 });
  }

  const run = await prisma.pipelineRun.create({
    data: {
      contentItemId: id,
      stage: stage as PipelineStage,
      model: model as ModelProvider,
      status: (status as TaskStatus) || "pending",
      inputPrompt: inputPrompt ?? null,
      outputPath: outputPath ?? null,
      outputPreview: outputPreview ?? null,
      tokensIn: tokensIn ?? null,
      tokensOut: tokensOut ?? null,
      cost: cost ?? null,
      duration: duration ?? null,
      error: error ?? null,
      completedAt: status === "completed" ? new Date() : null,
    },
  });

  // Update content status + cost in a single query
  const stageStatusMap: Record<string, string> = {
    prompt: "scripting",
    image: "imaging",
    video: "filming",
    voiceover: "voiceover",
    assembly: "assembly",
    lip_sync: "filming",
  };
  const newStatus = stageStatusMap[stage];
  const updateData: Record<string, unknown> = {};
  if (newStatus) updateData.status = newStatus as ContentStatus;
  if (cost) updateData.totalCost = { increment: cost };

  if (Object.keys(updateData).length > 0) {
    await prisma.contentItem.update({ where: { id }, data: updateData });
  }

  return NextResponse.json({ run }, { status: 201 });
}
