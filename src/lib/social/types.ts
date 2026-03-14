/* ── OpenClaw Social Media Types ── */

export type PlatformId = "tiktok" | "instagram" | "twitter" | "youtube" | "linkedin" | "reddit";

export interface PlatformConfig {
  id: PlatformId;
  name: string;
  handle: string;
  icon: string;
  connected: boolean;
  /** Color for badges/indicators */
  color: string;
  bgColor: string;
  /** Rate limit: max posts per day */
  dailyLimit: number;
  postsToday: number;
}

export type PostStatus = "draft" | "scheduled" | "publishing" | "published" | "failed";

export interface ScheduledPost {
  id: string;
  contentId: string;
  title: string;
  caption: string;
  platforms: PlatformId[];
  status: PostStatus;
  scheduledAt: number;
  publishedAt?: number;
  /** Media type attached */
  mediaType: "video" | "image" | "text" | "carousel";
  /** Results per platform after publish */
  results?: Partial<Record<PlatformId, { success: boolean; postUrl?: string; error?: string }>>;
  createdAt: number;
}

export type MentionSentiment = "positive" | "neutral" | "negative";

export interface Mention {
  id: string;
  platform: PlatformId;
  author: string;
  authorHandle: string;
  content: string;
  sentiment: MentionSentiment;
  /** Whether auto-reply was sent */
  replied: boolean;
  replyContent?: string;
  postUrl?: string;
  detectedAt: number;
}

export interface SocialStats {
  totalPosts: number;
  postsToday: number;
  mentionsToday: number;
  repliesSent: number;
  engagementRate: string;
  topPlatform: PlatformId;
}
