/* ── Model Usage Logger ──
 * Writes to ModelUsageLog after every AI API call.
 * Used by all pipeline workers and chat handlers.
 */

import { prisma } from "@/lib/db/prisma";
import type { ModelProvider } from "@/generated/prisma/client";

export interface UsageEntry {
  model: ModelProvider;
  taskType: string;
  agentId?: string;
  tokensIn: number;
  tokensOut: number;
  cost: number;
  latency: number; // milliseconds
  success: boolean;
  error?: string;
}

export async function logModelUsage(entry: UsageEntry): Promise<void> {
  try {
    await prisma.modelUsageLog.create({
      data: {
        model: entry.model,
        taskType: entry.taskType,
        agentId: entry.agentId,
        tokensIn: entry.tokensIn,
        tokensOut: entry.tokensOut,
        cost: entry.cost,
        latency: entry.latency,
        success: entry.success,
        error: entry.error,
      },
    });
    // Note: callers emit their own events — no duplicate event here
  } catch (err) {
    console.error("[UsageLogger] Failed to log usage:", err);
  }
}
