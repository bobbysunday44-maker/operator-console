/* ── Opus AI Content Review ──
 * After pipeline assembly completes, Opus reviews the content.
 * Scores 1-10 on: hook strength, visual quality, audio clarity, CTA, platform fit.
 * Score >= 7 → moves to "review" for Bobby's approval.
 * Score < 7 → sends back to "idea" with improvement notes.
 */

import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/db/prisma";
import { getRequiredSetting } from "@/lib/db/settings";
import { logModelUsage } from "@/lib/queue/usage-logger";
import { notifyBobby } from "@/lib/notifications/telegram-notify";
import { eventBus } from "@/lib/events/event-bus";
import { readFile } from "fs/promises";

interface ReviewResult {
  score: number;
  notes: string;
  approved: boolean;
  breakdown: {
    hookStrength: number;
    visualQuality: number;
    audioClarity: number;
    ctaEffectiveness: number;
    platformFit: number;
  };
}

export async function reviewContent(contentItemId: string): Promise<ReviewResult> {
  const content = await prisma.contentItem.findUnique({
    where: { id: contentItemId },
    include: {
      pipelineRuns: { orderBy: { createdAt: "asc" } },
      assets: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!content) throw new Error(`Content ${contentItemId} not found`);

  // Gather all pipeline outputs for review
  let scriptText = content.script || "";
  const promptRun = content.pipelineRuns.find((r) => r.stage === "prompt");
  if (promptRun?.outputPath) {
    try {
      scriptText = await readFile(promptRun.outputPath, "utf-8");
    } catch { /* use content.script */ }
  }

  const imageAsset = content.assets.find((a) => a.type === "image");
  const videoAsset = content.assets.find((a) => a.type === "video");
  const audioAsset = content.assets.find((a) => a.type === "audio");

  // Build review context
  const reviewContext = [
    `Title: ${content.title}`,
    content.description ? `Description: ${content.description}` : null,
    `Target platforms: ${content.targetPlatforms.join(", ")}`,
    `Tags: ${content.tags.join(", ")}`,
    `Total cost: $${content.totalCost.toFixed(3)}`,
    ``,
    `--- SCRIPT ---`,
    scriptText,
    ``,
    `--- ASSETS ---`,
    imageAsset ? `Image: ${imageAsset.filePath} (${imageAsset.fileSize ? Math.round(imageAsset.fileSize / 1024) + "KB" : "unknown size"})` : "No image generated",
    videoAsset ? `Video: ${videoAsset.filePath} (${videoAsset.fileSize ? Math.round(videoAsset.fileSize / 1024 / 1024) + "MB" : "unknown size"})` : "No video generated",
    audioAsset ? `Audio: ${audioAsset.filePath}` : "No audio generated",
    ``,
    `--- PIPELINE RUNS ---`,
    ...content.pipelineRuns.map((r) => `${r.stage}: ${r.status} (${r.duration ? r.duration + "ms" : "—"}) cost: $${r.cost?.toFixed(3) || "0"}`),
  ].filter(Boolean).join("\n");

  const apiKey = await getRequiredSetting("ANTHROPIC_API_KEY");
  const client = new Anthropic({ apiKey });
  const startTime = Date.now();

  const response = await client.messages.create({
    model: "claude-opus-4-6",
    max_tokens: 1024,
    system: `You are Opus, the head operator of the OpenClaw content factory. You are reviewing content that just finished the generation pipeline.

Score each dimension 1-10 and give an overall score. Be strict — Bobby's reputation is on the line.

Respond in EXACTLY this JSON format:
{
  "hookStrength": <1-10>,
  "visualQuality": <1-10>,
  "audioClarity": <1-10>,
  "ctaEffectiveness": <1-10>,
  "platformFit": <1-10>,
  "overallScore": <1-10>,
  "verdict": "approve" | "redo",
  "notes": "<2-3 sentences on what's good and what needs work>"
}`,
    messages: [{
      role: "user",
      content: `Review this content:\n\n${reviewContext}`,
    }],
  });

  const latency = Date.now() - startTime;
  const textBlock = response.content.find((b) => b.type === "text");
  const rawReview = textBlock?.text || "{}";
  const tokensIn = response.usage.input_tokens;
  const tokensOut = response.usage.output_tokens;
  const cost = (tokensIn * 15 + tokensOut * 75) / 1_000_000;

  // Log usage
  await logModelUsage({
    model: "claude",
    taskType: "opus_review",
    tokensIn,
    tokensOut,
    cost,
    latency,
    success: true,
  });

  // Parse review
  let review: {
    hookStrength?: number;
    visualQuality?: number;
    audioClarity?: number;
    ctaEffectiveness?: number;
    platformFit?: number;
    overallScore?: number;
    verdict?: string;
    notes?: string;
  };

  try {
    // Extract JSON from response (may be wrapped in markdown code blocks)
    const jsonMatch = rawReview.match(/\{[\s\S]*\}/);
    review = JSON.parse(jsonMatch?.[0] || rawReview);
  } catch {
    review = { overallScore: 5, verdict: "redo", notes: "Failed to parse review response" };
  }

  const score = review.overallScore || 5;
  const approved = score >= 7 && review.verdict !== "redo";
  const notes = review.notes || "No notes provided";

  // Log review to activity log (NOT as a pipeline run — that would confuse image/video workers)
  await prisma.activityLog.create({
    data: {
      type: "success",
      message: `Opus review: ${contentItemId} scored ${score}/10`,
      source: "agent",
      metadata: { contentItemId, qualityScore: score, confidence: 0.85, notes, tokensIn, tokensOut, cost } as object,
    },
  });

  if (approved) {
    // Score >= 7 — move to review for Bobby's approval
    await prisma.contentItem.update({
      where: { id: contentItemId },
      data: { status: "review" },
    });

    eventBus.emit({
      type: "content_created",
      agentName: "Opus",
      message: `Content "${content.title}" scored ${score}/10 — ready for your approval`,
    });

    // Notify Bobby on Telegram
    await notifyBobby([
      `*Content Ready for Review*`,
      `Title: ${content.title}`,
      `Score: ${score}/10`,
      `Cost: $${content.totalCost.toFixed(3)}`,
      ``,
      `${notes}`,
      ``,
      `Approve in dashboard or reply \`/approve ${contentItemId}\``,
    ].join("\n"));
  } else {
    // Score < 7 — send back for redo
    await prisma.contentItem.update({
      where: { id: contentItemId },
      data: {
        status: "idea",
        description: `${content.description || ""}\n\n[Opus Review ${new Date().toISOString().split("T")[0]}] Score: ${score}/10 — ${notes}`,
      },
    });

    eventBus.emit({
      type: "error",
      agentName: "Opus",
      message: `Content "${content.title}" scored ${score}/10 — sent back for improvement`,
    });

    await notifyBobby([
      `*Content Rejected by Review*`,
      `Title: ${content.title}`,
      `Score: ${score}/10`,
      ``,
      `${notes}`,
      ``,
      `Sending back to pipeline for improvement.`,
    ].join("\n"));
  }

  return {
    score,
    notes,
    approved,
    breakdown: {
      hookStrength: review.hookStrength || 5,
      visualQuality: review.visualQuality || 5,
      audioClarity: review.audioClarity || 5,
      ctaEffectiveness: review.ctaEffectiveness || 5,
      platformFit: review.platformFit || 5,
    },
  };
}
