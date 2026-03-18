/* ── Series Manager ──
 * Manage recurring content series with episode tracking.
 */

import { prisma } from "@/lib/db/prisma";

export async function createSeries(data: {
  niche: string;
  name: string;
  description?: string;
  templatePrompt?: string;
  characterId?: string;
  schedule?: string;
}) {
  return prisma.contentSeries.create({ data });
}

export async function generateNextEpisode(seriesId: string) {
  const series = await prisma.contentSeries.findUnique({ where: { id: seriesId } });
  if (!series || !series.isActive) throw new Error("Series not found or inactive");

  const episodeNum = series.nextEpisodeNum;
  const title = `${series.name} — Episode ${episodeNum}`;

  const content = await prisma.contentItem.create({
    data: {
      title,
      description: series.description || `Episode ${episodeNum} of ${series.name}`,
      niche: series.niche,
      tags: [`series:${series.name}`, `ep${episodeNum}`],
      status: "idea",
      targetPlatforms: [],
    },
  });

  await prisma.contentSeries.update({
    where: { id: seriesId },
    data: {
      episodeCount: { increment: 1 },
      nextEpisodeNum: episodeNum + 1,
    },
  });

  return content;
}

export async function getActiveSeries(niche?: string) {
  return prisma.contentSeries.findMany({
    where: { isActive: true, ...(niche ? { niche } : {}) },
    orderBy: { updatedAt: "desc" },
  });
}
