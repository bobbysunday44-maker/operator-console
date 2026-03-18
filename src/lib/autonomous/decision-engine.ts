/* ── Autonomous Decision Engine ──
 * Evaluates content for auto-approval based on rules.
 * Replaces manual Bobby approval when confidence is high enough.
 */

import { prisma } from "@/lib/db/prisma";
import { Prisma } from "@/generated/prisma/client";

interface DecisionResult {
  decision: "approved" | "rejected" | "escalated";
  reason: string;
  ruleId?: string;
  qualityScore?: number;
  confidence?: number;
}

export async function evaluateContent(contentItemId: string): Promise<DecisionResult> {
  const content = await prisma.contentItem.findUnique({ where: { id: contentItemId } });
  if (!content) return { decision: "escalated", reason: "Content not found" };

  const niche = content.niche || "";
  const rule = await prisma.autonomousRule.findFirst({
    where: { niche, isActive: true },
  });

  if (!rule) return { decision: "escalated", reason: "No autonomous rule configured for this niche" };

  // Always escalate if requireHumanReview is set
  if (rule.requireHumanReview) {
    return { decision: "escalated", reason: "Rule requires human review", ruleId: rule.id };
  }

  // Get REAL quality score from Opus review (stored in activity log or pipeline metadata)
  const latestRun = await prisma.pipelineRun.findFirst({
    where: { contentItemId, stage: "assembly", status: "completed" },
    orderBy: { completedAt: "desc" },
  });

  if (!latestRun) {
    const result: DecisionResult = {
      decision: "escalated",
      reason: "Pipeline not completed — no assembly stage found",
      ruleId: rule.id,
    };
    await logDecision(contentItemId, rule.id, result);
    return result;
  }

  // Read quality score from content metadata (set by opus-review.ts after scoring)
  const reviewLog = await prisma.activityLog.findFirst({
    where: {
      message: { contains: contentItemId },
      type: "success",
      source: "agent",
      metadata: { not: Prisma.JsonNull },
    },
    orderBy: { createdAt: "desc" },
  });

  // Extract score from review metadata, or escalate if no review happened
  const metadata = reviewLog?.metadata as Record<string, unknown> | null;
  const qualityScore = typeof metadata?.qualityScore === "number" ? metadata.qualityScore : undefined;
  const confidence = typeof metadata?.confidence === "number" ? metadata.confidence : undefined;

  if (qualityScore === undefined) {
    const result: DecisionResult = {
      decision: "escalated",
      reason: "No quality score from Opus review — content needs manual review",
      ruleId: rule.id,
    };
    await logDecision(contentItemId, rule.id, result);
    return result;
  }

  // Check quality threshold
  if (qualityScore < rule.minQualityScore) {
    const result: DecisionResult = {
      decision: "rejected",
      reason: `Quality score ${qualityScore} below threshold ${rule.minQualityScore}`,
      ruleId: rule.id,
      qualityScore,
      confidence,
    };
    await logDecision(contentItemId, rule.id, result);
    return result;
  }

  // Check confidence threshold
  if (!confidence || confidence < rule.confidenceThreshold) {
    const result: DecisionResult = {
      decision: "escalated",
      reason: `Confidence ${confidence ? Math.round(confidence * 100) : 0}% below threshold ${Math.round(rule.confidenceThreshold * 100)}%`,
      ruleId: rule.id,
      qualityScore,
      confidence,
    };
    await logDecision(contentItemId, rule.id, result);
    return result;
  }

  // Check daily cost
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayCost = await prisma.modelUsageLog.aggregate({
    where: { createdAt: { gte: today } },
    _sum: { cost: true },
  });
  if ((todayCost._sum.cost || 0) >= rule.maxDailyCost) {
    const result: DecisionResult = {
      decision: "escalated",
      reason: `Daily cost limit reached ($${todayCost._sum.cost?.toFixed(2)} / $${rule.maxDailyCost})`,
      ruleId: rule.id,
      qualityScore,
      confidence,
    };
    await logDecision(contentItemId, rule.id, result);
    return result;
  }

  // Check daily post count
  const todayPosts = await prisma.socialPost.count({
    where: { publishedAt: { gte: today }, status: "posted" },
  });
  if (todayPosts >= rule.maxDailyPosts) {
    const result: DecisionResult = {
      decision: "escalated",
      reason: `Daily post limit reached (${todayPosts} / ${rule.maxDailyPosts})`,
      ruleId: rule.id,
      qualityScore,
      confidence,
    };
    await logDecision(contentItemId, rule.id, result);
    return result;
  }

  // Check blocked topics
  const contentTags = content.tags.map((t) => t.toLowerCase());
  const blocked = rule.blockedTopics.find((topic) =>
    contentTags.includes(topic.toLowerCase()) || content.title.toLowerCase().includes(topic.toLowerCase())
  );
  if (blocked) {
    const result: DecisionResult = {
      decision: "escalated",
      reason: `Topic "${blocked}" requires human approval`,
      ruleId: rule.id,
      qualityScore,
      confidence,
    };
    await logDecision(contentItemId, rule.id, result);
    return result;
  }

  // All checks passed — approve
  const result: DecisionResult = {
    decision: "approved",
    reason: `Auto-approved: quality ${qualityScore}/10, confidence ${Math.round(confidence * 100)}%, within limits`,
    ruleId: rule.id,
    qualityScore,
    confidence,
  };
  await logDecision(contentItemId, rule.id, result);
  return result;
}

async function logDecision(contentItemId: string, ruleId: string, result: DecisionResult) {
  await prisma.autonomousDecision.create({
    data: {
      contentItemId,
      ruleId,
      decision: result.decision,
      reason: result.reason,
      qualityScore: result.qualityScore,
      confidence: result.confidence,
    },
  });
}

export async function getAutonomousStatus(niche: string) {
  const rule = await prisma.autonomousRule.findFirst({ where: { niche, isActive: true } });
  if (!rule) return { isActive: false, rule: null, todayCost: 0, todayPosts: 0, recentDecisions: [] };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayCost = await prisma.modelUsageLog.aggregate({
    where: { createdAt: { gte: today } },
    _sum: { cost: true },
  });

  const todayPosts = await prisma.socialPost.count({
    where: { publishedAt: { gte: today }, status: "posted" },
  });

  const recentDecisions = await prisma.autonomousDecision.findMany({
    where: { ruleId: rule.id },
    orderBy: { createdAt: "desc" },
    take: 10,
    include: { contentItem: { select: { title: true } } },
  });

  return {
    isActive: true,
    rule,
    todayCost: todayCost._sum.cost || 0,
    todayPosts,
    recentDecisions,
  };
}

export async function overrideDecision(decisionId: string, override: string, reason: string) {
  return prisma.autonomousDecision.update({
    where: { id: decisionId },
    data: { overriddenBy: "bobby", overrideReason: reason, decision: override },
  });
}
