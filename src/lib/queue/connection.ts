/* ── Redis Connection for BullMQ ──
 * Connection options for BullMQ queues and workers.
 * Uses BullMQ's own IORedis to avoid version conflicts.
 * Redis runs on port 6380 (Docker).
 */

import type { ConnectionOptions } from "bullmq";

function parseRedisUrl(url: string): ConnectionOptions {
  try {
    const parsed = new URL(url);
    return {
      host: parsed.hostname || "localhost",
      port: parseInt(parsed.port || "6379", 10),
      password: parsed.password || undefined,
      maxRetriesPerRequest: null,
    };
  } catch {
    return { host: "localhost", port: 6380, maxRetriesPerRequest: null };
  }
}

export const redisConnection: ConnectionOptions = parseRedisUrl(
  process.env.REDIS_URL || "redis://localhost:6380"
);
