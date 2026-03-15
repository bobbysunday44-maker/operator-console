/* ── OpenClaw Content Archive Types (matches Prisma API responses) ── */

export type ContentStatus =
  | "idea" | "scripting" | "imaging" | "filming"
  | "voiceover" | "assembly" | "review" | "approved"
  | "published" | "failed";

export interface ContentAsset {
  id: string;
  type: string;
  fileName: string;
  mimeType: string | null;
}

export interface ArchivedContent {
  id: string;
  title: string;
  description: string | null;
  niche: string | null;
  status: ContentStatus;
  qualityTier: string;
  targetPlatforms: string[];
  tags: string[];
  script: string | null;
  finalOutput: string | null;
  totalCost: number;
  createdAt: string;
  updatedAt: string;
  assets: ContentAsset[];
  _count: { pipelineRuns: number };
}
