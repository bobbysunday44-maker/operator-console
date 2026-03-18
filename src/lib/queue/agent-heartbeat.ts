/* ── Agent Heartbeat Monitor ──
 * Runs every 30 seconds. Checks agent lastHeartbeat:
 * - No heartbeat in 60s → idle
 * - No heartbeat in 300s → offline
 * Workers call POST /api/agents/[id]/heartbeat to stay active.
 */

import { prisma } from "@/lib/db/prisma";
import { eventBus } from "@/lib/events/event-bus";

let heartbeatInterval: ReturnType<typeof setInterval> | null = null;

async function checkHeartbeats() {
  try {
    const agents = await prisma.agent.findMany({
      where: { status: { in: ["active", "idle"] } },
      select: { id: true, name: true, status: true, lastHeartbeat: true },
    });

    const now = Date.now();

    for (const agent of agents) {
      if (!agent.lastHeartbeat) continue;

      const elapsed = now - agent.lastHeartbeat.getTime();

      if (elapsed > 300_000 && agent.status !== "offline") {
        // 5 minutes — mark offline
        await prisma.agent.update({
          where: { id: agent.id },
          data: { status: "offline", currentTask: null },
        });
        eventBus.emit({
          type: "agent_status_change",
          agentId: agent.id,
          agentName: agent.name,
          message: `${agent.name} went offline (no heartbeat for 5 min)`,
        });
      } else if (elapsed > 60_000 && agent.status === "active") {
        // 1 minute — mark idle
        await prisma.agent.update({
          where: { id: agent.id },
          data: { status: "idle", currentTask: null },
        });
        eventBus.emit({
          type: "agent_status_change",
          agentId: agent.id,
          agentName: agent.name,
          message: `${agent.name} is idle (no heartbeat for 60s)`,
        });
      }
    }
  } catch (err) {
    console.error("[Heartbeat] Error:", err);
  }
}

export function startHeartbeatMonitor() {
  if (heartbeatInterval) return;
  console.log("[Heartbeat] Monitor started — checking every 30s");
  heartbeatInterval = setInterval(checkHeartbeats, 30_000);
}

export function stopHeartbeatMonitor() {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
  }
}
