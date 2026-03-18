/* ── Agent Chat Engine ──
 * Handles channel messaging, @mentions, agent triggering, and loop guards.
 * Agents wake when mentioned, respond with personality + memory context,
 * and can @mention other agents to continue the conversation.
 *
 * Usage:
 *   import { sendMessage, triggerAgent, getChannelMessages } from "@/lib/agent-runtime/agent-chat";
 */

import { prisma } from "@/lib/db/prisma";
import { getRequiredSetting } from "@/lib/db/settings";
import { getMemoryPrompt, addMemory } from "@/lib/agent-runtime/memory-stream";
import { agentPersonalities } from "@/lib/agents/personalities";
import { eventBus } from "@/lib/events/event-bus";
import Anthropic from "@anthropic-ai/sdk";

// ── Constants ──

const LOOP_GUARD_MAX = 5; // max agent-to-agent hops per channel before pausing

// Channels where loop guard is temporarily disabled (e.g., during meetings)
const loopGuardBypass: Set<string> = new Set();

export function disableLoopGuard(channelName: string) { loopGuardBypass.add(channelName); }
export function enableLoopGuard(channelName: string) { loopGuardBypass.delete(channelName); channelLoopCounts[channelName] = 0; }

// Track loop count per channel (resets when Bobby sends or types /continue)
const channelLoopCounts: Record<string, number> = {};

// ── Agent ID → Type mapping ──

const AGENT_MAP: Record<string, { name: string; type: string }> = {
  "agent-ideator": { name: "Ideator", type: "ideator" },
  "agent-writer": { name: "Writer", type: "writer" },
  "agent-designer": { name: "Designer", type: "designer" },
  "agent-filmmaker": { name: "Filmmaker", type: "filmmaker" },
  "agent-editor": { name: "Editor", type: "editor" },
  "agent-social-bot": { name: "Social Bot", type: "social" },
  "agent-engage-bot": { name: "Engage Bot", type: "engage" },
  "agent-scanner": { name: "Scanner", type: "scanner" },
  "agent-outreach": { name: "Outreach Bot", type: "outreach" },
};

// Name → Agent ID reverse lookup
const NAME_TO_ID: Record<string, string> = {};
for (const [id, info] of Object.entries(AGENT_MAP)) {
  NAME_TO_ID[info.name.toLowerCase()] = id;
  // Also map without spaces
  NAME_TO_ID[info.name.toLowerCase().replace(/\s+/g, "")] = id;
}

// ── Core Functions ──

/**
 * Get or create a channel by name.
 */
async function ensureChannel(channelName: string): Promise<string> {
  try {
    let channel = await prisma.chatChannel.findUnique({
      where: { name: channelName },
    });
    if (!channel) {
      channel = await prisma.chatChannel.create({
        data: { name: channelName },
      });
    }
    return channel.id;
  } catch (err) {
    console.error("[AgentChat] Failed to ensure channel:", err);
    throw err;
  }
}

/**
 * Detect @mentions in message content.
 * Matches patterns like @Ideator, @Writer, @Social Bot, @SocialBot, etc.
 * Returns array of agent IDs.
 */
export function detectMentions(content: string): string[] {
  const mentions: string[] = [];
  // Match @Word or @Two Words (look for known agent names)
  const pattern = /@(\w+(?:\s+\w+)?)/g;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(content)) !== null) {
    const mentioned = match[1].toLowerCase();
    // Try exact match
    if (NAME_TO_ID[mentioned]) {
      mentions.push(NAME_TO_ID[mentioned]);
    }
    // Try with common variations
    for (const [name, id] of Object.entries(NAME_TO_ID)) {
      if (name.startsWith(mentioned) || mentioned.startsWith(name)) {
        if (!mentions.includes(id)) {
          mentions.push(id);
        }
      }
    }
  }
  return Array.from(new Set(mentions));
}

/**
 * Send a message to a channel.
 */
export async function sendMessage(
  channelName: string,
  senderId: string,
  senderName: string,
  senderType: "agent" | "user" | "system",
  content: string,
  mentions?: string[],
  messageType: string = "text",
  metadata?: Record<string, unknown>
): Promise<{
  id: string;
  channelId: string;
  senderId: string;
  senderName: string;
  senderType: string;
  content: string;
  mentions: string[];
  messageType: string;
  metadata: unknown;
  createdAt: Date;
}> {
  try {
    const channelId = await ensureChannel(channelName);

    // Auto-detect mentions if not provided
    const detectedMentions = mentions ?? detectMentions(content);

    const message = await prisma.channelMessage.create({
      data: {
        channelId,
        senderId,
        senderName,
        senderType,
        content,
        mentions: detectedMentions,
        messageType,
        metadata: (metadata as object) ?? undefined,
      },
    });

    // Reset loop guard when Bobby sends a message or types /continue
    if (senderType === "user") {
      channelLoopCounts[channelName] = 0;
    }

    // Emit event
    eventBus.emit({
      type: "task_completed",
      agentName: senderName,
      message: `[#${channelName}] ${content.slice(0, 60)}${content.length > 60 ? "..." : ""}`,
      metadata: { channelName, messageId: message.id },
    });

    // Trigger mentioned agents (async, non-blocking)
    if (detectedMentions.length > 0 && senderType !== "system") {
      // Don't await — let agents respond in background
      triggerMentionedAgents(channelName, detectedMentions, message.id, content, senderId).catch(
        (err) => console.error("[AgentChat] Failed to trigger agents:", err)
      );
    }

    return message;
  } catch (err) {
    console.error("[AgentChat] Failed to send message:", err);
    throw err;
  }
}

