/* ── Agent Heartbeat System ──
 * Monitors agent liveness. Marks agents as offline if no heartbeat
 * received within the timeout window (default: 60 seconds).
 */

import { getAllAgents, updateAgent } from "./agent-data";
import { eventBus } from "@/lib/events/event-bus";

const HEARTBEAT_TIMEOUT_MS = 60_000; // 60 seconds
const CHECK_INTERVAL_MS = 15_000; // check every 15 seconds

let checkInterval: ReturnType<typeof setInterval> | null = null;

export function checkHeartbeats(): string[] {
  const now = Date.now();
  const markedOffline: string[] = [];

  for (const agent of getAllAgents()) {
    if (agent.status === "offline") continue;

    const elapsed = now - agent.lastHeartbeat;
    if (elapsed > HEARTBEAT_TIMEOUT_MS) {
      updateAgent(agent.id, { status: "offline", currentTask: null, uptime: 0 });
      markedOffline.push(agent.id);

      eventBus.emit({
        type: "agent_status_change",
        agentId: agent.id,
        agentName: agent.name,
        message: `Went offline — no heartbeat for ${Math.floor(elapsed / 1000)}s`,
      });
    }
  }

  return markedOffline;
}

export function startHeartbeatMonitor() {
  if (checkInterval) return;
  checkInterval = setInterval(checkHeartbeats, CHECK_INTERVAL_MS);
}

export function stopHeartbeatMonitor() {
  if (checkInterval) {
    clearInterval(checkInterval);
    checkInterval = null;
  }
}
