/* ── Agent Learning Engine ──
 * Feeds performance results back to agents as memories.
 * Enables cross-agent learning, error tracking, and skill evolution.
 *
 * Usage:
 *   import { feedPerformanceToAgents, crossAgentLearning, recordError, recordSuccess } from "@/lib/agent-runtime/learning-engine";
 */

import { prisma } from "@/lib/db/prisma";
import { getRequiredSetting } from "@/lib/db/settings";
import { addMemory } from "./memory-stream";
import Anthropic from "@anthropic-ai/sdk";

// ── Helpers ──

async function getClaudeClient(): Promise<Anthropic> {
  const apiKey = await getRequiredSetting("ANTHROPIC_API_KEY");
  return new Anthropic({ apiKey });
}

/**
 * Map agent type to the pipeline stage they work on.
 * Used to find which agents contributed to a content item.
 */
function agentTypeToStage(agentType: string): string | null {
  const map: Record<string, string> = {
    writer: "prompt",
    designer: "image",
    filmmaker: "video",
    editor: "assembly",
  };
  return map[agentType] ?? null;
}

// ── Core Learning Functions ──

/**
 * When content performs well or badly, feed the performance data
 * back to each agent that worked on it as a memory.
 */
export async function feedPerformanceToAgents(contentItemId: string): Promise<number> {
  try {
    // Get the content item with its performance data
    const contentItem = await prisma.contentItem.findUnique({
      where: { id: contentItemId },
      include: {
        socialPosts: {
          include: {
            performances: { orderBy: { capturedAt: "desc" }, take: 1 },
            platform: { select: { name: true } },
          },
        },
        pipelineRuns: {
          where: { status: "completed" },
          select: { stage: true },
        },
      },
    });

    if (!contentItem) return 0;

    // Aggregate performance across all posts for this content
    let totalViews = 0;
    let totalEngagement = 0;
    const platforms: string[] = [];

    for (const post of contentItem.socialPosts) {
      if (post.performances.length === 0) continue;
      const perf = post.performances[0];
      totalViews += perf.views;
      totalEngagement += perf.likes + perf.comments + perf.shares + perf.saves;
      if (post.platform) platforms.push(post.platform.name);
    }

    if (totalViews === 0) return 0;

    const engagementRate = (totalEngagement / totalViews) * 100;

    // Calculate average engagement across all content to compare
    const allPerformances = await prisma.contentPerformance.findMany({
      where: { capturedAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
      select: { views: true, likes: true, comments: true, shares: true, saves: true },
      take: 200,
    });

    let avgEngagement = 3; // default 3% if no data
    if (allPerformances.length > 5) {
      const totalAvgEng = allPerformances.reduce((sum, p) => {
        if (p.views === 0) return sum;
        return sum + ((p.likes + p.comments + p.shares + p.saves) / p.views) * 100;
      }, 0);
      avgEngagement = totalAvgEng / allPerformances.length;
    }

    // Determine performance level
    const ratio = engagementRate / avgEngagement;
    let performanceLabel: string;
    let importance: number;
    let reason: string;

    if (ratio >= 2) {
      performanceLabel = "performed exceptionally well";
      importance = Math.min(9, Math.round(7 + ratio));
      reason = `engagement ${engagementRate.toFixed(1)}% was ${ratio.toFixed(1)}x the average`;
    } else if (ratio >= 1.3) {
      performanceLabel = "performed above average";
      importance = 7;
      reason = `engagement ${engagementRate.toFixed(1)}% beat the ${avgEngagement.toFixed(1)}% average`;
    } else if (ratio <= 0.5) {
      performanceLabel = "underperformed significantly";
      importance = 7; // learn from failure
      reason = `engagement ${engagementRate.toFixed(1)}% was well below the ${avgEngagement.toFixed(1)}% average`;
    } else if (ratio <= 0.8) {
      performanceLabel = "performed below average";
      importance = 6;
      reason = `engagement ${engagementRate.toFixed(1)}% was below the ${avgEngagement.toFixed(1)}% average`;
    } else {
      performanceLabel = "performed around average";
      importance = 5;
      reason = `engagement ${engagementRate.toFixed(1)}% was near the ${avgEngagement.toFixed(1)}% average`;
    }

    // Extract hook from script if available
    let hookInfo = "";
    if (contentItem.script) {
      try {
        const hookMatch = contentItem.script.match(/"textHook":\s*"([^"]+)"/);
        if (hookMatch) {
          hookInfo = ` The hook was "${hookMatch[1]}".`;
        }
      } catch {
        // Script might not be JSON — ignore
      }
    }

    // Find all agents and match them to the stages this content went through
    const completedStages = contentItem.pipelineRuns.map((r) => r.stage);
    const allAgents = await prisma.agent.findMany({
      where: { status: { not: "offline" } },
      select: { id: true, name: true, type: true },
    });

    let memoriesCreated = 0;

    for (const agent of allAgents) {
      const stage = agentTypeToStage(agent.type);
      // Check if this agent's work type is relevant to the content
      const isRelevant =
        (stage && completedStages.includes(stage as never)) ||
        agent.type === "social" || // social agent cares about all posted content
        agent.type === "ideator"; // ideator cares about content performance too

      if (!isRelevant) continue;

      const roleDescription =
        agent.type === "writer" ? "wrote the script for" :
        agent.type === "designer" ? "created the image for" :
        agent.type === "filmmaker" ? "produced the video for" :
        agent.type === "editor" ? "assembled" :
        agent.type === "social" ? "posted" :
        agent.type === "ideator" ? "ideated" :
        "worked on";

      const memoryContent = `The content I ${roleDescription} "${contentItem.title}" got ${totalViews.toLocaleString()} views and ${engagementRate.toFixed(1)}% engagement on ${platforms.join(", ") || "social media"}. It ${performanceLabel} because ${reason}.${hookInfo}`;

      await addMemory(
        agent.id,
        memoryContent,
        "feedback",
        importance,
        "performance-tracker",
        contentItemId,
        ["performance", performanceLabel.includes("well") || performanceLabel.includes("above") ? "success" : "underperformed"]
      );
      memoriesCreated++;
    }

    console.log(
      `[Learning] Fed performance for "${contentItem.title}" to ${memoriesCreated} agents (${performanceLabel})`
    );
    return memoriesCreated;
  } catch (err) {
    console.error("[Learning] feedPerformanceToAgents failed:", err);
    return 0;
  }
}

