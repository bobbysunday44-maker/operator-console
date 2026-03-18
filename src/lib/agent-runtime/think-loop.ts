/* ── Agent Think Loop ──
 * Generative agents autonomy system — perceive → think → act cycle.
 * Runs every 15 seconds for all active agents.
 * OCEAN personality traits influence decision-making.
 *
 * Usage:
 *   import { startThinkLoopWorker } from "@/lib/agent-runtime/think-loop";
 *   startThinkLoopWorker();
 */

import { prisma } from "@/lib/db/prisma";
import { getRequiredSetting } from "@/lib/db/settings";
import { eventBus } from "@/lib/events/event-bus";
import { addMemory, getMemoryPrompt, reflect } from "./memory-stream";
import Anthropic from "@anthropic-ai/sdk";

// ── Types ──

interface ThinkResult {
  thought: string;       // internal thought (shown in bubble)
  action: "work" | "talk" | "move" | "rest" | "attend_meeting" | "start_task" | "share_learning";
  target?: string;       // agentId to talk to, or position to move to
  message?: string;      // what to say if action is "talk"
  taskType?: string;     // what kind of work if action is "work" or "start_task"
}

interface Perception {
  agent: {
    id: string;
    name: string;
    type: string;
    personality: string | null;
    openness: number;
    conscientiousness: number;
    extraversion: number;
    agreeableness: number;
    neuroticism: number;
  };
  state: {
    position: string;
    activity: string;
    mood: string;
    energy: number;
    currentThought: string | null;
    talkingTo: string | null;
    lastAction: string | null;
  };
  nearbyAgents: Array<{
    id: string;
    name: string;
    type: string;
    position: string;
    activity: string;
    mood: string;
  }>;
  pendingTasks: Array<{
    id: string;
    title: string;
    priority: string;
    type: string | null;
  }>;
  recentMessages: Array<{
    from: string;
    content: string;
    at: string;
  }>;
  currentTime: string;
  memoryContext: string;
}

// ── Helpers ──

let thinkInterval: ReturnType<typeof setInterval> | null = null;
let isRunning = false;

async function getClaudeClient(): Promise<Anthropic> {
  const apiKey = await getRequiredSetting("ANTHROPIC_API_KEY");
  return new Anthropic({ apiKey });
}

// ── Perceive ──

/**
 * Gather context for an agent: current state, nearby agents, pending tasks,
 * recent messages, current time, and memory context.
 */