/**
 * Trigger mentioned agents to respond.
 */
async function triggerMentionedAgents(
  channelName: string,
  agentIds: string[],
  triggerMessageId: string,
  triggerContent: string,
  triggeredBy: string
): Promise<void> {
  for (const agentId of agentIds) {
    // Don't trigger self
    if (agentId === triggeredBy) continue;

    // Check loop guard (bypassed during meetings)
    if (loopGuardBypass.has(channelName)) {
      // Meeting in progress — skip loop guard
    } else {
    const loopCount = channelLoopCounts[channelName] || 0;
    if (loopCount >= LOOP_GUARD_MAX) {
      console.log(
        `[AgentChat] Loop guard hit for #${channelName} (${loopCount}/${LOOP_GUARD_MAX}). Pausing agent triggers.`
      );
      await sendMessage(
        channelName,
        "system",
        "System",
        "system",
        `Agent conversation paused after ${LOOP_GUARD_MAX} exchanges. Bobby can type /continue or send a message to resume.`,
        [],
        "system"
      );
      return;
    }

    channelLoopCounts[channelName] = loopCount + 1;
    } // close the else block from loop guard bypass

    try {
      await triggerAgent(agentId, channelName, triggerContent);
    } catch (err) {
      console.error(`[AgentChat] Failed to trigger agent ${agentId}:`, err);
    }
  }
}

/**
 * Wake an agent to respond to a channel message.
 * Loads personality + recent messages + memories, calls Claude Sonnet,
 * posts response to channel.
 */
export async function triggerAgent(
  agentId: string,
  channelName: string,
  triggerMessage: string
): Promise<void> {
  try {
    const agentInfo = AGENT_MAP[agentId];
    if (!agentInfo) {
      console.warn(`[AgentChat] Unknown agent ID: ${agentId}`);
      return;
    }

    // Get agent from DB for personality
    const agent = await prisma.agent.findUnique({
      where: { id: agentId },
      select: { id: true, name: true, type: true, personality: true },
    });
    if (!agent) return;

    // Get personality from the personalities library
    const personality = agentPersonalities[agentInfo.type] || agent.personality || "";

    // Get recent channel messages for context
    const channelId = await ensureChannel(channelName);
    const recentMessages = await prisma.channelMessage.findMany({
      where: { channelId },
      orderBy: { createdAt: "desc" },
      take: 20,
    });
    recentMessages.reverse();

    // Get memory context for this agent
    const memoryContext = await getMemoryPrompt(agentId, triggerMessage);

    // Build conversation context
    const channelContext = recentMessages
      .map((m) => `[${m.senderName} (${m.senderType})] ${m.content}`)
      .join("\n");

    // Get API key
    const apiKey = await getRequiredSetting("ANTHROPIC_API_KEY");
    const client = new Anthropic({ apiKey });

    // Build system prompt
    const systemPrompt = `You are ${agent.name}, an AI agent at OpenClaw (an AI-powered content factory and advertising agency).

${personality}

You are chatting in the #${channelName} channel with your team (other AI agents and Bobby, the human operator).

${memoryContext ? `\n${memoryContext}\n` : ""}

RULES:
- Be concise and direct. Keep responses under 200 words unless the topic requires detail.
- Stay in character. Use your personality and expertise.
- If you need another agent's help, mention them with @ (e.g., "@Writer can you draft this?")
- Don't repeat what's already been said. Add new value.
- If Bobby gives an order, acknowledge and act on it.
- Use markdown formatting sparingly (bold for emphasis, lists for multiple items).

Recent channel messages:
${channelContext || "(empty channel)"}`;

    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: `Respond to the conversation in #${channelName}. The most recent message that triggered you: "${triggerMessage.slice(0, 500)}"`,
        },
      ],
    });

    const textBlock = response.content.find((b) => b.type === "text");
    const responseText = textBlock?.text ?? "";

    if (!responseText.trim()) return;

    // Store this interaction as a memory for the agent
    await addMemory(
      agentId,
      `Participated in #${channelName} conversation. Trigger: "${triggerMessage.slice(0, 100)}". My response: "${responseText.slice(0, 100)}"`,
      "conversation",
      undefined, // auto-rate importance
      "channel-chat",
      undefined,
      [channelName, "chat"]
    ).catch(() => {}); // non-critical

    // Post response to channel (this will also detect @mentions and trigger those agents)
    await sendMessage(
      channelName,
      agentId,
      agent.name,
      "agent",
      responseText,
      undefined, // auto-detect mentions
      "text"
    );
  } catch (err) {
    console.error(`[AgentChat] triggerAgent failed for ${agentId}:`, err);
  }
}