/**
 * When one agent discovers something useful for another agent,
 * create a cross-agent learning memory.
 */
export async function crossAgentLearning(
  fromAgentId: string,
  toAgentId: string,
  insight: string
): Promise<string | null> {
  try {
    // Get the source agent's name
    const fromAgent = await prisma.agent.findUnique({
      where: { id: fromAgentId },
      select: { name: true },
    });

    if (!fromAgent) {
      console.error(`[Learning] Source agent ${fromAgentId} not found`);
      return null;
    }

    const memoryContent = `${fromAgent.name} shared: ${insight}`;

    const memoryId = await addMemory(
      toAgentId,
      memoryContent,
      "conversation",
      6,
      fromAgentId,
      fromAgentId,
      ["cross-learning", "shared-insight"]
    );

    console.log(`[Learning] ${fromAgent.name} shared insight with agent ${toAgentId}`);
    return memoryId;
  } catch (err) {
    console.error("[Learning] crossAgentLearning failed:", err);
    return null;
  }
}

/**
 * Record an error that an agent should remember and avoid in the future.
 */
export async function recordError(
  agentId: string,
  error: string,
  context: string
): Promise<string | null> {
  try {
    const memoryContent = `ERROR: ${error}. Context: ${context}. I should avoid this in the future.`;

    const memoryId = await addMemory(
      agentId,
      memoryContent,
      "feedback",
      8, // errors are important to remember
      "system",
      undefined,
      ["error", "avoid"]
    );

    console.log(`[Learning] Recorded error for agent ${agentId}: ${error.slice(0, 80)}`);
    return memoryId;
  } catch (err) {
    console.error("[Learning] recordError failed:", err);
    return null;
  }
}

/**
 * Record a success pattern that an agent should repeat.
 */
