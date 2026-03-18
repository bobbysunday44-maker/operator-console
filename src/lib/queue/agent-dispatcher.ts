/* ── Agent Task Dispatcher ──
 * Runs every 15 seconds. Finds idle agents and assigns them
 * pending tasks from the Task table. Agents pick up work
 * automatically based on their type.
 */

import { prisma } from "@/lib/db/prisma";
import { eventBus } from "@/lib/events/event-bus";
import { getPersonality } from "@/lib/agents/personalities";

let dispatchInterval: ReturnType<typeof setInterval> | null = null;

// Map agent types to task types they can handle
const AGENT_CAPABILITIES: Record<string, string[]> = {
  writer: ["content_gen", "script_writing", "caption"],
  designer: ["image_gen", "thumbnail"],
  filmmaker: ["video_gen", "assembly"],
  social: ["social_posting", "scheduling"],
  scanner: ["mention_scan", "sentiment"],
  engage: ["reply_draft", "engagement"],
  editor: ["quality_review", "approval"],
  ideator: ["research", "trending", "ideation"],
  outreach: ["cold_outreach", "pitch_generation", "follow_up", "lead_qualification"],
};

async function dispatchTasks() {
  try {
    // Find idle agents
    const idleAgents = await prisma.agent.findMany({
      where: { status: "idle" },
    });

    if (idleAgents.length === 0) return;

    // Find pending tasks not yet assigned
    const pendingTasks = await prisma.task.findMany({
      where: { status: "pending", assigneeId: null },
      orderBy: [{ priority: "desc" }, { createdAt: "asc" }],
      take: idleAgents.length,
    });

    if (pendingTasks.length === 0) return;

    for (const task of pendingTasks) {
      // Find best agent for this task
      const matchingAgent = idleAgents.find((agent) => {
        const caps = AGENT_CAPABILITIES[agent.type] || [];
        // Match by task metadata or title keywords
        const taskType = (task.metadata as Record<string, unknown>)?.taskType as string || "";
        return caps.length > 0 && caps.includes(taskType);
      });

      if (!matchingAgent) continue;

      // Assign task to agent
      await prisma.$transaction([
        prisma.task.update({
          where: { id: task.id },
          data: { status: "in_progress", assigneeId: matchingAgent.id },
        }),
        prisma.agent.update({
          where: { id: matchingAgent.id },
          data: {
            status: "active",
            currentTask: task.title.slice(0, 100),
            lastHeartbeat: new Date(),
          },
        }),
      ]);

      // Remove from idle pool so we don't double-assign
      const idx = idleAgents.indexOf(matchingAgent);
      if (idx !== -1) idleAgents.splice(idx, 1);

      // Load agent personality for this task execution
      const personality = matchingAgent.personality || getPersonality(matchingAgent.type) || "";
      console.log(`[Dispatcher] ${matchingAgent.name} (${matchingAgent.type}) loaded personality (${personality.length} chars) for task: ${task.title}`);

      eventBus.emit({
        type: "task_started",
        agentId: matchingAgent.id,
        agentName: matchingAgent.name,
        message: `${matchingAgent.name} picked up: "${task.title}"`,
        metadata: { taskId: task.id, personalityLoaded: true },
      });

      // Log to activity
      await prisma.activityLog.create({
        data: {
          type: "info",
          message: `${matchingAgent.name} assigned to: ${task.title}`,
          source: "system",
        },
      });
    }
  } catch (err) {
    console.error("[Dispatcher] Error:", err);
  }
}

export function startAgentDispatcher() {
  if (dispatchInterval) return;
  console.log("[Dispatcher] Started — checking every 15s");
  dispatchInterval = setInterval(dispatchTasks, 15_000);
}

export function stopAgentDispatcher() {
  if (dispatchInterval) {
    clearInterval(dispatchInterval);
    dispatchInterval = null;
  }
}
