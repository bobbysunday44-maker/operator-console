import { prisma } from "@/lib/db/prisma";
import { eventBus, startDemoEvents } from "@/lib/events/event-bus";
import type { ActivityEvent } from "@/lib/events/event-bus";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const format = searchParams.get("format");

  // JSON format — return recent activity from database
  if (format === "json") {
    const logs = await prisma.activityLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    return Response.json(logs);
  }

  // SSE stream — real-time events
  startDemoEvents();

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      // Send recent DB events as initial batch
      const recentLogs = await prisma.activityLog.findMany({
        orderBy: { createdAt: "desc" },
        take: 20,
      });

      for (const log of recentLogs.reverse()) {
        const event: ActivityEvent = {
          id: log.id,
          type: log.type as ActivityEvent["type"],
          message: log.message,
          metadata: log.metadata as Record<string, unknown> | undefined,
          timestamp: log.createdAt.getTime(),
        };
        const data = `id: ${event.id}\nevent: activity\ndata: ${JSON.stringify(event)}\n\n`;
        controller.enqueue(encoder.encode(data));
      }

      // Also send any in-memory recent events
      const memoryEvents = eventBus.getRecentEvents(10);
      for (const event of memoryEvents) {
        const data = `id: ${event.id}\nevent: activity\ndata: ${JSON.stringify(event)}\n\n`;
        controller.enqueue(encoder.encode(data));
      }

      // Subscribe to new events
      const unsubscribe = eventBus.subscribe((event: ActivityEvent) => {
        try {
          const data = `id: ${event.id}\nevent: activity\ndata: ${JSON.stringify(event)}\n\n`;
          controller.enqueue(encoder.encode(data));

          // Persist to database (fire and forget)
          prisma.activityLog
            .create({
              data: {
                type: event.type,
                message: event.message,
                source: event.agentName || "system",
                metadata: event.metadata as object || undefined,
              },
            })
            .catch(() => {});
        } catch {
          unsubscribe();
        }
      });

      // Keep-alive ping every 15s
      const keepAlive = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": keepalive\n\n"));
        } catch {
          clearInterval(keepAlive);
          unsubscribe();
        }
      }, 15000);

      // Cleanup when client disconnects
      request.signal.addEventListener("abort", () => {
        clearInterval(keepAlive);
        unsubscribe();
        try {
          controller.close();
        } catch {
          /* already closed */
        }
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