export async function recordSuccess(
  agentId: string,
  pattern: string,
  result: string
): Promise<string | null> {
  try {
    const memoryContent = `SUCCESS: ${pattern} led to ${result}. I should do more of this.`;

    const memoryId = await addMemory(
      agentId,
      memoryContent,
      "feedback",
      7,
      "system",
      undefined,
      ["success", "repeat"]
    );

    console.log(`[Learning] Recorded success for agent ${agentId}: ${pattern.slice(0, 80)}`);
    return memoryId;
  } catch (err) {
    console.error("[Learning] recordSuccess failed:", err);
    return null;
  }
}

/**
 * Called weekly. Analyzes an agent's memories to identify what they're good at,
 * what they struggle with, and updates their personality with learned preferences.
 */
export async function evolveSkills(agentId: string): Promise<string | null> {
  try {
    const agent = await prisma.agent.findUnique({
      where: { id: agentId },
      select: { id: true, name: true, type: true, personality: true },
    });

    if (!agent) return null;

    // Get recent feedback memories (last 7 days)
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const feedbackMemories = await prisma.agentMemoryEntry.findMany({
      where: {
        agentId,
        type: "feedback",
        createdAt: { gte: weekAgo },
      },
      orderBy: { importance: "desc" },
      take: 30,
    });

    if (feedbackMemories.length < 3) {
      console.log(`[Learning] Not enough feedback memories for ${agent.name} to evolve (${feedbackMemories.length})`);
      return null;
    }

    // Separate successes and errors
    const successes = feedbackMemories.filter((m) => m.tags.includes("success") || m.tags.includes("repeat"));
    const errors = feedbackMemories.filter((m) => m.tags.includes("error") || m.tags.includes("avoid"));
    // Build analysis prompt
    const memoryText = feedbackMemories
      .map((m, i) => `${i + 1}. [${m.tags.join(", ")}] ${m.content}`)
      .join("\n");

    const client = await getClaudeClient();
    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 600,
      messages: [
        {
          role: "user",
          content: `You are ${agent.name}, the ${agent.type} at OpenClaw (an AI content factory). Review your recent feedback and experiences from the past week.

Recent feedback (${feedbackMemories.length} entries, ${successes.length} successes, ${errors.length} errors):
${memoryText}

Based on this feedback, write a brief personal reflection (2-4 sentences) covering:
1. What patterns lead to your best work
2. What mistakes to avoid
3. One specific thing to try differently next week

Be specific and personal. Reference actual content titles or patterns from the feedback.`,
        },
      ],
    });

    const reflection =
      response.content[0].type === "text"
        ? response.content[0].text.trim()
        : "No reflection generated.";

    // Store the evolution reflection as a high-importance memory
    await addMemory(
      agentId,
      `[Weekly Reflection] After reviewing my recent work, I've learned: ${reflection}`,
      "reflection",
      8, // weekly reflections are important
      "self",
      undefined,
      ["evolution", "weekly-reflection"]
    );

    // If there are clear patterns, append to agent personality
    if (successes.length >= 2 || errors.length >= 2) {
      const currentPersonality = agent.personality || "";
      const hasLearnings = currentPersonality.includes("[Learned Preferences]");

      // Build a compact learned preferences block
      const learnedBlock = `\n\n[Learned Preferences - Updated ${new Date().toISOString().split("T")[0]}]\n${reflection.slice(0, 500)}`;

      let updatedPersonality: string;
      if (hasLearnings) {
        // Replace existing learned preferences
        updatedPersonality = currentPersonality.replace(
          /\n\n\[Learned Preferences[^\]]*\][^]*$/,
          learnedBlock
        );
      } else {
        updatedPersonality = currentPersonality + learnedBlock;
      }

      await prisma.agent.update({
        where: { id: agentId },
        data: { personality: updatedPersonality },
      });
    }

    console.log(`[Learning] ${agent.name} evolved skills — ${successes.length} successes, ${errors.length} errors analyzed`);
    return reflection;
  } catch (err) {
    console.error("[Learning] evolveSkills failed:", err);
    return null;
  }
}

