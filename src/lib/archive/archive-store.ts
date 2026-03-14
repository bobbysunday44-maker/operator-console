/* ── OpenClaw Content Archive Store ── */

import type { ArchivedContent, ContentStatus, MediaType } from "./types";

class ArchiveStore {
  private items = new Map<string, ArchivedContent>();

  listItems(filters?: { status?: ContentStatus; mediaType?: MediaType; search?: string }): ArchivedContent[] {
    let all = Array.from(this.items.values()).sort((a, b) => b.createdAt - a.createdAt);
    if (filters?.status) all = all.filter((i) => i.status === filters.status);
    if (filters?.mediaType) all = all.filter((i) => i.mediaType === filters.mediaType);
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      all = all.filter((i) =>
        i.title.toLowerCase().includes(q) ||
        i.description.toLowerCase().includes(q) ||
        i.tags.some((t) => t.toLowerCase().includes(q)) ||
        i.id.toLowerCase().includes(q)
      );
    }
    return all;
  }

  getItem(id: string): ArchivedContent | null {
    return this.items.get(id) || null;
  }

  getStats() {
    const all = Array.from(this.items.values());
    return {
      total: all.length,
      complete: all.filter((i) => i.status === "complete").length,
      processing: all.filter((i) => i.status === "processing").length,
      failed: all.filter((i) => i.status === "failed").length,
      archived: all.filter((i) => i.status === "archived").length,
      totalCost: all.reduce((sum, i) => sum + i.cost, 0),
    };
  }

  // Used by seeding
  addItem(item: ArchivedContent) {
    this.items.set(item.id, item);
  }
}

/* ── Singleton ── */
const globalForArchive = globalThis as unknown as { archiveStore: ArchiveStore };
export const archiveStore = globalForArchive.archiveStore || new ArchiveStore();
if (process.env.NODE_ENV !== "production") {
  globalForArchive.archiveStore = archiveStore;
}

/* ── Seed ── */
function seedIfEmpty() {
  if (archiveStore.listItems().length > 0) return;

  const now = Date.now();
  const hour = 3600000;

  const items: ArchivedContent[] = [
    { id: "CNT-0047", title: "AI Agents Automate Your Social Media", description: "POV: your AI agent posted to 6 platforms while you slept", status: "processing", mediaType: "video", platforms: ["TikTok", "Instagram", "Twitter"], qualityScore: undefined, models: ["Claude Sonnet", "Nano Banana 2", "Veo 3.1", "edge-tts"], cost: 0.055, pipeline: { prompt: "Create a TikTok about AI agents automating social media", stages: 5, duration: 55 }, tags: ["AI", "automation", "TikTok", "trending"], createdAt: now - 2 * hour },
    { id: "CNT-0046", title: "AI vs Traditional Marketing", description: "Why AI content creators are replacing marketing agencies", status: "complete", mediaType: "image", platforms: ["Twitter", "LinkedIn"], qualityScore: 8.4, models: ["Claude Sonnet", "Nano Banana 2"], cost: 0.005, pipeline: { prompt: "Create a comparison post about AI vs traditional marketing", stages: 3, duration: 12 }, tags: ["marketing", "AI", "comparison"], createdAt: now - 8 * hour, publishedAt: now - 7 * hour },
    { id: "CNT-0045", title: "5 AI Tools You Need in 2026", description: "POV: You discovered these AI tools before everyone else", status: "complete", mediaType: "video", platforms: ["TikTok", "Instagram", "Twitter"], qualityScore: 9.1, models: ["Claude Sonnet", "Nano Banana 2", "Veo 3.1", "edge-tts", "FFmpeg"], cost: 0.058, pipeline: { prompt: "Create a TikTok about 5 must-have AI tools for 2026", stages: 5, duration: 62 }, tags: ["AI tools", "2026", "trending", "listicle"], createdAt: now - 24 * hour, publishedAt: now - 23 * hour },
    { id: "CNT-0044", title: "How AI Reads Your Emotions", description: "The science behind sentiment analysis explained simply", status: "complete", mediaType: "video", platforms: ["TikTok", "YouTube"], qualityScore: 7.8, models: ["Claude Sonnet", "Veo 3.1", "edge-tts", "FFmpeg"], cost: 0.052, pipeline: { prompt: "Explain sentiment analysis in a viral TikTok format", stages: 5, duration: 48 }, tags: ["AI", "sentiment", "explainer"], createdAt: now - 48 * hour, publishedAt: now - 47 * hour },
    { id: "CNT-0043", title: "Robot vs Human: Content Challenge", description: "We had AI and a human create the same content. Results?", status: "complete", mediaType: "carousel", platforms: ["Instagram", "LinkedIn"], qualityScore: 8.9, models: ["Claude Sonnet", "Nano Banana 2"], cost: 0.008, pipeline: { prompt: "Create a carousel comparing AI-generated vs human content", stages: 3, duration: 15 }, tags: ["AI vs human", "challenge", "carousel"], createdAt: now - 72 * hour, publishedAt: now - 71 * hour },
    { id: "CNT-0042", title: "Your AI Clone is Coming", description: "Digital twins and AI avatars are closer than you think", status: "archived", mediaType: "video", platforms: ["TikTok"], qualityScore: 6.5, models: ["Claude Sonnet", "Veo 3.1", "edge-tts"], cost: 0.054, pipeline: { prompt: "Create a spooky-but-cool TikTok about AI digital twins", stages: 5, duration: 58 }, tags: ["AI", "digital twins", "future"], createdAt: now - 120 * hour, publishedAt: now - 119 * hour },
    { id: "CNT-0041", title: "Prompt Engineering 101", description: "The art of talking to AI — tips that actually work", status: "complete", mediaType: "text", platforms: ["Twitter", "LinkedIn"], qualityScore: 8.2, models: ["Claude Sonnet"], cost: 0.003, pipeline: { prompt: "Write a thread about prompt engineering best practices", stages: 1, duration: 3 }, tags: ["prompts", "tutorial", "tips"], createdAt: now - 168 * hour, publishedAt: now - 167 * hour },
    { id: "CNT-0040", title: "Weekend Automation Setup", description: "How to set up AI content automation in one weekend", status: "failed", mediaType: "video", platforms: [], qualityScore: undefined, models: ["Claude Sonnet", "Veo 3.1"], cost: 0.03, pipeline: { prompt: "Create a tutorial about setting up content automation", stages: 5, duration: 0 }, tags: ["tutorial", "automation", "setup"], createdAt: now - 200 * hour },
  ];

  for (const item of items) {
    archiveStore.addItem(item);
  }
}

seedIfEmpty();