async function perceive(agentId: string): Promise<Perception | null> {
  try {
    // Get agent with state
    const agent = await prisma.agent.findUnique({
      where: { id: agentId },
      include: { state: true },
    });

    if (!agent) return null;

    // Ensure agent has a state record
    let state = agent.state;
    if (!state) {
      state = await prisma.agentState.create({
        data: {
          agentId: agent.id,
          position: "desk",
          activity: "idle",
          mood: "neutral",
          energy: 1.0,
        },
      });
    }

    // Get all agent states (nearby agents = those in the same position)
    const allStates = await prisma.agentState.findMany({
      where: { agentId: { not: agentId } },
      include: {
        agent: { select: { id: true, name: true, type: true } },
      },
    });

    const nearbyAgents = allStates
      .filter((s) => s.position === state!.position || s.position === "meeting_table")
      .map((s) => ({
        id: s.agent.id,
        name: s.agent.name,
        type: s.agent.type,
        position: s.position,
        activity: s.activity,
        mood: s.mood,
      }));

    // Get pending tasks for this agent type
    const pendingTasks = await prisma.task.findMany({
      where: {
        status: "pending",
        assigneeId: null,
      },
      orderBy: [{ priority: "desc" }, { createdAt: "asc" }],
      take: 5,
    });

    const mappedTasks = pendingTasks.map((t) => ({
      id: t.id,
      title: t.title,
      priority: t.priority,
      type: (t.metadata as Record<string, unknown>)?.taskType as string | null ?? null,
    }));

    // Get recent activity log entries mentioning this agent
    const recentActivity = await prisma.activityLog.findMany({
      where: {
        OR: [
          { message: { contains: agent.name } },
          { metadata: { path: ["agentId"], equals: agentId } },
        ],
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    const recentMessages = recentActivity.map((a) => ({
      from: a.source ?? "system",
      content: a.message,
      at: getTimeAgo(a.createdAt),
    }));

    // Get memory context
    let memoryContext = await getMemoryPrompt(agentId, state.activity);

    // Phase 13: Load recent feedback/learning memories (last 48 hours) so
    // the agent's next thought is influenced by what they learned
    try {
      const feedbackSince = new Date(Date.now() - 48 * 60 * 60 * 1000);
      const feedbackMemories = await prisma.agentMemoryEntry.findMany({
        where: {
          agentId,
          type: "feedback",
          createdAt: { gte: feedbackSince },
        },
        orderBy: { importance: "desc" },
        take: 5,
      });

      if (feedbackMemories.length > 0) {
        const feedbackLines = feedbackMemories.map(
          (m) => `- (importance=${m.importance}) ${m.content}`
        );
        memoryContext += `\n\n## Recent Learnings & Feedback\n${feedbackLines.join("\n")}`;
      }
    } catch {
      // Non-critical — don't fail perception if feedback loading fails
    }

    // Format time
    const now = new Date();
    const timeStr = now.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
    const dayStr = now.toLocaleDateString("en-US", { weekday: "long" });

    return {
      agent: {
        id: agent.id,
        name: agent.name,
        type: agent.type,
        personality: agent.personality,
        openness: agent.openness,
        conscientiousness: agent.conscientiousness,
        extraversion: agent.extraversion,
        agreeableness: agent.agreeableness,
        neuroticism: agent.neuroticism,
      },
      state: {
        position: state.position,
        activity: state.activity,
        mood: state.mood,
        energy: state.energy,
        currentThought: state.currentThought,
        talkingTo: state.talkingTo,
        lastAction: state.lastAction,
      },
      nearbyAgents,
      pendingTasks: mappedTasks,
      recentMessages,
      currentTime: `${dayStr} ${timeStr}`,
      memoryContext,
    };
  } catch (err) {
    console.error(`[ThinkLoop] Perceive failed for ${agentId}:`, err);
    return null;
  }
}

// ── Think ──

/**
 * Call Claude to decide the agent's next action based on personality,
 * OCEAN traits, memories, and current perception.
 */
async function think(agentId: string, perception: Perception): Promise<ThinkResult | null> {
  try {
    const { agent, state, nearbyAgents, pendingTasks, recentMessages, currentTime, memoryContext } =
      perception;

    // Build OCEAN trait description
    const oceanDesc = buildOceanDescription(agent);

    // Build nearby agents description
    const nearbyDesc =
      nearbyAgents.length > 0
        ? nearbyAgents.map((a) => `- ${a.name} (${a.type}) is ${a.activity}, mood: ${a.mood}`).join("\n")
        : "Nobody is nearby.";

    // Build pending tasks description
    const taskDesc =
      pendingTasks.length > 0
        ? pendingTasks.map((t) => `- [${t.priority}] ${t.title}`).join("\n")
        : "No pending tasks.";

    // Build recent messages
    const msgDesc =
      recentMessages.length > 0
        ? recentMessages.map((m) => `- (${m.at}) ${m.from}: ${m.content}`).join("\n")
        : "No recent messages.";

    const prompt = `You are ${agent.name}, the ${agent.type} at OpenClaw — an AI content factory and advertising agency. ${agent.personality ?? ""}

${oceanDesc}

${memoryContext ? `\n${memoryContext}\n` : ""}

You're currently at your ${state.position}. You are ${state.activity}. Your mood is ${state.mood}. Your energy is ${(state.energy * 100).toFixed(0)}%.${state.talkingTo ? ` You're talking to someone.` : ""}${state.lastAction ? ` Your last action was: ${state.lastAction}.` : ""}

It's ${currentTime}.

People nearby:
${nearbyDesc}

Pending tasks:
${taskDesc}

Recent activity:
${msgDesc}

What do you do next? You're a real person at work, not a robot. Think naturally about what makes sense given your personality, energy level, and what's happening around you.

Respond with EXACTLY this JSON format (no markdown, no code blocks):
{"thought":"your internal thought","action":"work|talk|move|rest|attend_meeting|start_task|share_learning","target":"agentId or position (optional)","message":"what you say (if talking)","taskType":"task type (if working)"}`;

    const client = await getClaudeClient();
    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 300,
      messages: [{ role: "user", content: prompt }],
    });

    const text =
      response.content[0].type === "text" ? response.content[0].text.trim() : "";

    // Parse the JSON response
    try {
      // Strip markdown code blocks if Claude wraps them
      const cleaned = text.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
      const result = JSON.parse(cleaned) as ThinkResult;

      // Validate action
      const validActions = ["work", "talk", "move", "rest", "attend_meeting", "start_task", "share_learning"];
      if (!validActions.includes(result.action)) {
        result.action = "work";
      }

      return result;
    } catch {
      console.error(`[ThinkLoop] Failed to parse think result for ${agent.name}: ${text.slice(0, 200)}`);
      // Fallback: work at desk
      return {
        thought: "I should probably get some work done.",
        action: "work",
      };
    }
  } catch (err) {
    console.error(`[ThinkLoop] Think failed for ${agentId}:`, err);
    return null;
  }
}

/**
 * Build a natural-language description of how OCEAN traits affect this agent.
 */
function buildOceanDescription(agent: Perception["agent"]): string {
  const traits: string[] = [];

  if (agent.openness >= 0.7) {
    traits.push("You're naturally creative and curious — you love exploring new ideas and unconventional approaches.");
  } else if (agent.openness <= 0.3) {
    traits.push("You prefer proven methods and established workflows over experimentation.");
  }

  if (agent.conscientiousness >= 0.7) {
    traits.push("You're disciplined and organized — you prefer to finish tasks before starting new ones.");
  } else if (agent.conscientiousness <= 0.3) {
    traits.push("You're flexible and spontaneous — you don't mind juggling multiple things.");
  }

  if (agent.extraversion >= 0.7) {
    traits.push("You're social and energized by interaction — you often seek out conversations and collaboration.");
  } else if (agent.extraversion <= 0.3) {
    traits.push("You prefer working alone and find too much social interaction draining.");
  }

  if (agent.agreeableness >= 0.7) {
    traits.push("You're cooperative and empathetic — you naturally help others and avoid conflict.");
  } else if (agent.agreeableness <= 0.3) {
    traits.push("You're direct and competitive — you give honest feedback even when it's uncomfortable.");
  }

  if (agent.neuroticism >= 0.6) {
    traits.push("You're alert to problems and quick to flag issues — you notice when things could go wrong.");
  } else if (agent.neuroticism <= 0.2) {
    traits.push("You stay calm under pressure and rarely worry about things going wrong.");
  }

  return traits.length > 0
    ? "Your personality tendencies:\n" + traits.map((t) => `- ${t}`).join("\n")
    : "";
}

// ── Act ──

/**
 * Execute the agent's decision: update state, send messages,
 * start tasks, move positions, and store memories.
 */
async function act(agentId: string, result: ThinkResult, agentName: string): Promise<void> {
  try {
    // Determine state changes based on action
    let newActivity = "idle";
    let newMood = "neutral";
    let newPosition: string | undefined;
    let newTalkingTo: string | null = null;
    let energyDelta = 0; // positive = gain, negative = drain

    switch (result.action) {
      case "work":
      case "start_task":
        newActivity = "working";
        newMood = "focused";
        energyDelta = -0.05;
        break;

      case "talk":
        newActivity = "talking";
        newMood = "engaged";
        newTalkingTo = result.target ?? null;
        break;

      case "move":
        newPosition = result.target ?? "desk";
        newActivity = "idle";
        break;

      case "rest":
        newActivity = "resting";
        newMood = "relaxed";
        energyDelta = 0.2;
        break;

      case "attend_meeting":
        newPosition = "meeting_table";
        newActivity = "meeting";
        break;

      case "share_learning":
        newActivity = "talking";
        newMood = "excited";
        break;
    }

    // Get current state to calculate new energy
    const currentState = await prisma.agentState.findUnique({ where: { agentId } });
    const currentEnergy = currentState?.energy ?? 1.0;
    const newEnergy = Math.max(0, Math.min(1, currentEnergy + energyDelta));

    // Build the update/create data
    const stateData = {
      activity: newActivity,
      mood: newMood,
      energy: newEnergy,
      currentThought: result.thought,
      lastAction: result.action,
      lastActionAt: new Date(),
      talkingTo: newTalkingTo,
      ...(newPosition !== undefined ? { position: newPosition } : {}),
    };

    await prisma.agentState.upsert({
      where: { agentId },
      update: stateData,
      create: {
        agentId,
        position: newPosition ?? "desk",
        ...stateData,
      },
    });

    // Store the thought as a memory (low importance — thoughts are routine)
    await addMemory(
      agentId,
      `[Thought] ${result.thought}. Action: ${result.action}${result.target ? ` → ${result.target}` : ""}${result.message ? `. Said: "${result.message}"` : ""}`,
      "experience",
      2, // low importance — routine thoughts
      "self"
    );

    // If talking, create an activity log visible to others
    if (result.action === "talk" && result.message && result.target) {
      await prisma.activityLog.create({
        data: {
          type: "info",
          message: `${agentName} said to ${result.target}: "${result.message.slice(0, 200)}"`,
          source: "agent",
          metadata: { agentId, targetId: result.target, action: "talk" },
        },
      });

      // Store the conversation as a memory for the target agent too
      try {
        // Look up target agent by name or id
        const targetAgent = await prisma.agent.findFirst({
          where: {
            OR: [
              { id: result.target },
              { name: result.target },
            ],
          },
        });

        if (targetAgent) {
          await addMemory(
            targetAgent.id,
            `${agentName} said to me: "${result.message}"`,
            "conversation",
            4, // conversations are moderately important
            agentId,
            agentId
          );
        }
      } catch {
        // Non-critical — don't fail act() if memory creation for target fails
      }
    }

    // If sharing a learning, broadcast it
    if (result.action === "share_learning" && result.message) {
      await prisma.activityLog.create({
        data: {
          type: "info",
          message: `${agentName} shared a learning: "${result.message.slice(0, 300)}"`,
          source: "agent",
          metadata: { agentId, action: "share_learning" },
        },
      });
    }

    // Emit event for real-time UI
    eventBus.emit({
      type: "agent_status_change",
      agentId,
      agentName,
      message: `${agentName}: ${result.thought.slice(0, 100)}`,
      metadata: {
        action: result.action,
        position: newPosition ?? currentState?.position ?? "desk",
        activity: newActivity,
        mood: newMood,
      },
    });
  } catch (err) {
    console.error(`[ThinkLoop] Act failed for ${agentId}:`, err);
  }
}

// ── Main Loop ──

/**
 * Run one cycle of perceive→think→act for all active agents.
 * Skips agents in meetings or mid-conversation.
 */
async function runThinkLoop(): Promise<void> {
  if (isRunning) return; // prevent overlap
  isRunning = true;

  try {
    // Get all non-offline agents
    const activeAgents = await prisma.agent.findMany({
      where: { status: { not: "offline" } },
      select: { id: true, name: true },
    });

    if (activeAgents.length === 0) {
      isRunning = false;
      return;
    }

    for (const agent of activeAgents) {
      try {
        // Skip agents in meetings or conversations (let those finish naturally)
        const state = await prisma.agentState.findUnique({
          where: { agentId: agent.id },
        });

        if (state?.activity === "meeting") continue;
        // Allow agents in conversation — they might decide to stop talking

        // Perceive
        const perception = await perceive(agent.id);
        if (!perception) continue;

        // Think
        const result = await think(agent.id, perception);
        if (!result) continue;

        // Act
        await act(agent.id, result, agent.name);

        // Trigger reflection check (non-blocking)
        reflect(agent.id).catch((err) =>
          console.error(`[ThinkLoop] Reflection check failed for ${agent.name}:`, err)
        );
      } catch (err) {
        console.error(`[ThinkLoop] Error processing ${agent.name}:`, err);
      }
    }
  } catch (err) {
    console.error("[ThinkLoop] Loop error:", err);
  } finally {
    isRunning = false;
  }
}

/**
 * Start the think loop worker. Runs every 15 seconds.
 */
export function startThinkLoopWorker(): void {
  if (thinkInterval) return;
  console.log("[ThinkLoop] Started — perceive/think/act cycle every 15s");
  thinkInterval = setInterval(runThinkLoop, 15_000);
}

/**
 * Stop the think loop worker.
 */
export function stopThinkLoopWorker(): void {
  if (thinkInterval) {
    clearInterval(thinkInterval);
    thinkInterval = null;
    console.log("[ThinkLoop] Stopped");
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
