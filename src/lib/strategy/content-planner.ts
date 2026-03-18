/* ── Content Planner ──
 * Weekly calendar generation with bucket ratios.
 * Ensures content mix follows strategy targets.
 */

import { prisma } from "@/lib/db/prisma";

const DEFAULT_BUCKETS = [
  { name: "educational", targetRatio: 0.35, color: "#3B82F6", description: "Teach something valuable. Tips, tutorials, how-tos, explainers." },
  { name: "entertainment", targetRatio: 0.30, color: "#8B5CF6", description: "Fun, relatable, trending. Memes, reactions, challenges." },
  { name: "behind_the_scenes", targetRatio: 0.15, color: "#F59E0B", description: "Show the process. Raw, authentic, unpolished." },
  { name: "promotional", targetRatio: 0.10, color: "#EF4444", description: "Direct sell. Product features, offers, CTAs." },
  { name: "community", targetRatio: 0.10, color: "#10B981", description: "Engage audience. Polls, Q&A, user-generated, shoutouts." },
];

export async function initializeBuckets(niche: string) {
  const existing = await prisma.contentBucket.count({ where: { niche } });
  if (existing > 0) return existing;

  await prisma.contentBucket.createMany({
    data: DEFAULT_BUCKETS.map((b) => ({
      niche,
      name: b.name,
      targetRatio: b.targetRatio,
      color: b.color,
      description: b.description,
      exampleTitles: [],
    })),
  });

  return DEFAULT_BUCKETS.length;
}

export async function getBucketRatios(niche: string) {
  await initializeBuckets(niche);

  const buckets = await prisma.contentBucket.findMany({ where: { niche } });
  const totalPosts = await prisma.contentCalendar.count({
    where: { niche, status: { in: ["created", "posted"] } },
  });

  const ratios = [];
  for (const bucket of buckets) {
    const bucketPosts = await prisma.contentCalendar.count({
      where: { niche, bucketId: bucket.id, status: { in: ["created", "posted"] } },
    });
    const actualRatio = totalPosts > 0 ? bucketPosts / totalPosts : 0;

    await prisma.contentBucket.update({
      where: { id: bucket.id },
      data: { actualRatio },
    });

    ratios.push({
      id: bucket.id,
      name: bucket.name,
      targetRatio: bucket.targetRatio,
      actualRatio: Math.round(actualRatio * 100) / 100,
      gap: Math.round((bucket.targetRatio - actualRatio) * 100),
      color: bucket.color,
    });
  }

  return ratios;
}

export async function suggestNextContent(niche: string) {
  const ratios = await getBucketRatios(niche);
  const mostUnderRepresented = ratios.sort((a, b) => b.gap - a.gap)[0];

  return {
    bucket: mostUnderRepresented.name,
    gap: mostUnderRepresented.gap,
    suggestion: `Create ${mostUnderRepresented.name} content — currently ${mostUnderRepresented.gap}% below target ratio.`,
  };
}

export async function generateWeeklyCalendar(niche: string, startDate: Date) {
  await initializeBuckets(niche);
  const buckets = await prisma.contentBucket.findMany({ where: { niche } });

  const entries = [];
  const postsPerDay = 2; // configurable
  const totalSlots = 7 * postsPerDay;

  // Distribute slots according to target ratios
  const slotAssignments: { bucketId: string; name: string }[] = [];
  for (const bucket of buckets) {
    const count = Math.round(totalSlots * bucket.targetRatio);
    for (let i = 0; i < count; i++) {
      slotAssignments.push({ bucketId: bucket.id, name: bucket.name });
    }
  }

  // Fill remaining slots with largest bucket
  while (slotAssignments.length < totalSlots) {
    slotAssignments.push({ bucketId: buckets[0].id, name: buckets[0].name });
  }

  // Shuffle for variety
  for (let i = slotAssignments.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [slotAssignments[i], slotAssignments[j]] = [slotAssignments[j], slotAssignments[i]];
  }

  const timeSlots = ["morning", "evening"];

  for (let day = 0; day < 7; day++) {
    for (let slot = 0; slot < postsPerDay; slot++) {
      const idx = day * postsPerDay + slot;
      if (idx >= slotAssignments.length) break;

      const scheduledDate = new Date(startDate);
      scheduledDate.setDate(scheduledDate.getDate() + day);
      scheduledDate.setHours(slot === 0 ? 9 : 18, 0, 0, 0);

      const entry = await prisma.contentCalendar.create({
        data: {
          niche,
          scheduledDate,
          timeSlot: timeSlots[slot],
          bucketId: slotAssignments[idx].bucketId,
          status: "planned",
        },
      });
      entries.push(entry);
    }
  }

  return entries;
}
