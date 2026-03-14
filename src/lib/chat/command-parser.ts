/* ── OpenClaw Command Parser ──
 * Detects natural language commands and extracts parameters.
 * "Create a TikTok about X" → { type: "create_content", params: { platform, topic } }
 */

import type { ParsedCommand } from "./types";
import { eventBus } from "@/lib/events/event-bus";

interface CommandPattern {
  type: ParsedCommand["type"];
  patterns: RegExp[];
  extract: (match: RegExpMatchArray, raw: string) => Record<string, string>;
}

const PLATFORMS = ["tiktok", "instagram", "twitter", "youtube", "all platforms"];

const COMMAND_PATTERNS: CommandPattern[] = [
  {
    type: "create_content",
    patterns: [
      /(?:create|make|generate|produce|build)\s+(?:a\s+)?(?:(?:new\s+)?(?:tiktok|instagram|twitter|youtube|video|post|reel|content))\s+(?:about|on|for|regarding)\s+(.+)/i,
      /(?:create|make|generate)\s+(?:content|a\s+post)\s+(?:about|on|for)\s+(.+)/i,
    ],
    extract: (match, raw) => {
      const topic = match[1]?.trim() || "general";
      const platform = PLATFORMS.find((p) => raw.toLowerCase().includes(p)) || "TikTok";
      return { platform: platform.charAt(0).toUpperCase() + platform.slice(1), topic };
    },
  },
  {
    type: "check_status",
    patterns: [
      /(?:what(?:'s| is)?\s+(?:the\s+)?status|check\s+(?:the\s+)?status|how(?:'s| is)\s+(?:the\s+)?pipeline|progress)/i,
      /(?:status|progress)\s+(?:of|on|for)\s+(.+)/i,
    ],
    extract: (match) => {
      return { contentId: match[1]?.trim() || "latest" };
    },
  },
  {
    type: "list_agents",
    patterns: [
      /(?:how\s+are\s+(?:my\s+)?agents|show\s+(?:me\s+)?agents|agent\s+(?:status|fleet|list)|list\s+agents)/i,
      /(?:what\s+agents?\s+(?:are|is))/i,
    ],
    extract: () => ({}),
  },
  {
    type: "run_pipeline",
    patterns: [
      /(?:run|start|execute|launch|kick\s+off)\s+(?:the\s+)?(?:full\s+)?pipeline/i,
      /(?:run|start)\s+(?:the\s+)?(?:creation\s+)?studio/i,
    ],
    extract: (_match, raw) => {
      const topic = raw.replace(_match[0], "").trim();
      return topic ? { topic } : { topic: "" };
    },
  },
];

export function parseCommand(input: string): ParsedCommand | null {
  const trimmed = input.trim();

  for (const cmd of COMMAND_PATTERNS) {
    for (const pattern of cmd.patterns) {
      const match = trimmed.match(pattern);
      if (match) {
        return {
          type: cmd.type,
          raw: trimmed,
          params: cmd.extract(match, trimmed),
          dispatched: false,
        };
      }
    }
  }

  return null;
}

/** Dispatch a parsed command — emits events and returns a status message */
export function dispatchCommand(command: ParsedCommand): string {
  command.dispatched = true;

  switch (command.type) {
    case "create_content": {
      const { platform, topic } = command.params;
      eventBus.emit({
        type: "task_started",
        agentName: "Writer",
        agentId: "agent-writer",
        message: `Pipeline triggered: "${topic}" for ${platform}`,
        metadata: { platform, topic, source: "chat-command" },
      });
      return `Starting content pipeline for **${platform}**:\n\n**Topic:** ${topic}\n\n1. Prompt Writer → generating script\n2. Image Gen → scene visuals\n3. Video Gen → motion content\n4. Voiceover → narration\n5. Assembly → final export\n\nTrack progress in the **Studio** tab.`;
    }

    case "check_status":
      return "CNT-0047 status:\n- ✅ Prompt Writer — 2.1s, $0.003\n- ✅ Image Gen — 4.8s, $0.002\n- 🔄 Video Gen — 67% (Veo 3.1)\n- ⏳ Voiceover — queued\n- ⏳ Assembly — queued\n\nEstimated completion: ~30 seconds.";

    case "list_agents": {
      eventBus.emit({
        type: "agent_status_change",
        agentName: "System",
        message: "Agent fleet status requested via chat",
      });
      return "Fetching agent fleet status... Check the **Agents** tab for live details.";
    }

    case "run_pipeline":
      eventBus.emit({
        type: "pipeline_stage",
        agentName: "System",
        message: "Full pipeline run triggered via chat command",
      });
      return "Full pipeline run initiated. Monitor progress in the **Studio** tab.";

    default:
      return "Command recognized but not yet implemented.";
  }
}
