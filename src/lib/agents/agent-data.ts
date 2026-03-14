/* ── OpenClaw Agent Definitions ──
 * 8 agents from the master plan.
 * This is the seed data + in-memory store until Prisma/Postgres is connected.
 */

export type AgentStatus = "online" | "offline" | "busy" | "error";

export interface Agent {
  id: string;
  name: string;
  role: string;
  description: string;
  model: string;
  status: AgentStatus;
  currentTask: string | null;
  tasksCompleted: number;
  tokensUsed: number;
  costToday: number;
  uptime: number; // seconds
  lastHeartbeat: number; // unix ms
  capabilities: string[];
}

const now = Date.now();

const SEED_AGENTS: Agent[] = [
  {
    id: "agent-ideator",
    name: "Ideator",
    role: "Content Strategist",
    description:
      "Scans trends, generates content ideas, and builds content calendars. First stage of every pipeline.",
    model: "Claude Sonnet 4.6",
    status: "online",
    currentTask: "Scanning TikTok trends",
    tasksCompleted: 147,
    tokensUsed: 2_840_000,
    costToday: 1.42,
    uptime: 86400,
    lastHeartbeat: now,
    capabilities: ["trend-scanning", "idea-generation", "content-calendar", "audience-analysis"],
  },
  {
    id: "agent-writer",
    name: "Writer",
    role: "Script & Copy Writer",
    description:
      "Writes video scripts, social media captions, blog posts, and all text content. Adapts tone per platform.",
    model: "Claude Sonnet 4.6",
    status: "busy",
    currentTask: "Writing TikTok script #CNT-0048",
    tasksCompleted: 312,
    tokensUsed: 5_120_000,
    costToday: 2.56,
    uptime: 86400,
    lastHeartbeat: now,
    capabilities: ["script-writing", "caption-generation", "blog-posts", "tone-adaptation"],
  },
  {
    id: "agent-designer",
    name: "Designer",
    role: "Image Generator",
    description:
      "Generates images via Gemini Nano Banana 2 with character consistency. Handles scenes, thumbnails, and reference images.",
    model: "Gemini Nano Banana 2",
    status: "online",
    currentTask: null,
    tasksCompleted: 89,
    tokensUsed: 1_200_000,
    costToday: 0.84,
    uptime: 72000,
    lastHeartbeat: now,
    capabilities: ["image-generation", "character-consistency", "scene-composition", "thumbnails"],
  },
  {
    id: "agent-filmmaker",
    name: "Filmmaker",
    role: "Video Producer",
    description:
      "Generates video clips via Gemini Veo 3.1 using first/last frame guidance and character references.",
    model: "Gemini Veo 3.1",
    status: "online",
    currentTask: null,
    tasksCompleted: 34,
    tokensUsed: 800_000,
    costToday: 1.20,
    uptime: 72000,
    lastHeartbeat: now,
    capabilities: ["video-generation", "frame-guidance", "character-refs", "vertical-video"],
  },
  {
    id: "agent-editor",
    name: "Editor",
    role: "Quality & Assembly",
    description:
      "Reviews content quality (scoring 1-10), triggers edge-tts voiceover, runs FFmpeg assembly, and manages the quality gate.",
    model: "Claude Sonnet 4.6",
    status: "offline",
    currentTask: null,
    tasksCompleted: 28,
    tokensUsed: 640_000,
    costToday: 0.32,
    uptime: 0,
    lastHeartbeat: now - 120_000,
    capabilities: ["quality-review", "voiceover", "video-assembly", "quality-gate"],
  },
  {
    id: "agent-social-bot",
    name: "Social Bot",
    role: "Post Publisher",
    description:
      "Publishes content across platforms via Chrome automation. Handles scheduling, optimal timing, and rate limiting.",
    model: "Claude Sonnet 4.6",
    status: "online",
    currentTask: "Posting to Instagram @digitalcreator",
    tasksCompleted: 256,
    tokensUsed: 980_000,
    costToday: 0.49,
    uptime: 86400,
    lastHeartbeat: now,
    capabilities: ["chrome-posting", "scheduling", "rate-limiting", "multi-platform"],
  },
  {
    id: "agent-engage-bot",
    name: "Engage Bot",
    role: "Community Manager",
    description:
      "Monitors mentions, responds to comments, manages conversations. Maintains brand voice across all interactions.",
    model: "Claude Sonnet 4.6",
    status: "busy",
    currentTask: "Replying to 3 Twitter mentions",
    tasksCompleted: 891,
    tokensUsed: 3_400_000,
    costToday: 1.70,
    uptime: 86400,
    lastHeartbeat: now,
    capabilities: ["mention-monitoring", "auto-reply", "conversation-management", "sentiment-analysis"],
  },
  {
    id: "agent-scanner",
    name: "Scanner",
    role: "Trend & Competitor Analyst",
    description:
      "Continuous monitoring of social media trends, competitor activity, and viral content. Feeds insights to Ideator.",
    model: "Claude Sonnet 4.6",
    status: "online",
    currentTask: "Monitoring trending hashtags",
    tasksCompleted: 1_204,
    tokensUsed: 4_100_000,
    costToday: 2.05,
    uptime: 86400,
    lastHeartbeat: now,
    capabilities: ["trend-monitoring", "competitor-analysis", "viral-detection", "hashtag-tracking"],
  },
];

/* ── In-Memory Store ──
 * Mutable copy of seed data. Will be replaced by Prisma queries once DB is live.
 */
let agents: Agent[] = JSON.parse(JSON.stringify(SEED_AGENTS));

export function getAllAgents(): Agent[] {
  return agents;
}

export function getAgentById(id: string): Agent | undefined {
  return agents.find((a) => a.id === id);
}

export function updateAgent(id: string, updates: Partial<Agent>): Agent | null {
  const idx = agents.findIndex((a) => a.id === id);
  if (idx === -1) return null;
  agents[idx] = { ...agents[idx], ...updates };
  return agents[idx];
}

export function recordHeartbeat(id: string): Agent | null {
  return updateAgent(id, { lastHeartbeat: Date.now(), status: "online" });
}

export function getAgentStats() {
  const online = agents.filter((a) => a.status === "online").length;
  const busy = agents.filter((a) => a.status === "busy").length;
  const offline = agents.filter((a) => a.status === "offline").length;
  const error = agents.filter((a) => a.status === "error").length;
  const totalTasks = agents.reduce((sum, a) => sum + a.tasksCompleted, 0);
  const totalTokens = agents.reduce((sum, a) => sum + a.tokensUsed, 0);
  const totalCostToday = agents.reduce((sum, a) => sum + a.costToday, 0);
  return { total: agents.length, online, busy, offline, error, totalTasks, totalTokens, totalCostToday };
}

export function resetAgents() {
  agents = JSON.parse(JSON.stringify(SEED_AGENTS));
}
