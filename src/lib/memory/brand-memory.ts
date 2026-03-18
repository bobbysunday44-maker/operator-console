/* ── Brand Memory ──
 * Persistent memory of what works and what doesn't per niche.
 * Feeds insights into the Writer's prompt for continuous improvement.
 */

import { prisma } from "@/lib/db/prisma";

export async function recordInsight(
  niche: string,
  category: string,
  insight: string,
  source = "performance",
  isPositive = true
) {
  // Check for similar existing insight
  const existing = await prisma.brandMemory.findFirst({
    where: {
      niche,
      category,
      insight: { contains: insight.slice(0, 50) },
    },
  });

  if (existing) {
    return prisma.brandMemory.update({
      where: { id: existing.id },
      data: {
        timesValidated: existing.timesValidated + 1,
        confidence: Math.min(100, existing.confidence + 5),
      },
    });
  }

  return prisma.brandMemory.create({
    data: { niche, category, insight, source, isPositive, confidence: 50 },
  });
}

export async function getMemoryForPrompt(niche: string): Promise<string> {
  const memories = await prisma.brandMemory.findMany({
    where: { niche, confidence: { gt: 40 } },
    orderBy: { confidence: "desc" },
    take: 20,
  });

  if (memories.length === 0) return "";

  const positive = memories.filter((m) => m.isPositive);
  const negative = memories.filter((m) => !m.isPositive);

  const categories = new Set(memories.map((m) => m.category));
  let prompt = "BRAND MEMORY (learned from past performance):\n";

  for (const cat of Array.from(categories)) {
    const catPositive = positive.filter((m) => m.category === cat);
    const catNegative = negative.filter((m) => m.category === cat);

    if (catPositive.length > 0 || catNegative.length > 0) {
      prompt += `\n[${cat.toUpperCase()}]\n`;
      for (const m of catPositive) {
        prompt += `  DO: ${m.insight} (confidence: ${Math.round(m.confidence)}%)\n`;
      }
      for (const m of catNegative) {
        prompt += `  AVOID: ${m.insight} (confidence: ${Math.round(m.confidence)}%)\n`;
      }
    }
  }

  return prompt;
}

export async function learnFromPerformance(niche: string) {
  const learnings = await prisma.performanceLearning.findMany({
    where: { niche, timesUsed: { gte: 3 } },
    orderBy: { winRate: "desc" },
  });

  let created = 0;
  for (const l of learnings) {
    if (l.winRate > 0.6) {
      await recordInsight(niche, l.category, l.insight || l.pattern, "performance", true);
      created++;
    } else if (l.winRate < 0.3) {
      await recordInsight(niche, l.category, l.insight || l.pattern, "performance", false);
      created++;
    }
  }

  return created;
}

export async function forgetLowConfidence() {
  const deleted = await prisma.brandMemory.deleteMany({
    where: { confidence: { lt: 20 }, timesValidated: { lt: 2 } },
  });
  if (deleted.count > 0) {
    console.log(`[BrandMemory] Cleaned up ${deleted.count} low-confidence memories`);
  }
  return deleted.count;
}
