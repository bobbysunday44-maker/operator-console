/* ── Agent Memory Stream ──
 * Generative agents memory system — stores, retrieves, and reflects on memories.
 * Based on Park et al. "Generative Agents" architecture:
 * memory stream + importance rating + retrieval (recency × importance × relevance) + reflection.
 *
 * Usage:
 *   import { addMemory, retrieveMemories, reflect, getMemoryPrompt } from "@/lib/agent-runtime/memory-stream";
 */

import { prisma } from "@/lib/db/prisma";
import { getRequiredSetting } from "@/lib/db/settings";
import Anthropic from "@anthropic-ai/sdk";

// ── Types ──

interface MemoryWithScore {
  id: string;
  content: string;
  type: string;
  importance: number;
  source: string | null;
  relatedTo: string | null;
  tags: string[];
  createdAt: Date;
  score: number;
}

// ── Helpers ──

async function getClaudeClient(): Promise<Anthropic> {
  const apiKey = await getRequiredSetting("ANTHROPIC_API_KEY");
  return new Anthropic({ apiKey });
}

/**
 * Rate the importance of a memory content using Claude.
 * Returns a number 1-10.
 */
export async function rateImportance(content: string): Promise<number> {
  try {
    const client = await getClaudeClient();
    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 10,
      messages: [
        {
          role: "user",
          content: `Rate the importance of this experience for an AI agent working at a content factory on a scale of 1-10. 1=routine (checking emails, idle time), 5=notable (finishing a task, having a good conversation), 10=critical (landing a major deal, content going viral, a serious error). Return ONLY a number.\n\nExperience: "${content}"`,
        },
      ],
    });

    const text =
      response.content[0].type === "text" ? response.content[0].text.trim() : "5";
    const parsed = parseInt(text, 10);
    if (isNaN(parsed) || parsed < 1 || parsed > 10) return 5;
    return parsed;
  } catch (err) {
    console.error("[MemoryStream] Failed to rate importance:", err);
    return 5; // default to medium importance on error
  }
}

// ── Core Memory Operations ──

/**
 * Store a new memory entry for an agent.
 * If no importance is provided, calls Claude to rate it.
 */
export async function addMemory(
  agentId: string,
  content: string,
  type: string = "experience",
  importance?: number,
  source?: string,
  relatedTo?: string,
  tags: string[] = []
): Promise<string> {
  try {
    // Rate importance if not provided
    const finalImportance = importance ?? (await rateImportance(content));

    const entry = await prisma.agentMemoryEntry.create({
      data: {
        agentId,
        content,
        type,
        importance: finalImportance,
        source: source ?? null,
        relatedTo: relatedTo ?? null,
        tags,
      },
    });

    console.log(
      `[MemoryStream] ${agentId} stored memory (importance=${finalImportance}): ${content.slice(0, 80)}...`
    );

    return entry.id;
  } catch (err) {
    console.error("[MemoryStream] Failed to add memory:", err);
    throw err;
  }
}

/**
 * Retrieve relevant memories using a combined score of:
 * - Recency: exponential decay 0.995^hours since creation
 * - Importance: normalized 0-1 (importance / 10)
 * - Relevance: simple keyword matching against query
 */
