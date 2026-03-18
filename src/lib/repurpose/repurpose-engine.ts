/* ── Content Repurposing Engine ──
 * Takes one content item and generates platform-specific versions
 * using Claude Sonnet for intelligent adaptation.
 */

import { prisma } from "@/lib/db/prisma";
import Anthropic from "@anthropic-ai/sdk";

// ── Types ──

interface RepurposeFormat {
  format: string;
  platform: string;
  label: string;
  aspectRatio: string;
}

interface ClaudeRepurposeResult {
  format: string;
  platform: string;
  title: string;
  script: string;
  caption: string;
  hashtags: string[];
  aspectRatio: string;
}

// ── Available repurpose formats ──

const REPURPOSE_FORMATS: RepurposeFormat[] = [
  { format: "short_clip", platform: "TikTok", label: "Short Clip (TikTok)", aspectRatio: "9:16" },
  { format: "short_clip", platform: "YouTube", label: "Short Clip (YouTube Shorts)", aspectRatio: "9:16" },
  { format: "short_clip", platform: "Instagram", label: "Reel (Instagram)", aspectRatio: "9:16" },
  { format: "carousel", platform: "Instagram", label: "Carousel (Instagram)", aspectRatio: "1:1" },
  { format: "carousel", platform: "LinkedIn", label: "Carousel (LinkedIn)", aspectRatio: "1:1" },
  { format: "quote_card", platform: "Instagram", label: "Quote Card (Instagram)", aspectRatio: "1:1" },
  { format: "quote_card", platform: "Twitter/X", label: "Quote Card (Twitter/X)", aspectRatio: "16:9" },
  { format: "audiogram", platform: "Instagram", label: "Audiogram (Instagram)", aspectRatio: "1:1" },
  { format: "audiogram", platform: "TikTok", label: "Audiogram (TikTok)", aspectRatio: "9:16" },
  { format: "blog_excerpt", platform: "LinkedIn", label: "Blog Excerpt (LinkedIn)", aspectRatio: "16:9" },
  { format: "blog_excerpt", platform: "Twitter/X", label: "Blog Excerpt (Twitter/X)", aspectRatio: "16:9" },
  { format: "thread", platform: "Twitter/X", label: "Thread (Twitter/X)", aspectRatio: "16:9" },
  { format: "thread", platform: "LinkedIn", label: "Thread (LinkedIn)", aspectRatio: "16:9" },
  { format: "story", platform: "Instagram", label: "Story (Instagram)", aspectRatio: "9:16" },
  { format: "story", platform: "TikTok", label: "Story (TikTok)", aspectRatio: "9:16" },
  { format: "story", platform: "YouTube", label: "Story (YouTube)", aspectRatio: "9:16" },
];

// ── Get Claude API key from settings ──

async function getAnthropicKey(): Promise<string> {
  const setting = await prisma.setting.findUnique({ where: { key: "ANTHROPIC_API_KEY" } });
  if (!setting?.value) throw new Error("ANTHROPIC_API_KEY not configured in Settings");
  return setting.value;
}

// ── Main repurpose function ──

