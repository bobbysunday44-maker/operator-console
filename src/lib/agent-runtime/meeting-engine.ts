/* ── Meeting Engine ──
 * Schedules, runs, and summarizes team meetings.
 * Types: standup, debrief, retrospective, strategy, adhoc
 * Each meeting triggers agents to speak in turn, then Claude summarizes.
 *
 * Usage:
 *   import { scheduleMeeting, startMeeting, conductMeeting, endMeeting } from "@/lib/agent-runtime/meeting-engine";
 */

import { prisma } from "@/lib/db/prisma";
import { getRequiredSetting } from "@/lib/db/settings";
import { sendMessage, triggerAgent, disableLoopGuard, enableLoopGuard } from "@/lib/agent-runtime/agent-chat";
import { eventBus } from "@/lib/events/event-bus";
import Anthropic from "@anthropic-ai/sdk";

// ── Meeting Type Prompts ──

const MEETING_PROMPTS: Record<string, string> = {
  standup:
    "This is a daily standup. Each team member should briefly share: 1) What did you accomplish since last standup? 2) What are you working on today? 3) Any blockers or issues?",
  debrief:
    "This is a daily debrief. Each team member should share: 1) What content/tasks performed well today? 2) What didn't go as planned? 3) Any insights or learnings?",
  retrospective:
    "This is a weekly retrospective. Each team member should reflect on: 1) What should we keep doing? (things that worked well) 2) What should we stop doing? (things that didn't work) 3) What should we start doing? (new ideas or improvements)",
  strategy:
    "This is a strategy meeting. Focus on: 1) Current content pipeline status 2) Growth metrics and trends 3) Upcoming opportunities 4) Resource allocation and priorities",
  adhoc:
    "This is an ad-hoc team meeting called by Bobby. Listen for the agenda and contribute your expertise.",
};

// Default attendees for each meeting type
const DEFAULT_ATTENDEES: Record<string, string[]> = {
  standup: [
    "agent-ideator",
    "agent-writer",
    "agent-designer",
    "agent-filmmaker",
    "agent-editor",
    "agent-social-bot",
    "agent-engage-bot",
    "agent-scanner",
    "agent-outreach",
  ],
  debrief: [
    "agent-ideator",
    "agent-writer",
    "agent-editor",
    "agent-social-bot",
    "agent-scanner",
  ],
  retrospective: [
    "agent-ideator",
    "agent-writer",
    "agent-designer",
    "agent-filmmaker",
    "agent-editor",
    "agent-social-bot",
    "agent-engage-bot",
    "agent-scanner",
    "agent-outreach",
  ],
  strategy: [
    "agent-ideator",
    "agent-writer",
    "agent-editor",
    "agent-scanner",
    "agent-outreach",
  ],
  adhoc: [
    "agent-ideator",
    "agent-writer",
    "agent-designer",
    "agent-filmmaker",
    "agent-editor",
    "agent-social-bot",
    "agent-engage-bot",
    "agent-scanner",
    "agent-outreach",
  ],
};

// ── Core Functions ──

/**
 * Schedule a new meeting.
 */
export async function scheduleMeeting(
  type: string,
  title: string,
  scheduledAt: Date,
  attendees?: string[],
  agenda?: string,
  channelName?: string
): Promise<{ id: string; title: string; type: string; scheduledAt: Date }> {
  try {
    const finalAttendees = attendees || DEFAULT_ATTENDEES[type] || DEFAULT_ATTENDEES.adhoc;

    // Get or create the channel for this meeting
    const channel = channelName || "general";
    const channelRecord = await prisma.chatChannel.findUnique({
      where: { name: channel },
    });

    const meeting = await prisma.meeting.create({
      data: {
        title,
        type,
        channelId: channelRecord?.id || null,
        attendees: finalAttendees,
        agenda: agenda || MEETING_PROMPTS[type] || MEETING_PROMPTS.adhoc,
        scheduledAt,
      },
    });

    console.log(`[MeetingEngine] Scheduled "${title}" (${type}) for ${scheduledAt.toISOString()}`);

    eventBus.emit({
      type: "task_completed",
      agentName: "System",
      message: `Meeting scheduled: "${title}" at ${scheduledAt.toLocaleTimeString()}`,
      metadata: { meetingId: meeting.id, type },
    });

    return {
      id: meeting.id,
      title: meeting.title,
      type: meeting.type,
      scheduledAt: meeting.scheduledAt,
    };
  } catch (err) {
    console.error("[MeetingEngine] Failed to schedule meeting:", err);
    throw err;
  }
}