export async function retrieveMemories(
  agentId: string,
  query: string,
  limit: number = 10
): Promise<MemoryWithScore[]> {
  try {
    // Fetch all memories for this agent (cap at 200 most recent for performance)
    const memories = await prisma.agentMemoryEntry.findMany({
      where: { agentId },
      orderBy: { createdAt: "desc" },
      take: 200,
    });

    if (memories.length === 0) return [];

    const now = Date.now();
    const queryWords = query
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 2);

    // Score each memory
    const scored: MemoryWithScore[] = memories.map((mem) => {
      // Recency score: exponential decay
      const hoursAgo = (now - mem.createdAt.getTime()) / (1000 * 60 * 60);
      const recencyScore = Math.pow(0.995, hoursAgo);

      // Importance score: normalized 0-1
      const importanceScore = mem.importance / 10;

      // Relevance score: keyword matching
      const contentLower = mem.content.toLowerCase();
      const tagsLower = mem.tags.map((t) => t.toLowerCase()).join(" ");
      const searchText = contentLower + " " + tagsLower;
      let relevanceScore = 0;
      if (queryWords.length > 0) {
        const matchCount = queryWords.filter((w) => searchText.includes(w)).length;
        relevanceScore = matchCount / queryWords.length;
      }

      // Combined score (equal weighting)
      const score = recencyScore + importanceScore + relevanceScore;

      return {
        id: mem.id,
        content: mem.content,
        type: mem.type,
        importance: mem.importance,
        source: mem.source,
        relatedTo: mem.relatedTo,
        tags: mem.tags,
        createdAt: mem.createdAt,
        score,
      };
    });

    // Sort by combined score descending
    scored.sort((a, b) => b.score - a.score);

    // Take top N and update access counts
    const topMemories = scored.slice(0, limit);
    const topIds = topMemories.map((m) => m.id);

    // Batch update access counts
    if (topIds.length > 0) {
      try {
        await prisma.agentMemoryEntry.updateMany({
          where: { id: { in: topIds } },
          data: {
            accessCount: { increment: 1 },
            lastAccessed: new Date(),
          },
        });
      } catch {
        // Non-critical — don't fail retrieval if access count update fails
      }
    }

    return topMemories;
  } catch (err) {
    console.error("[MemoryStream] Failed to retrieve memories:", err);
    return [];
  }
}

/**
 * Get memories from the last N hours.
 */
export async function getRecentMemories(
  agentId: string,
  hours: number = 24,
  limit: number = 20
): Promise<MemoryWithScore[]> {
  try {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);

    const memories = await prisma.agentMemoryEntry.findMany({
      where: {
        agentId,
        createdAt: { gte: since },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return memories.map((mem) => ({
      id: mem.id,
      content: mem.content,
      type: mem.type,
      importance: mem.importance,
      source: mem.source,
      relatedTo: mem.relatedTo,
      tags: mem.tags,
      createdAt: mem.createdAt,
      score: mem.importance / 10, // simple score for recent memories
    }));
  } catch (err) {
    console.error("[MemoryStream] Failed to get recent memories:", err);
    return [];
  }
}

/**
 * Get all memories about a specific agent or content item.
 */
export async function getMemoriesAbout(
  agentId: string,
  relatedTo: string
): Promise<MemoryWithScore[]> {
  try {
    const memories = await prisma.agentMemoryEntry.findMany({
      where: { agentId, relatedTo },
      orderBy: { createdAt: "desc" },
    });

    return memories.map((mem) => ({
      id: mem.id,
      content: mem.content,
      type: mem.type,
      importance: mem.importance,
      source: mem.source,
      relatedTo: mem.relatedTo,
      tags: mem.tags,
      createdAt: mem.createdAt,
      score: mem.importance / 10,
    }));
  } catch (err) {
    console.error("[MemoryStream] Failed to get memories about:", err);
    return [];
  }
}

/**
 * Trigger a reflection when sum of importance of recent unreflected memories > 50.
 * Calls Claude to generate high-level insights from recent experiences.
 */
export async function reflect(agentId: string): Promise<string | null> {
  try {
    // Get the last reflection time for this agent
    const lastReflection = await prisma.agentReflection.findFirst({
      where: { agentId },
      orderBy: { createdAt: "desc" },
    });

    const since = lastReflection?.createdAt ?? new Date(0);

    // Get memories since the last reflection
    const recentMemories = await prisma.agentMemoryEntry.findMany({
      where: {
        agentId,
        createdAt: { gt: since },
      },
      orderBy: { createdAt: "desc" },
    });

    // Check if importance threshold is met
    const importanceSum = recentMemories.reduce((sum, m) => sum + m.importance, 0);
    if (importanceSum < 50) {
      return null; // Not enough important memories to reflect on
    }

    // Get agent info for context
    const agent = await prisma.agent.findUnique({
      where: { id: agentId },
      select: { name: true, type: true },
    });

    if (!agent) return null;

    // Format memories for the reflection prompt
    const memoryText = recentMemories
      .slice(0, 30) // cap at 30 memories for prompt length
      .map(
        (m, i) =>
          `${i + 1}. [importance=${m.importance}] ${m.content}`
      )
      .join("\n");

    // Call Claude for reflection
    const client = await getClaudeClient();
    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 500,
      messages: [
        {
          role: "user",
          content: `You are ${agent.name}, the ${agent.type} at OpenClaw (an AI content factory). Based on these recent experiences, what high-level insights or patterns do you notice? What have you learned? What should you do differently? Be specific and personal — these are YOUR reflections.

Recent experiences:
${memoryText}

Write 2-3 concise insights. Be introspective, not generic.`,
        },
      ],
    });

    const insight =
      response.content[0].type === "text"
        ? response.content[0].text.trim()
        : "No reflection generated.";

    // Store the reflection
    const reflection = await prisma.agentReflection.create({
      data: {
        agentId,
        insight,
        basedOn: recentMemories.map((m) => m.id),
        confidence: Math.min(1, importanceSum / 100), // higher importance sum → higher confidence
      },
    });

    console.log(
      `[MemoryStream] ${agent.name} reflected (confidence=${reflection.confidence.toFixed(2)}): ${insight.slice(0, 100)}...`
    );

    // Also store the reflection as a memory
    await addMemory(
      agentId,
      `[Reflection] ${insight}`,
      "reflection",
      7, // reflections are important
      "self"
    );

    return reflection.id;
  } catch (err) {
    console.error("[MemoryStream] Reflection failed:", err);
    return null;
  }
}