export async function repurposeContent(
  contentItemId: string,
  targetFormats: string[]
): Promise<{ id: string; title: string; format: string; platform: string; status: string }[]> {
  // 1. Fetch the source content
  const source = await prisma.contentItem.findUnique({
    where: { id: contentItemId },
    select: {
      id: true,
      title: true,
      description: true,
      script: true,
      tags: true,
      targetPlatforms: true,
      niche: true,
    },
  });

  if (!source) throw new Error("Content item not found");

  // 2. Resolve which formats to generate
  // targetFormats is like ["short_clip:TikTok", "carousel:Instagram", "thread:Twitter/X"]
  const resolved: RepurposeFormat[] = [];
  for (const tf of targetFormats) {
    const [format, platform] = tf.split(":");
    const match = REPURPOSE_FORMATS.find(
      (f) => f.format === format && f.platform === platform
    );
    if (match) resolved.push(match);
  }

  if (resolved.length === 0) {
    throw new Error("No valid target formats specified. Use format:platform (e.g. short_clip:TikTok)");
  }

  // 3. Call Claude to generate platform-specific versions
  const apiKey = await getAnthropicKey();
  const anthropic = new Anthropic({ apiKey });

  const formatDescriptions = resolved
    .map((f) => `- ${f.format} for ${f.platform} (aspect ratio: ${f.aspectRatio})`)
    .join("\n");

  const prompt = `You have this original content:

Title: ${source.title}
Description: ${source.description || "N/A"}
Script: ${source.script || "N/A"}
Tags: ${source.tags.join(", ") || "N/A"}
Niche: ${source.niche || "General"}

Repurpose it into these formats:
${formatDescriptions}

For each format, provide: title, script/caption adapted for that platform, hashtags, and suggested aspect ratio.

Platform rules:
- TikTok: Hook in first 3 seconds, trending hashtags, casual/energetic tone, 15-60 seconds
- Instagram: Carousel slides (numbered) or reel caption, up to 30 hashtags, use emojis strategically
- YouTube: SEO-optimized title + description, keywords in first 2 lines, longer form OK
- LinkedIn: Professional tone, thought leadership, paragraph breaks, 3-5 hashtags max, no emojis
- Twitter/X: Thread format (numbered tweets 280 chars each) or single punchy tweet, 2-3 hashtags max

Return a JSON array with this exact structure (no markdown wrapping, just the raw JSON array):
[
  {
    "format": "short_clip",
    "platform": "TikTok",
    "title": "...",
    "script": "...",
    "caption": "...",
    "hashtags": ["tag1", "tag2"],
    "aspectRatio": "9:16"
  }
]`;

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4000,
    messages: [{ role: "user", content: prompt }],
  });

  // 4. Parse Claude response
  const text = response.content
    .filter((block) => block.type === "text")
    .map((block) => {
      if (block.type === "text") return block.text;
      return "";
    })
    .join("");

  let results: ClaudeRepurposeResult[];
  try {
    // Try parsing directly
    results = JSON.parse(text);
  } catch {
    // Try extracting JSON from markdown code block
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) throw new Error("Failed to parse Claude response as JSON");
    results = JSON.parse(jsonMatch[0]);
  }

  // 5. Create RepurposedContent records
  const created = [];
  for (const result of results) {
    const record = await prisma.repurposedContent.create({
      data: {
        sourceContentId: contentItemId,
        title: result.title,
        format: result.format,
        platform: result.platform,
        aspectRatio: result.aspectRatio || "9:16",
        script: result.script || null,
        caption: result.caption || null,
        hashtags: result.hashtags || [],
        status: "draft",
      },
    });
    created.push({
      id: record.id,
      title: record.title,
      format: record.format,
      platform: record.platform,
      status: record.status,
    });
  }

  // 6. Log activity
  await prisma.activityLog.create({
    data: {
      type: "success",
      message: `Repurposed "${source.title}" into ${created.length} platform versions`,
      source: "repurpose",
    },
  });

  return created;
}

// ── Get suggested repurpose options ──

export async function getRepurposeOptions(contentItemId: string): Promise<{
  sourceContent: { id: string; title: string; script: string | null; tags: string[]; targetPlatforms: string[] };
  suggestedFormats: RepurposeFormat[];
  allFormats: RepurposeFormat[];
}> {
  const source = await prisma.contentItem.findUnique({
    where: { id: contentItemId },
    select: {
      id: true,
      title: true,
      script: true,
      tags: true,
      targetPlatforms: true,
      description: true,
    },
  });

  if (!source) throw new Error("Content item not found");

  // Suggest formats based on what platforms the content targets
  const suggested: RepurposeFormat[] = [];
  const hasScript = !!source.script && source.script.length > 50;
  const hasDescription = !!source.description && source.description.length > 100;

  for (const format of REPURPOSE_FORMATS) {
    // If content has a script, suggest video/audio formats
    if (hasScript && ["short_clip", "audiogram", "story"].includes(format.format)) {
      suggested.push(format);
    }
    // If content has description/script, suggest text formats
    if ((hasScript || hasDescription) && ["carousel", "quote_card", "blog_excerpt", "thread"].includes(format.format)) {
      suggested.push(format);
    }
  }

  return {
    sourceContent: {
      id: source.id,
      title: source.title,
      script: source.script,
      tags: source.tags,
      targetPlatforms: source.targetPlatforms,
    },
    suggestedFormats: suggested.length > 0 ? suggested : REPURPOSE_FORMATS.slice(0, 6),
    allFormats: REPURPOSE_FORMATS,
  };
}

// ── Get all repurposed versions of a content item ──

export async function getRepurposedContent(sourceContentId: string) {
  return prisma.repurposedContent.findMany({
    where: { sourceContentId },
    orderBy: { createdAt: "desc" },
  });
}

// ── Batch repurpose multiple content items ──

export async function batchRepurpose(
  contentIds: string[],
  formats: string[]
): Promise<{ contentId: string; results: { id: string; title: string; format: string; platform: string; status: string }[]; error?: string }[]> {
  const results = [];

  for (const contentId of contentIds) {
    try {
      const created = await repurposeContent(contentId, formats);
      results.push({ contentId, results: created });
    } catch (err) {
      results.push({
        contentId,
        results: [],
        error: err instanceof Error ? err.message : "Unknown error",
      });
    }
  }

  return results;
}