/**
 * Start a meeting — marks it in_progress and posts announcement to channel.
 */
export async function startMeeting(meetingId: string): Promise<void> {
  try {
    const meeting = await prisma.meeting.findUnique({
      where: { id: meetingId },
    });
    if (!meeting) throw new Error(`Meeting ${meetingId} not found`);
    if (meeting.status === "in_progress") return; // already started
    if (meeting.status === "completed") return; // already done

    // Update status
    await prisma.meeting.update({
      where: { id: meetingId },
      data: {
        status: "in_progress",
        startedAt: new Date(),
      },
    });

    // Find the channel name
    let channelName = "general";
    if (meeting.channelId) {
      const channel = await prisma.chatChannel.findUnique({
        where: { id: meeting.channelId },
      });
      if (channel) channelName = channel.name;
    }

    // Post meeting start message
    await sendMessage(
      channelName,
      "system",
      "System",
      "system",
      `Meeting started: **${meeting.title}** (${meeting.type})\n\n${meeting.agenda || ""}`,
      [],
      "meeting_start",
      { meetingId, type: meeting.type }
    );

    console.log(`[MeetingEngine] Started meeting: ${meeting.title}`);

    // Conduct the meeting (agents take turns)
    await conductMeeting(meetingId);
  } catch (err) {
    console.error("[MeetingEngine] Failed to start meeting:", err);
    throw err;
  }
}

/**
 * Conduct a meeting — each attendee speaks in turn.
 */
