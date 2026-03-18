/* ── Worker Startup ──
 * Initializes all BullMQ workers, scheduler, and heartbeat monitor.
 * Called once when the Next.js server starts via instrumentation.ts.
 */

import { createPipelineWorker } from "@/lib/pipeline/workers";
import { createSocialWorker } from "@/lib/social/publisher";
import { startScheduler } from "./scheduler";
import { startHeartbeatMonitor } from "./agent-heartbeat";
import { startAgentDispatcher } from "./agent-dispatcher";
import { startVoiceServer } from "@/lib/voice/voice-launcher";

let initialized = false;

export function initializeWorkers() {
  if (initialized) return;
  initialized = true;

  console.log("[Workers] Initializing background workers...");

  // Start pipeline worker
  const pipelineWorker = createPipelineWorker();
  pipelineWorker.on("completed", (job) => {
    console.log(`[Pipeline] Job ${job.name} completed for ${job.data.contentItemId}`);
  });
  pipelineWorker.on("failed", (job, err) => {
    console.error(`[Pipeline] Job ${job?.name} failed:`, err.message);
  });

  // Start social posting worker
  const socialWorker = createSocialWorker();
  socialWorker.on("completed", (job) => {
    console.log(`[Social] Post ${job.data.postId} published`);
  });
  socialWorker.on("failed", (job, err) => {
    console.error(`[Social] Post ${job?.data.postId} failed:`, err.message);
  });

  // Start scheduler (checks cron every 60s)
  startScheduler();

  // Start heartbeat monitor (checks agent status every 30s)
  startHeartbeatMonitor();

  // Start agent task dispatcher (assigns idle agents to pending tasks every 15s)
  startAgentDispatcher();

  // Start Qwen3-TTS voice server (auto-spawns Python process)
  startVoiceServer();

  // Schedule periodic mention scanning (every 30 minutes)
  setInterval(async () => {
    try {
      const { scanMentions } = await import("@/lib/social/mention-scanner");
      const { generateReplyDrafts } = await import("@/lib/social/auto-reply");
      const found = await scanMentions();
      if (found > 0) await generateReplyDrafts();
    } catch (err) {
      console.error("[MentionScan] Periodic scan failed:", err);
    }
  }, 30 * 60 * 1000);

  // Schedule automatic trend scanning (every 6 hours)
  setInterval(async () => {
    try {
      const { scanTrends } = await import("@/lib/research/trend-scanner");
      const { aggregateTopics } = await import("@/lib/research/aggregator");
      console.log("[TrendScan] Running scheduled trend scan...");
      const found = await scanTrends();
      if (found > 0) await aggregateTopics();
      console.log(`[TrendScan] Found ${found} new trending topics`);
    } catch (err) {
      console.error("[TrendScan] Scheduled scan failed:", err);
    }
  }, 6 * 60 * 60 * 1000);

  // Run initial trend scan 2 minutes after startup
  setTimeout(async () => {
    try {
      const { scanTrends } = await import("@/lib/research/trend-scanner");
      const { aggregateTopics } = await import("@/lib/research/aggregator");
      console.log("[TrendScan] Running initial scan...");
      const found = await scanTrends();
      if (found > 0) await aggregateTopics();
      console.log(`[TrendScan] Initial scan found ${found} topics`);
    } catch (err) {
      console.error("[TrendScan] Initial scan failed:", err);
    }
  }, 2 * 60 * 1000);

  // Feature 1: Performance tracking every 2 hours
  setInterval(async () => {
    try {
      const { trackPerformance } = await import("@/lib/analytics/performance-tracker");
      const { generateLearnings } = await import("@/lib/analytics/feedback-engine");
      const { learnFromPerformance, forgetLowConfidence } = await import("@/lib/memory/brand-memory");
      await trackPerformance();
      // Generate learnings for all active niches
      const niches = await import("@/lib/db/prisma").then((m) =>
        m.prisma.contentItem.findMany({ select: { niche: true }, distinct: ["niche"], where: { niche: { not: null } } })
      );
      for (const { niche } of niches) {
        if (niche) {
          await generateLearnings(niche);
          await learnFromPerformance(niche);
        }
      }
      await forgetLowConfidence();
    } catch (err) {
      console.error("[PerfTracker] Error:", err);
    }
  }, 2 * 60 * 60 * 1000);

  // Feature 3: A/B test evaluation every 4 hours
  setInterval(async () => {
    try {
      const { autoCheckTests } = await import("@/lib/testing/ab-test-engine");
      await autoCheckTests();
    } catch (err) {
      console.error("[ABTest] Auto-check error:", err);
    }
  }, 4 * 60 * 60 * 1000);

  // Feature 8: Reset daily rate limits at midnight
  setInterval(async () => {
    const now = new Date();
    if (now.getHours() === 0 && now.getMinutes() < 2) {
      const { resetDailyCounts } = await import("@/lib/social/rate-limiter");
      await resetDailyCounts();
      console.log("[RateLimiter] Daily counts reset");
    }
  }, 60 * 1000);

  // Phase 10: Agent think loop (perceive → think → act every 15 seconds)
  import("@/lib/agent-runtime/think-loop")
    .then(({ startThinkLoopWorker }) => startThinkLoopWorker())
    .catch((err) => console.error("[ThinkLoop] Failed to start:", err));

  // Phase 12: Meeting scheduler (checks every 60 seconds for due meetings)
  setInterval(async () => {
    try {
      const { checkAndStartMeetings } = await import("@/lib/agent-runtime/meeting-engine");
      await checkAndStartMeetings();
    } catch (err) {
      console.error("[MeetingScheduler] Check failed:", err);
    }
  }, 60_000);

  // Initialize default meetings 30 seconds after startup
  setTimeout(async () => {
    try {
      const { initializeDefaultMeetings } = await import("@/lib/agent-runtime/meeting-engine");
      await initializeDefaultMeetings();
    } catch (err) {
      console.error("[MeetingScheduler] Failed to initialize default meetings:", err);
    }
  }, 30_000);

  console.log("[Workers] All workers initialized — scanner, dispatcher, heartbeat, mention, trend scan, performance, AB test, rate limiter, think loop, meeting scheduler");
}
