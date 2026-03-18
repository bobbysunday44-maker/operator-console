/* ── OpenClaw EventBus ──
 * In-memory pub/sub for real-time activity events.
 * Broadcasts to connected SSE clients.
 * No demo events — only real system events.
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