/**
 * Generate a weekly learning report for Bobby.
 * Summarizes what each agent learned, team patterns, and recommendations.
 */
export async function generateWeeklyLearningReport(): Promise<string> {
  try {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    // Get all active agents
    const agents = await prisma.agent.findMany({
      where: { status: { not: "offline" } },
      select: { id: true, name: true, type: true },
    });

    // Gather feedback memories per agent
    const agentSummaries: string[] = [];
    let totalSuccesses = 0;
    let totalErrors = 0;
    let totalFeedback = 0;

    for (const agent of agents) {
      const memories = await prisma.agentMemoryEntry.findMany({
        where: {
          agentId: agent.id,
          type: "feedback",
          createdAt: { gte: weekAgo },
        },
        orderBy: { importance: "desc" },
        take: 10,
      });

      if (memories.length === 0) continue;

      const successes = memories.filter((m) => m.tags.includes("success") || m.tags.includes("repeat"));
      const errors = memories.filter((m) => m.tags.includes("error") || m.tags.includes("avoid"));

      totalSuccesses += successes.length;
      totalErrors += errors.length;
      totalFeedback += memories.length;

      const topMemories = memories.slice(0, 3).map((m) => `  - ${m.content.slice(0, 150)}`).join("\n");
      agentSummaries.push(`${agent.name} (${agent.type}): ${memories.length} learnings, ${successes.length} wins, ${errors.length} errors\n${topMemories}`);
    }

    if (totalFeedback === 0) {
      const emptyReport = "Weekly Learning Report: No feedback data collected this week. Content needs to be posted and tracked before learning can begin.";
      console.log(`[Learning] ${emptyReport}`);
      return emptyReport;
    }

    // Get performance learnings from the feedback engine
    const topLearnings = await prisma.performanceLearning.findMany({
      where: { timesUsed: { gte: 3 } },
      orderBy: { winRate: "desc" },
      take: 10,
    });

    const topPatternsText = topLearnings.length > 0
      ? topLearnings.map((l) => `- [${l.category}] ${l.pattern}: ${l.insight || "no insight"} (${Math.round(l.winRate * 100)}% win rate)`).join("\n")
      : "No patterns with enough data yet.";

    // Generate report via Claude
    const client = await getClaudeClient();
    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 800,
      messages: [
        {
          role: "user",
          content: `Generate a concise weekly learning report for the OpenClaw team. Format it as a brief executive summary for Bobby (the operator).

Agent Summaries:
${agentSummaries.join("\n\n")}

Top Patterns:
${topPatternsText}

Stats: ${totalFeedback} total learnings, ${totalSuccesses} successes, ${totalErrors} errors across ${agents.length} agents.

Write a report with:
1. Key Wins (what worked well)
2. Key Lessons (what to avoid)
3. Team-Wide Patterns (content types, timing, hooks that work)
4. Recommendations for Next Week (2-3 actionable items)

Keep it under 400 words. Be specific, not generic.`,
        },
      ],
    });

    const report =
      response.content[0].type === "text"
        ? response.content[0].text.trim()
        : "Failed to generate report.";

    // Store the report as a memory for all agents so they all know the team context
    for (const agent of agents) {
      try {
        await addMemory(
          agent.id,
          `[Weekly Team Report] ${report.slice(0, 800)}`,
          "feedback",
          6,
          "system",
          undefined,
          ["weekly-report", "team-learning"]
        );
      } catch {
        // Non-critical — continue with other agents
      }
    }

    // Log to activity feed
    try {
      await prisma.activityLog.create({
        data: {
          type: "info",
          message: `Weekly Learning Report generated: ${totalFeedback} learnings, ${totalSuccesses} successes, ${totalErrors} errors`,
          source: "learning-engine",
          metadata: { totalFeedback, totalSuccesses, totalErrors, agentCount: agents.length },
        },
      });
    } catch {
      // Non-critical
    }

    console.log(`[Learning] Weekly report generated — ${totalFeedback} learnings, ${totalSuccesses} successes, ${totalErrors} errors`);
    return report;
  } catch (err) {
    console.error("[Learning] generateWeeklyLearningReport failed:", err);
    return "Failed to generate weekly learning report.";
  }
}

