/* ── Mass Scheduler ──
 * Auto-configure posting schedules for multiple niches.
 * "Post 3x/day per niche across all platforms" in one call.
 */

import { prisma } from "@/lib/db/prisma";

interface MassScheduleConfig {
  niche: string;
  postsPerDay: number;
  startHour?: number;  // first post hour (default 9)
  endHour?: number;    // last post hour (default 21)
  daysOfWeek?: number[]; // 0=Sun, 6=Sat (default all 7)
}

/** Create posting schedules for a niche — evenly distributed throughout the day */
export async function createMassSchedule(config: MassScheduleConfig) {
  const {
    niche,
    postsPerDay,
    startHour = 9,
    endHour = 21,
    daysOfWeek = [0, 1, 2, 3, 4, 5, 6],
  } = config;

  // Validate hours
  if (endHour <= startHour) throw new Error("endHour must be greater than startHour");
  if (postsPerDay > (endHour - startHour)) throw new Error(`postsPerDay (${postsPerDay}) exceeds available hours (${endHour - startHour})`);

  // Calculate evenly spaced posting times
  const interval = Math.max(1, Math.floor((endHour - startHour) / postsPerDay));
  const postTimes: number[] = [];
  for (let i = 0; i < postsPerDay; i++) {
    postTimes.push(startHour + (i * interval));
  }

  // Create cron expression for each time slot
  const dayExpr = daysOfWeek.join(",");
  const schedules = [];

  for (let i = 0; i < postTimes.length; i++) {
    const hour = postTimes[i];
    const cronExpr = `0 ${hour} * * ${dayExpr}`;

    const schedule = await prisma.schedule.create({
      data: {
        name: `${niche} — Post #${i + 1} (${hour}:00)`,
        description: `Auto-scheduled: ${niche} niche, slot ${i + 1} of ${postsPerDay}`,
        cronExpr,
        taskType: "pipeline",
        taskConfig: { niche, autoSelect: true, slot: i + 1 },
        enabled: true,
        nextRunAt: getNextOccurrence(hour, daysOfWeek),
      },
    });
    schedules.push(schedule);
  }

  await prisma.activityLog.create({
    data: {
      type: "success",
      message: `Mass schedule: ${postsPerDay} posts/day for "${niche}" at hours ${postTimes.join(", ")}`,
      source: "system",
    },
  });

  return { schedules, postsPerDay, postTimes };
}

function getNextOccurrence(hour: number, daysOfWeek: number[]): Date {
  const now = new Date();
  const next = new Date(now);
  next.setMinutes(0, 0, 0);

  for (let d = 0; d < 7; d++) {
    const check = new Date(next);
    check.setDate(check.getDate() + d);
    check.setHours(hour);
    if (check > now && daysOfWeek.includes(check.getDay())) {
      return check;
    }
  }

  next.setDate(next.getDate() + 1);
  next.setHours(hour);
  return next;
}

/** Get all schedules for a niche */
export async function getNicheSchedules(niche: string) {
  return prisma.schedule.findMany({
    where: { name: { contains: niche } },
    orderBy: { cronExpr: "asc" },
    include: { runs: { take: 5, orderBy: { startedAt: "desc" } } },
  });
}

/** Delete all mass schedules for a niche */
export async function clearNicheSchedules(niche: string) {
  const deleted = await prisma.schedule.deleteMany({
    where: { name: { startsWith: `${niche} —` } },
  });
  return deleted.count;
}

/** Get overview of all niches and their schedule configs */
export async function getScheduleOverview() {
  const schedules = await prisma.schedule.findMany({
    where: { enabled: true },
    orderBy: { name: "asc" },
  });

  const nicheMap = new Map<string, { count: number; times: string[] }>();
  for (const s of schedules) {
    const niche = s.name.split(" — ")[0] || "Unknown";
    const existing = nicheMap.get(niche) || { count: 0, times: [] };
    existing.count++;
    const hourMatch = s.cronExpr.match(/^\d+ (\d+)/);
    if (hourMatch) existing.times.push(`${hourMatch[1]}:00`);
    nicheMap.set(niche, existing);
  }

  return Array.from(nicheMap.entries()).map(([niche, data]) => ({
    niche,
    postsPerDay: data.count,
    postTimes: data.times,
  }));
}