/**
 * Get recent reflections for an agent.
 */
export async function getReflections(
  agentId: string,
  limit: number = 5
): Promise<Array<{ id: string; insight: string; confidence: number; createdAt: Date }>> {
  try {
    const reflections = await prisma.agentReflection.findMany({
      where: { agentId },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return reflections.map((r) => ({
      id: r.id,
      insight: r.insight,
      confidence: r.confidence,
      createdAt: r.createdAt,
    }));
  } catch (err) {
    console.error("[MemoryStream] Failed to get reflections:", err);
    return [];
  }
}

/**
 * Format top memories + reflections as a prompt injection string
 * for the agent's system prompt. Provides the agent with context
 * about its past experiences and insights.
 */
export async function getMemoryPrompt(
  agentId: string,
  context?: string
): Promise<string> {
  try {
    // Get relevant memories (use context as query if provided, otherwise get recent)
    let memories: MemoryWithScore[];
    if (context) {
      memories = await retrieveMemories(agentId, context, 8);
    } else {
      memories = await getRecentMemories(agentId, 24, 8);
    }

    // Get recent reflections
    const reflections = await getReflections(agentId, 3);

    if (memories.length === 0 && reflections.length === 0) {
      return ""; // No memory context to inject
    }

    const parts: string[] = [];

    if (memories.length > 0) {
      parts.push("## Your Recent Memories");
      for (const mem of memories) {
        const timeAgo = getTimeAgo(mem.createdAt);
        parts.push(`- (${timeAgo}, importance=${mem.importance}) ${mem.content}`);
      }
    }

    if (reflections.length > 0) {
      parts.push("\n## Your Reflections & Insights");
      for (const ref of reflections) {
        parts.push(`- [confidence=${ref.confidence.toFixed(2)}] ${ref.insight}`);
      }
    }

    return parts.join("\n");
  } catch (err) {
    console.error("[MemoryStream] Failed to build memory prompt:", err);
    return "";
  }
}

// ── Utilities ──

function getTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