/**
 * Background worker function. Finds content with new performance data
 * that hasn't been fed back to agents yet. Runs every 2 hours.
 */
export async function processPerformanceFeedback(): Promise<number> {
  try {
    // Find content performances captured in the last 4 hours
    // that haven't been processed (no agent feedback memories about them)
    const recentPerformances = await prisma.contentPerformance.findMany({
      where: {
        capturedAt: { gte: new Date(Date.now() - 4 * 60 * 60 * 1000) },
        views: { gt: 0 },
      },
      include: {
        post: {
          select: { contentItemId: true },
        },
      },
      take: 50,
    });

    if (recentPerformances.length === 0) return 0;

    // Deduplicate by contentItemId
    const contentItemIds = new Set<string>();
    for (const perf of recentPerformances) {
      if (perf.post.contentItemId) {
        contentItemIds.add(perf.post.contentItemId);
      }
    }

    let processed = 0;

    for (const contentItemId of Array.from(contentItemIds)) {
      // Check if we already created feedback memories for this content item recently
      const existingFeedback = await prisma.agentMemoryEntry.findFirst({
        where: {
          type: "feedback",
          relatedTo: contentItemId,
          tags: { has: "performance" },
          createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        },
      });

      if (existingFeedback) continue; // already processed recently

      const count = await feedPerformanceToAgents(contentItemId);
      if (count > 0) processed++;
    }

    if (processed > 0) {
      console.log(`[Learning] Processed performance feedback for ${processed} content items`);
    }
    return processed;
  } catch (err) {
    console.error("[Learning] processPerformanceFeedback failed:", err);
    return 0;
  }
}

/**
 * Get learning stats for all agents — used by the /api/learning endpoint.
 */
export async function getLearningStats(): Promise<{
  totalMemories: number;
  totalReflections: number;
  totalErrors: number;
  totalSuccesses: number;
  perAgent: Array<{
    agentId: string;
    agentName: string;
    agentType: string;
    feedbackCount: number;
    errorCount: number;
    successCount: number;
    reflectionCount: number;
    lastLearning: Date | null;
  }>;
}> {
  try {
    const agents = await prisma.agent.findMany({
      where: { status: { not: "offline" } },
      select: { id: true, name: true, type: true },
    });

    let totalMemories = 0;
    let totalReflections = 0;
    let totalErrors = 0;
    let totalSuccesses = 0;

    const perAgent: Array<{
      agentId: string;
      agentName: string;
      agentType: string;
      feedbackCount: number;
      errorCount: number;
      successCount: number;
      reflectionCount: number;
      lastLearning: Date | null;
    }> = [];

    for (const agent of agents) {
      const [feedbackCount, errorCount, successCount, reflectionCount, lastMemory] =
        await Promise.all([
          prisma.agentMemoryEntry.count({
            where: { agentId: agent.id, type: "feedback" },
          }),
          prisma.agentMemoryEntry.count({
            where: { agentId: agent.id, tags: { has: "error" } },
          }),
          prisma.agentMemoryEntry.count({
            where: { agentId: agent.id, tags: { has: "success" } },
          }),
          prisma.agentReflection.count({
            where: { agentId: agent.id },
          }),
          prisma.agentMemoryEntry.findFirst({
            where: { agentId: agent.id, type: "feedback" },
            orderBy: { createdAt: "desc" },
            select: { createdAt: true },
          }),
        ]);

      totalMemories += feedbackCount;
      totalReflections += reflectionCount;
      totalErrors += errorCount;
      totalSuccesses += successCount;

      perAgent.push({
        agentId: agent.id,
        agentName: agent.name,
        agentType: agent.type,
        feedbackCount,
        errorCount,
        successCount,
        reflectionCount,
        lastLearning: lastMemory?.createdAt ?? null,
      });
    }

    return { totalMemories, totalReflections, totalErrors, totalSuccesses, perAgent };
  } catch (err) {
    console.error("[Learning] getLearningStats failed:", err);
    return { totalMemories: 0, totalReflections: 0, totalErrors: 0, totalSuccesses: 0, perAgent: [] };
  }
}
