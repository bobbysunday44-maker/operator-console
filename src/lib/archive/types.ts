/* ── OpenClaw Content Archive Types ── */

export type ContentStatus = "complete" | "processing" | "failed" | "archived";
export type MediaType = "video" | "image" | "text" | "carousel";

export interface ArchivedContent {
  id: string;
  title: string;
  description: string;
  status: ContentStatus;
  mediaType: MediaType;
  /** Platforms it was published to */
  platforms: string[];
  /** Quality score from Editor agent */
  qualityScore?: number;
  /** Models used */
  models: string[];
  /** Cost to produce */
  cost: number;
  /** Creation pipeline details */
  pipeline: {
    prompt: string;
    stages: number;
    duration: number;
  };
  /** Tags for search */
  tags: string[];
  createdAt: number;
  publishedAt?: number;
}