/**
 * Get messages from a channel.
 */
export async function getChannelMessages(
  channelName: string,
  limit: number = 50
): Promise<
  Array<{
    id: string;
    channelId: string;
    senderId: string;
    senderName: string;
    senderType: string;
    content: string;
    mentions: string[];
    replyToId: string | null;
    messageType: string;
    metadata: unknown;
    createdAt: Date;
  }>
> {
  try {
    const channel = await prisma.chatChannel.findUnique({
      where: { name: channelName },
    });
    if (!channel) return [];

    const messages = await prisma.channelMessage.findMany({
      where: { channelId: channel.id },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    // Return in chronological order (oldest first)
    messages.reverse();
    return messages;
  } catch (err) {
    console.error("[AgentChat] Failed to get channel messages:", err);
    return [];
  }
}

/**
 * Get direct messages between two entities.
 * DMs use auto-created channels named "dm-{id1}-{id2}" (alphabetically sorted).
 */
export async function getDirectMessages(
  entityId1: string,
  entityId2: string,
  limit: number = 30
): Promise<
  Array<{
    id: string;
    channelId: string;
    senderId: string;
    senderName: string;
    senderType: string;
    content: string;
    mentions: string[];
    replyToId: string | null;
    messageType: string;
    metadata: unknown;
    createdAt: Date;
  }>
> {
  const dmChannelName = getDMChannelName(entityId1, entityId2);
  return getChannelMessages(dmChannelName, limit);
}

/**
 * Send a direct message between two entities.
 */
export async function sendDirectMessage(
  fromId: string,
  fromName: string,
  fromType: "agent" | "user",
  toId: string,
  content: string
): Promise<{
  id: string;
  channelId: string;
  senderId: string;
  senderName: string;
  senderType: string;
  content: string;
  mentions: string[];
  messageType: string;
  metadata: unknown;
  createdAt: Date;
}> {
  const dmChannelName = getDMChannelName(fromId, toId);

  // Ensure the DM channel has a proper description
  const channelId = await ensureChannel(dmChannelName);
  const toInfo = AGENT_MAP[toId];
  const fromInfo = AGENT_MAP[fromId];
  const desc = `DM between ${fromInfo?.name || fromName} and ${toInfo?.name || toId}`;

  await prisma.chatChannel.update({
    where: { id: channelId },
    data: { description: desc },
  }).catch(() => {}); // non-critical

  const message = await sendMessage(
    dmChannelName,
    fromId,
    fromName,
    fromType,
    content,
    [toId],
    "text"
  );

  return message;
}

/**
 * Get a consistent DM channel name for two entities.
 */
function getDMChannelName(id1: string, id2: string): string {
  const sorted = [id1, id2].sort();
  return `dm-${sorted[0]}-${sorted[1]}`;
}

/**
 * Reset the loop guard for a channel (called when Bobby types /continue).
 */
export function resetLoopGuard(channelName: string): void {
  channelLoopCounts[channelName] = 0;
  console.log(`[AgentChat] Loop guard reset for #${channelName}`);
}

/**
 * Get all channels with unread counts (messages since last read).
 */
export async function getChannelsWithInfo(): Promise<
  Array<{
    id: string;
    name: string;
    description: string | null;
    isDefault: boolean;
    messageCount: number;
    lastMessage: {
      content: string;
      senderName: string;
      createdAt: Date;
    } | null;
  }>
> {
  try {
    const channels = await prisma.chatChannel.findMany({
      where: {
        // Exclude DM channels from the channel list
        NOT: { name: { startsWith: "dm-" } },
      },
      orderBy: { createdAt: "asc" },
      include: {
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { content: true, senderName: true, createdAt: true },
        },
        _count: { select: { messages: true } },
      },
    });

    return channels.map((ch) => ({
      id: ch.id,
      name: ch.name,
      description: ch.description,
      isDefault: ch.isDefault,
      messageCount: ch._count.messages,
      lastMessage: ch.messages[0]
        ? {
            content: ch.messages[0].content.slice(0, 80),
            senderName: ch.messages[0].senderName,
            createdAt: ch.messages[0].createdAt,
          }
        : null,
    }));
  } catch (err) {
    console.error("[AgentChat] Failed to get channels:", err);
    return [];
  }
}

/**
 * Get all agents with their current status (for sidebar).
 */
export async function getAgentsForChat(): Promise<
  Array<{
    id: string;
    name: string;
    type: string;
    status: string;
  }>
> {
  try {
    const agents = await prisma.agent.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        type: true,
        status: true,
      },
    });
    return agents;
  } catch (err) {
    console.error("[AgentChat] Failed to get agents:", err);
    return [];
  }
}
