/* ── OpenClaw Social Media Types (matches Prisma API responses) ── */

export interface PlatformConfig {
  id: string;
  name: string;
  handle: string;
  connected: boolean;
  followers: number;
}

export type PostStatus = "draft" | "scheduled" | "posting" | "posted" | "failed";

export interface SocialPost {
  id: string;
  platformId: string;
  contentItemId: string | null;
  content: string;
  mediaUrls: string[];
  status: PostStatus;
  scheduledAt: string | null;
  publishedAt: string | null;
  engagement: Record<string, unknown> | null;
  error: string | null;
  createdAt: string;
  updatedAt: string;
  platform?: { name: string };
  contentItem?: { id: string; title: string } | null;
}

export interface Mention {
  id: string;
  type: string;
  author: string;
  content: string;
  sentiment: string | null;
  isRead: boolean;
  isReplied: boolean;
  replyText: string | null;
  sourceUrl: string | null;
  createdAt: string;
}

export interface SocialStats {
  totalPosts: number;
  posted: number;
  scheduled: number;
  draft: number;
  failed: number;
  totalMentions: number;
  unrepliedMentions: number;
}
