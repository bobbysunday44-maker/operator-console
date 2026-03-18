/* ── Content Aggregator ──
 * Deduplicates trending topics, boosts virality for cross-platform trends,
 * and tags them for Opus to review.
 */

import { prisma } from "@/lib/db/prisma";

function wordOverlap(a: string, b: string): number {
  const wordsA = new Set(a.toLowerCase().split(/\s+/).filter((w) => w.length > 3));
  const wordsB = new Set(b.toLowerCase().split(/\s+/).filter((w) => w.length > 3));
  if (wordsA.size === 0 || wordsB.size === 0) return 0;
  let overlap = 0;
  Array.from(wordsA).forEach((word) => {
    if (wordsB.has(word)) overlap++;
  });
  return overlap / Math.max(wordsA.size, wordsB.size);
}

export async function aggregateTopics(): Promise<number> {
  const newTopics = await prisma.trendingTopic.findMany({
    where: { status: "new" },
    orderBy: { viralityScore: "desc" },
  });

  if (newTopics.length === 0) return 0;

  let processed = 0;

  // Group similar topics and boost virality for cross-platform
  const seen = new Set<string>();

  for (let i = 0; i < newTopics.length; i++) {
    const topic = newTopics[i];
    if (seen.has(topic.id)) continue;

    // Find duplicates by title similarity
    const duplicates = [];
    for (let j = i + 1; j < newTopics.length; j++) {
      const other = newTopics[j];
      if (seen.has(other.id)) continue;

      if (wordOverlap(topic.title, other.title) > 0.5) {
        duplicates.push(other);
        seen.add(other.id);
      }
    }

    // Boost virality if found on multiple platforms
    let boostedScore = topic.viralityScore;
    const platforms = new Set([topic.platform]);
    for (const dup of duplicates) {
      if (dup.platform) platforms.add(dup.platform);
      boostedScore = Math.min(100, boostedScore + 10); // +10 per duplicate
    }

    // Merge tags from duplicates
    const allTags = new Set(topic.tags);
    for (const dup of duplicates) {
      for (const tag of dup.tags) allTags.add(tag);
    }

    // Update the primary topic
    await prisma.trendingTopic.update({
      where: { id: topic.id },
      data: {
        viralityScore: boostedScore,
        tags: Array.from(allTags),
        status: "reviewed",
        description: duplicates.length > 0
          ? `${topic.description || ""} [Trending on ${Array.from(platforms).join(", ")}]`
          : topic.description,
      },
    });

    // Dismiss duplicates
    for (const dup of duplicates) {
      await prisma.trendingTopic.update({
        where: { id: dup.id },
        data: { status: "dismissed" },
      });
    }

    seen.add(topic.id);
    processed++;
  }

  return processed;
}
