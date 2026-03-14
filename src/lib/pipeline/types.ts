/* ── Pipeline Types ── */

export type StageStatus = "complete" | "running" | "queued" | "failed";

export interface PipelineStage {
  id: string;
  label: string;
  icon: string;
  agent: string;
  status: StageStatus;
  duration: string;
  cost: string;
  input: string;
  output: string | null;
  tokens?: { in: number; out: number };
  resolution?: string;
  model?: string;
  voice?: string;
  refImages?: number;
  progress?: number;
}

export interface CharacterRef {
  name: string;
  description: string;
  emoji: string;
}

export interface PublishTarget {
  name: string;
  handle: string;
  time: string;
}

export interface ContentMeta {
  id: string;
  title: string;
  tags: string[];
  targets: string[];
  date: string;
  platform: string;
}
