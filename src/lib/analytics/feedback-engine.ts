/* ── Feedback Engine ──
 * Learns from content performance. Identifies winning patterns.
 * Feeds insights back into the Writer's prompt for continuous improvement.
 */

import { prisma } from "@/lib/db/prisma";

export async function generateLearnings(niche: string): Promise<number> {
  const performances = await prisma.contentPerformance.findMany({
    where: { post: { contentItem: { niche } } },
    include: {
      post: { include: { contentItem: true, platform: true } },
    },
    orderBy: { capturedAt: "desc" },
    take: 200,
  });

  if (performances.length < 5) return 0;

  // Calculate average engagement
  const avgEngagement = performances.reduce((sum, p) => {
    const total = p.likes + p.comments + p.shares + p.saves;
    return sum + (p.views > 0 ? (total / p.views) * 100 : 0);
  }, 0) / performances.length;

  let learnings = 0;

  // Analyze hook patterns
  const hookGroups = new Map<string, { wins: number; total: number; avgEng: number }>();
  for (const p of performances) {
    const script = p.post.contentItem?.script || "";
    const hookMatch = script.match(/"hookVariants".*?"textHook":\s*"([^"]+)"/);
    if (!hookMatch) continue;

    const hook = hookMatch[1];
    const hookType = hook.startsWith("POV:") ? "POV:" :
      hook.startsWith("Did you know") ? "Question:" :
      hook.startsWith("Stop") ? "Command:" :
      hook.includes("?") ? "Question:" : "Statement:";

    const eng = p.views > 0 ? ((p.likes + p.comments + p.shares + p.saves) / p.views) * 100 : 0;
    const group = hookGroups.get(hookType) || { wins: 0, total: 0, avgEng: 0 };
    group.total++;
    group.avgEng = (group.avgEng * (group.total - 1) + eng) / group.total;
    if (eng > avgEngagement) group.wins++;
    hookGroups.set(hookType, group);
  }

  for (const [pattern, data] of Array.from(hookGroups.entries())) {
    if (data.total < 3) continue;
    const winRate = data.wins / data.total;

    await prisma.performanceLearning.create({
      data: {
        performanceId: performances[0].id,
        niche,
        category: "hook_pattern",
        pattern: `${pattern} hooks`,
        avgEngagement: data.avgEng,
        timesUsed: data.total,
        timesWon: data.wins,
        winRate,
        insight: winRate > 0.6
          ? `${pattern} hooks outperform average by ${Math.round((data.avgEng / avgEngagement - 1) * 100)}%. Use more.`
          : `${pattern} hooks underperform. Consider alternatives.`,
        isPositive: winRate > 0.5,
      },
    });
    learnings++;
  }

  // Analyze posting times
  const timeGroups = new Map<number, { wins: number; total: number; avgEng: number }>();
  for (const p of performances) {
    if (!p.post.publishedAt) continue;
    const hour = p.post.publishedAt.getHours();
    const eng = p.views > 0 ? ((p.likes + p.comments + p.shares + p.saves) / p.views) * 100 : 0;
    const group = timeGroups.get(hour) || { wins: 0, total: 0, avgEng: 0 };
    group.total++;
    group.avgEng = (group.avgEng * (group.total - 1) + eng) / group.total;
    if (eng > avgEngagement) group.wins++;
    timeGroups.set(hour, group);
  }

  for (const [hour, data] of Array.from(timeGroups.entries())) {
    if (data.total < 3) continue;
    const winRate = data.wins / data.total;
    const period = hour < 12 ? "morning" : hour < 17 ? "afternoon" : "evening";

    await prisma.performanceLearning.create({
      data: {
        performanceId: performances[0].id,
        niche,
        category: "posting_time",
        pattern: `${hour}:00 (${period})`,
        avgEngagement: data.avgEng,
        timesUsed: data.total,
        timesWon: data.wins,
        winRate,
        insight: winRate > 0.6
          ? `Posting at ${hour}:00 (${period}) gets ${Math.round(data.avgEng)}% engagement. Best time slot.`
          : `${hour}:00 (${period}) underperforms. Avoid this time.`,
        isPositive: winRate > 0.5,
      },
    });
    learnings++;
  }

  console.log(`[Feedback] Generated ${learnings} learnings for niche "${niche}"`);
  return learnings;
}

export async function getLearningsForPrompt(niche: string): Promise<string> {
  const learnings = await prisma.performanceLearning.findMany({
    where: { niche, winRate: { gt: 0.4 }, timesUsed: { gte: 3 } },
    orderBy: { winRate: "desc" },
    take: 15,
  });

  if (learnings.length === 0) return "";

  const positive = learnings.filter((l) => l.isPositive);
  const negative = learnings.filter((l) => !l.isPositive);

  let prompt = "PERFORMANCE INSIGHTS (learned from past content):\n";

  if (positive.length > 0) {
    prompt += "DO MORE OF:\n";
    for (const l of positive) {
      prompt += `- ${l.insight} (${Math.round(l.winRate * 100)}% win rate, ${l.timesUsed} posts)\n`;
    }
  }

  if (negative.length > 0) {
    prompt += "AVOID:\n";
    for (const l of negative) {
      prompt += `- ${l.insight}\n`;
    }
  }

  return prompt;
}

export async function getTopPatterns(niche: string, category: string, limit = 5) {
  return prisma.performanceLearning.findMany({
    where: { niche, category, isPositive: true },
    orderBy: { winRate: "desc" },
    take: limit,
  });
}
