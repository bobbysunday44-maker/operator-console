/* ── Next.js Instrumentation ──
 * Runs once when the Next.js server starts.
 * Initializes BullMQ workers and the schedule runner.
 */

export async function register() {
  // Only run on the server (not during build or in browser)
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { initializeWorkers } = await import("@/lib/queue/startup");
    initializeWorkers();
  }
}
