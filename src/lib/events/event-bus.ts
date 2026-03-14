/* ── OpenClaw EventBus ──
 * In-memory pub/sub for real-time activity events.
 * Broadcasts to connected SSE clients.
 * Will be replaced by Redis pub/sub once infra is connected.
 */

export type EventType =
  | "agent_status_change"
  | "task_started"
  | "task_completed"
  | "pipeline_stage"
  | "content_created"
  | "post_published"
  | "mention_detected"
  | "error";

export interface ActivityEvent {
  id: string;
  type: EventType;
  agentId?: string;
  agentName?: string;
  message: string;
  metadata?: Record<string, unknown>;
  timestamp: number;
}

type Listener = (event: ActivityEvent) => void;

class EventBus {
  private listeners = new Set<Listener>();
  private eventCounter = 0;
  private recentEvents: ActivityEvent[] = [];
  private maxRecent = 50;

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  emit(event: Omit<ActivityEvent, "id" | "timestamp">): ActivityEvent {
    this.eventCounter++;
    const full: ActivityEvent = {
      ...event,
      id: `evt-${this.eventCounter}`,
      timestamp: Date.now(),
    };

    this.recentEvents.push(full);
    if (this.recentEvents.length > this.maxRecent) {
      this.recentEvents.shift();
    }

    Array.from(this.listeners).forEach((listener) => {
      try {
        listener(full);
      } catch {
        // don't let one bad listener break others
      }
    });

    return full;
  }

  getRecentEvents(limit = 20): ActivityEvent[] {
    return this.recentEvents.slice(-limit);
  }

  get listenerCount(): number {
    return this.listeners.size;
  }
}

/* ── Singleton ── */
const globalForBus = globalThis as unknown as { eventBus: EventBus };
export const eventBus = globalForBus.eventBus || new EventBus();
if (process.env.NODE_ENV !== "production") {
  globalForBus.eventBus = eventBus;
}

/* ── Demo event emitter (runs every 5s in dev to show life) ── */
const DEMO_EVENTS: Omit<ActivityEvent, "id" | "timestamp">[] = [
  { type: "agent_status_change", agentId: "agent-ideator", agentName: "Ideator", message: "Started scanning TikTok trending page" },
  { type: "task_completed", agentId: "agent-writer", agentName: "Writer", message: "Finished script for CNT-0048 (1,240 tokens)" },
  { type: "pipeline_stage", agentId: "agent-designer", agentName: "Designer", message: "Generating scene image with 3 character refs" },
  { type: "mention_detected", agentId: "agent-scanner", agentName: "Scanner", message: "New mention on Twitter: @user123 tagged us" },
  { type: "post_published", agentId: "agent-social-bot", agentName: "Social Bot", message: "Published to Instagram — 12 likes in first minute" },
  { type: "task_started", agentId: "agent-engage-bot", agentName: "Engage Bot", message: "Responding to 3 Twitter mentions" },
  { type: "content_created", agentId: "agent-editor", agentName: "Editor", message: "Quality score 8.4/10 for CNT-0047 — approved" },
  { type: "agent_status_change", agentId: "agent-filmmaker", agentName: "Filmmaker", message: "Veo 3.1 video generation started (9:16 vertical)" },
];

let demoIndex = 0;
let demoInterval: ReturnType<typeof setInterval> | null = null;

export function startDemoEvents() {
  if (demoInterval) return;
  // Emit initial batch
  for (let i = 0; i < 5; i++) {
    eventBus.emit(DEMO_EVENTS[i % DEMO_EVENTS.length]);
  }
  // Then one every 5 seconds
  demoInterval = setInterval(() => {
    eventBus.emit(DEMO_EVENTS[demoIndex % DEMO_EVENTS.length]);
    demoIndex++;
  }, 5000);
}

export function stopDemoEvents() {
  if (demoInterval) {
    clearInterval(demoInterval);
    demoInterval = null;
  }
}
