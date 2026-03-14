import { eventBus, startDemoEvents } from "@/lib/events/event-bus";
import type { ActivityEvent } from "@/lib/events/event-bus";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  // Start demo events on first SSE connection
  startDemoEvents();

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      // Send recent events as initial batch
      const recent = eventBus.getRecentEvents(20);
      for (const event of recent) {
        const data = `id: ${event.id}\nevent: activity\ndata: ${JSON.stringify(event)}\n\n`;
        controller.enqueue(encoder.encode(data));
      }

      // Subscribe to new events
      const unsubscribe = eventBus.subscribe((event: ActivityEvent) => {
        try {
          const data = `id: ${event.id}\nevent: activity\ndata: ${JSON.stringify(event)}\n\n`;
          controller.enqueue(encoder.encode(data));
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
        try { controller.close(); } catch { /* already closed */ }
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