export async function conductMeeting(meetingId: string): Promise<void> {
  let meetingChannelName = "general";
  try {
    const meeting = await prisma.meeting.findUnique({
      where: { id: meetingId },
    });
    if (!meeting) return;

    if (meeting.channelId) {
      const channel = await prisma.chatChannel.findUnique({
        where: { id: meeting.channelId },
      });
      if (channel) meetingChannelName = channel.name;
    }
    const channelName = meetingChannelName;

    // Disable loop guard so all 9 agents can speak during meetings
    disableLoopGuard(channelName);

    const prompt = MEETING_PROMPTS[meeting.type] || MEETING_PROMPTS.adhoc;

    // Each attendee speaks in sequence
    for (const agentId of meeting.attendees) {
      try {
        // Give each agent the meeting context to respond to
        const meetingPrompt = `[Meeting: ${meeting.title}] ${prompt}`;
        await triggerAgent(agentId, channelName, meetingPrompt);

        // Small delay between agents to keep things orderly
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (err) {
        console.error(`[MeetingEngine] Agent ${agentId} failed to speak:`, err);
      }
    }

    // After all agents have spoken, end the meeting
    await endMeeting(meetingId);
  } catch (err) {
    console.error("[MeetingEngine] Failed to conduct meeting:", err);
  }
}

/**
 * End a meeting — summarize, extract outcomes, post to channel.
 */
export async function endMeeting(meetingId: string): Promise<void> {
  try {
    const meeting = await prisma.meeting.findUnique({
      where: { id: meetingId },
    });
    if (!meeting) return;

    let channelName = "general";
    if (meeting.channelId) {
      const channel = await prisma.chatChannel.findUnique({
        where: { id: meeting.channelId },
      });
      if (channel) channelName = channel.name;
    }

    // Re-enable loop guard now that meeting is over
    enableLoopGuard(channelName);

    // Get all messages from this meeting (since it started)
    const channel = await prisma.chatChannel.findUnique({
      where: { name: channelName },
    });
    if (!channel) return;

    const meetingMessages = await prisma.channelMessage.findMany({
      where: {
        channelId: channel.id,
        createdAt: { gte: meeting.startedAt || meeting.scheduledAt },
      },
      orderBy: { createdAt: "asc" },
    });

    // Build meeting transcript
    const transcript = meetingMessages
      .filter((m) => m.senderType !== "system")
      .map((m) => `**${m.senderName}:** ${m.content}`)
      .join("\n\n");

    // Summarize with Claude
    let minutes = "No discussion recorded.";
    let outcomes: string[] = [];

    if (transcript.length > 20) {
      try {
        const apiKey = await getRequiredSetting("ANTHROPIC_API_KEY");
        const client = new Anthropic({ apiKey });

        const response = await client.messages.create({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1024,
          messages: [
            {
              role: "user",
              content: `Summarize this team meeting. Extract key points, decisions, and action items.

Meeting: ${meeting.title} (${meeting.type})
Date: ${new Date().toLocaleDateString()}

Transcript:
${transcript}

Format your response as:
## Summary
(2-3 sentence overview)

## Key Points
- point 1
- point 2

## Decisions & Action Items
- decision/action 1
- decision/action 2`,
            },
          ],
        });

        const textBlock = response.content.find((b) => b.type === "text");
        minutes = textBlock?.text ?? minutes;

        // Extract outcomes from the decisions section
        const decisionsMatch = minutes.match(/## Decisions & Action Items\n([\s\S]*?)(?:\n##|$)/);
        if (decisionsMatch) {
          outcomes = decisionsMatch[1]
            .split("\n")
            .filter((line) => line.trim().startsWith("-"))
            .map((line) => line.trim().replace(/^-\s*/, ""));
        }
      } catch (err) {
        console.error("[MeetingEngine] Failed to summarize meeting:", err);
        minutes = `Meeting transcript:\n${transcript.slice(0, 2000)}`;
      }
    }

    // Update meeting record
    await prisma.meeting.update({
      where: { id: meetingId },
      data: {
        status: "completed",
        endedAt: new Date(),
        minutes,
        outcomes,
      },
    });

    // Post summary to channel
    await sendMessage(
      channelName,
      "system",
      "System",
      "system",
      `Meeting ended: **${meeting.title}**\n\n${minutes}`,
      [],
      "meeting_end",
      { meetingId }
    );

    console.log(`[MeetingEngine] Meeting completed: ${meeting.title}`);

    eventBus.emit({
      type: "task_completed",
      agentName: "System",
      message: `Meeting completed: "${meeting.title}" — ${outcomes.length} outcomes`,
      metadata: { meetingId, outcomes },
    });
  } catch (err) {
    console.error("[MeetingEngine] Failed to end meeting:", err);
  }
}

/**
 * Get upcoming meetings.
 */
export async function getUpcomingMeetings(): Promise<
  Array<{
    id: string;
    title: string;
    type: string;
    status: string;
    attendees: string[];
    scheduledAt: Date;
    startedAt: Date | null;
  }>
> {
  try {
    const meetings = await prisma.meeting.findMany({
      where: {
        status: { in: ["scheduled", "in_progress"] },
      },
      orderBy: { scheduledAt: "asc" },
      take: 10,
    });

    return meetings.map((m) => ({
      id: m.id,
      title: m.title,
      type: m.type,
      status: m.status,
      attendees: m.attendees,
      scheduledAt: m.scheduledAt,
      startedAt: m.startedAt,
    }));
  } catch (err) {
    console.error("[MeetingEngine] Failed to get upcoming meetings:", err);
    return [];
  }
}

/**
 * Get all meetings (for listing).
 */
export async function getMeetings(
  limit: number = 20
): Promise<
  Array<{
    id: string;
    title: string;
    type: string;
    status: string;
    attendees: string[];
    scheduledAt: Date;
    startedAt: Date | null;
    endedAt: Date | null;
    minutes: string | null;
    outcomes: string[];
  }>
> {
  try {
    const meetings = await prisma.meeting.findMany({
      orderBy: { scheduledAt: "desc" },
      take: limit,
    });

    return meetings.map((m) => ({
      id: m.id,
      title: m.title,
      type: m.type,
      status: m.status,
      attendees: m.attendees,
      scheduledAt: m.scheduledAt,
      startedAt: m.startedAt,
      endedAt: m.endedAt,
      minutes: m.minutes,
      outcomes: m.outcomes,
    }));
  } catch (err) {
    console.error("[MeetingEngine] Failed to get meetings:", err);
    return [];
  }
}

/**
 * Check and start any meetings that are due.
 * Called by the scheduler every 60 seconds.
 */
export async function checkAndStartMeetings(): Promise<void> {
  try {
    const now = new Date();

    const dueMeetings = await prisma.meeting.findMany({
      where: {
        status: "scheduled",
        scheduledAt: { lte: now },
      },
    });

    for (const meeting of dueMeetings) {
      console.log(`[MeetingEngine] Auto-starting due meeting: ${meeting.title}`);
      try {
        await startMeeting(meeting.id);
      } catch (err) {
        console.error(`[MeetingEngine] Failed to auto-start meeting ${meeting.id}:`, err);
      }
    }
  } catch (err) {
    console.error("[MeetingEngine] checkAndStartMeetings failed:", err);
  }
}

/**
 * Initialize default recurring meetings.
 * Creates daily standup (9am), daily debrief (6pm), weekly retro (Friday 5pm).
 * Schedules the next occurrence of each.
 */
export async function initializeDefaultMeetings(): Promise<void> {
  try {
    const now = new Date();

    // Helper: get next occurrence of a specific hour today or tomorrow
    const getNextTime = (hour: number, minute: number = 0): Date => {
      const target = new Date(now);
      target.setHours(hour, minute, 0, 0);
      if (target <= now) {
        target.setDate(target.getDate() + 1);
      }
      return target;
    };

    // Helper: get next Friday at a specific time
    const getNextFriday = (hour: number): Date => {
      const target = new Date(now);
      const dayOfWeek = target.getDay();
      const daysUntilFriday = (5 - dayOfWeek + 7) % 7 || 7; // next Friday
      target.setDate(target.getDate() + daysUntilFriday);
      target.setHours(hour, 0, 0, 0);
      return target;
    };

    // Check if meetings already exist for today
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const tomorrowStart = new Date(todayStart);
    tomorrowStart.setDate(tomorrowStart.getDate() + 1);

    const existingMeetings = await prisma.meeting.findMany({
      where: {
        scheduledAt: { gte: todayStart, lt: tomorrowStart },
        type: { in: ["standup", "debrief"] },
      },
    });

    const existingTypes = new Set(existingMeetings.map((m) => m.type));

    // Schedule daily standup at 9 AM if not already scheduled
    if (!existingTypes.has("standup")) {
      await scheduleMeeting(
        "standup",
        "Daily Standup",
        getNextTime(9, 0),
        undefined,
        undefined,
        "general"
      );
    }

    // Schedule daily debrief at 6 PM if not already scheduled
    if (!existingTypes.has("debrief")) {
      await scheduleMeeting(
        "debrief",
        "Daily Debrief",
        getNextTime(18, 0),
        undefined,
        undefined,
        "general"
      );
    }

    // Schedule weekly retro (Friday 5pm) if none exists this week
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    const existingRetro = await prisma.meeting.findFirst({
      where: {
        type: "retrospective",
        scheduledAt: { gte: weekStart, lt: weekEnd },
      },
    });

    if (!existingRetro) {
      await scheduleMeeting(
        "retrospective",
        "Weekly Retrospective",
        getNextFriday(17),
        undefined,
        undefined,
        "general"
      );
    }

    console.log("[MeetingEngine] Default meetings initialized");
  } catch (err) {
    console.error("[MeetingEngine] Failed to initialize default meetings:", err);
  }
}
