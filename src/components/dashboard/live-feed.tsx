"use client";

import { useEffect, useRef, useState } from "react";
import { StatusDot } from "@/components/shared";
import {
  Bot,
  Zap,
  CheckCircle,
  AlertTriangle,
  Send,
  Eye,
  FileText,
  Film,
} from "lucide-react";
import type { ActivityEvent, EventType } from "@/lib/events/event-bus";

/* ── Event type to icon + color mapping ── */
const eventMeta: Record<EventType, { icon: React.ReactNode; dotStatus: string }> = {
  agent_status_change: { icon: <Bot className="w-3.5 h-3.5" />, dotStatus: "active" },
  task_started: { icon: <Zap className="w-3.5 h-3.5" />, dotStatus: "active" },
  task_completed: { icon: <CheckCircle className="w-3.5 h-3.5" />, dotStatus: "connected" },
  pipeline_stage: { icon: <Film className="w-3.5 h-3.5" />, dotStatus: "active" },
  content_created: { icon: <FileText className="w-3.5 h-3.5" />, dotStatus: "connected" },
  post_published: { icon: <Send className="w-3.5 h-3.5" />, dotStatus: "posting" },
  mention_detected: { icon: <Eye className="w-3.5 h-3.5" />, dotStatus: "active" },
  error: { icon: <AlertTriangle className="w-3.5 h-3.5" />, dotStatus: "error" },
};

function timeAgo(ts: number): string {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 5) return "just now";
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

interface LiveFeedProps {
  maxItems?: number;
  className?: string;
  compact?: boolean;
}

export function LiveFeed({ maxItems = 50, className = "", compact = false }: LiveFeedProps) {
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [connected, setConnected] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    const es = new EventSource("/api/activity");
    eventSourceRef.current = es;

    es.addEventListener("activity", (e) => {
      const event: ActivityEvent = JSON.parse(e.data);
      setEvents((prev) => {
        const next = [...prev, event];
        return next.length > maxItems ? next.slice(-maxItems) : next;
      });
    });

    es.onopen = () => setConnected(true);
    es.onerror = () => setConnected(false);

    return () => {
      es.close();
      eventSourceRef.current = null;
    };
  }, [maxItems]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [events]);

  return (
    <div className={className}>
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-section-title text-oc-text">Live Feed</span>
          <div className="flex items-center gap-1.5">
            <div
              className={`w-1.5 h-1.5 rounded-full ${
                connected ? "bg-oc-green animate-pulse" : "bg-oc-red"
              }`}
            />
            <span className="text-tiny text-oc-text-muted">
              {connected ? "Connected" : "Disconnected"}
            </span>
          </div>
        </div>
        <span className="text-tiny text-oc-text-muted">
          {events.length} events
        </span>
      </div>

      {/* Event List */}
      <div
        ref={scrollRef}
        className={`overflow-y-auto space-y-0.5 ${
          compact ? "max-h-[280px]" : "max-h-[400px]"
        }`}
      >
        {events.length === 0 && (
          <div className="text-center py-8 text-small text-oc-text-muted">
            Waiting for events...
          </div>
        )}
        {events.map((event) => {
          const meta = eventMeta[event.type] || eventMeta.agent_status_change;
          return (
            <div
              key={event.id}
              className="flex items-start gap-2.5 py-2 px-2 rounded-oc-sm hover:bg-oc-bg/50 transition-colors"
            >
              <div className="mt-0.5 text-oc-text-muted shrink-0">
                {meta.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  {event.agentName && (
                    <span className="text-small font-semibold text-oc-text">
                      {event.agentName}
                    </span>
                  )}
                  <StatusDot
                    status={meta.dotStatus as "active" | "connected" | "posting" | "error" | "idle"}
                  />
                </div>
                <p className="text-small text-oc-text-secondary truncate">
                  {event.message}
                </p>
              </div>
              <span className="text-tiny text-oc-text-muted shrink-0 mt-0.5">
                {timeAgo(event.timestamp)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
