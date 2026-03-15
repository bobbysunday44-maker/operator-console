"use client";

import { useState, useEffect, useCallback } from "react";
import { PipelinePanel } from "@/components/studio/pipeline-panel";
import { DetailPanel } from "@/components/studio/detail-panel";
import { PipelineSidebar } from "@/components/studio/pipeline-sidebar";
import type { PipelineStage, CharacterRef, ContentMeta } from "@/lib/pipeline/types";

// Map Prisma PipelineRun to UI PipelineStage
interface PipelineRun {
  id: string;
  stage: string;
  model: string;
  status: string;
  inputPrompt: string | null;
  outputPath: string | null;
  outputPreview: string | null;
  tokensIn: number | null;
  tokensOut: number | null;
  cost: number | null;
  duration: number | null;
  error: string | null;
}

interface ContentItem {
  id: string;
  title: string;
  description: string | null;
  tags: string[];
  targetPlatforms: string[];
  status: string;
  totalCost: number;
  script: string | null;
  createdAt: string;
  pipelineRuns: PipelineRun[];
}

interface CharacterData {
  id: string;
  name: string;
  description: string | null;
  stylePrompt: string | null;
}

const STAGE_DEFS = [
  { id: "prompt", label: "Prompt Writer", icon: "✍️", agent: "Claude Sonnet", model: "claude" },
  { id: "image", label: "Image Generation", icon: "🎨", agent: "Gemini Nano Banana 2", model: "gemini_nano_banana" },
  { id: "video", label: "Video Generation", icon: "🎬", agent: "Gemini Veo 3.1", model: "gemini_veo" },
  { id: "voiceover", label: "Voiceover", icon: "🎙️", agent: "edge-tts", model: "edge_tts" },
  { id: "assembly", label: "Final Assembly", icon: "🔧", agent: "FFmpeg", model: "ffmpeg" },
];

const PIPELINE_MODELS = [
  { name: "Claude Sonnet 4.6", type: "Language", colorClass: "bg-oc-purple", bgClass: "bg-oc-purple-light" },
  { name: "Nano Banana 2", type: "Image", colorClass: "bg-oc-blue", bgClass: "bg-oc-blue-light" },
  { name: "Veo 3.1", type: "Video", colorClass: "bg-oc-teal", bgClass: "bg-oc-teal-light" },
  { name: "edge-tts", type: "Audio", colorClass: "bg-oc-amber", bgClass: "bg-oc-amber-light" },
];

function mapRunsToStages(runs: PipelineRun[]): PipelineStage[] {
  const runMap = new Map(runs.map((r) => [r.stage, r]));

  return STAGE_DEFS.map((def) => {
    const run = runMap.get(def.id);
    if (!run) {
      // Stage not yet started
      return {
        id: def.id,
        label: def.label,
        icon: def.icon,
        agent: def.agent,
        status: "queued" as const,
        duration: "—",
        cost: def.id === "voiceover" || def.id === "assembly" ? "Free" : "—",
        input: "",
        output: null,
      };
    }

    const statusMap: Record<string, "complete" | "running" | "queued" | "failed"> = {
      completed: "complete",
      in_progress: "running",
      pending: "queued",
      failed: "failed",
      cancelled: "failed",
    };

    return {
      id: def.id,
      label: def.label,
      icon: def.icon,
      agent: def.agent,
      status: statusMap[run.status] || "queued",
      duration: run.duration ? `${(run.duration / 1000).toFixed(1)}s` : run.status === "in_progress" ? "~45s" : "—",
      cost: run.cost != null ? `$${run.cost.toFixed(3)}` : "Free",
      input: run.inputPrompt || "",
      output: run.outputPreview || run.outputPath || null,
      tokens: run.tokensIn && run.tokensOut ? { in: run.tokensIn, out: run.tokensOut } : undefined,
      model: def.model,
      progress: run.status === "in_progress" ? 67 : undefined,
    };
  });
}

export default function StudioPage() {
  const [contentItems, setContentItems] = useState<ContentItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [characters, setCharacters] = useState<CharacterData[]>([]);
  const [activeStageId, setActiveStageId] = useState("prompt");
  const [videoProgress, setVideoProgress] = useState(67);

  const fetchData = useCallback(async () => {
    try {
      const [contentRes, charsRes] = await Promise.all([
        fetch("/api/content"),
        fetch("/api/characters"),
      ]);
      const contentData = await contentRes.json();
      const charsData = await charsRes.json();
      setContentItems(contentData.items || []);
      setCharacters(charsData.characters || []);

      // Auto-select first content if none selected
      if (!selectedId && contentData.items?.length > 0) {
        setSelectedId(contentData.items[0].id);
      }
    } catch {
      console.error("[Studio] Fetch failed");
    }
  }, [selectedId]);

  // Fetch selected content detail
  const [selectedContent, setSelectedContent] = useState<ContentItem | null>(null);

  const fetchDetail = useCallback(async () => {
    if (!selectedId) return;
    try {
      const res = await fetch(`/api/content/${selectedId}`);
      const data = await res.json();
      setSelectedContent(data.item || null);
    } catch {
      setSelectedContent(null);
    }
  }, [selectedId]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { fetchDetail(); }, [fetchDetail]);

  // Animate video progress for running stages
  useEffect(() => {
    const t = setInterval(() => {
      setVideoProgress((p) => (p >= 95 ? 67 : p + 1));
    }, 800);
    return () => clearInterval(t);
  }, []);

  // Build pipeline stages from real data
  const stages: PipelineStage[] = selectedContent
    ? mapRunsToStages(selectedContent.pipelineRuns).map((s) =>
        s.id === "video" && s.status === "running" ? { ...s, progress: videoProgress } : s
      )
    : STAGE_DEFS.map((def) => ({
        id: def.id, label: def.label, icon: def.icon, agent: def.agent,
        status: "queued" as const, duration: "—", cost: "—", input: "", output: null,
      }));

  const activeStage = stages.find((s) => s.id === activeStageId) || null;

  const contentMeta: ContentMeta = selectedContent
    ? {
        id: selectedContent.id,
        title: selectedContent.title,
        tags: selectedContent.tags,
        targets: selectedContent.targetPlatforms,
        date: new Date(selectedContent.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
        platform: selectedContent.targetPlatforms[0] || "TikTok",
      }
    : { id: "—", title: "No content selected", tags: [], targets: [], date: "—", platform: "—" };

  const characterRefs: CharacterRef[] = characters.map((c) => ({
    name: c.name,
    description: c.description || "",
    emoji: c.name === "Nova" ? "🤖" : "🧑",
  }));

  const publishTargets = (selectedContent?.targetPlatforms || []).map((p) => ({
    name: p,
    handle: `@openclaw_ai`,
    time: "Scheduled",
  }));

  const costBreakdown = stages.map((s) => ({
    label: s.label,
    cost: s.cost,
  }));

  return (
    <div className="flex flex-col h-screen -m-[22px_28px]">
      {/* Content Selector Bar */}
      {contentItems.length > 1 && (
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-oc-border bg-oc-bg/50 shrink-0">
          <span className="text-tiny font-semibold text-oc-text-muted uppercase tracking-[0.05em]">Content:</span>
          <div className="flex gap-1.5 overflow-x-auto">
            {contentItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setSelectedId(item.id)}
                className={`text-tiny font-semibold px-3 py-1 rounded-oc-pill whitespace-nowrap transition-colors ${
                  selectedId === item.id
                    ? "bg-oc-text text-white"
                    : "bg-oc-card text-oc-text-secondary border border-oc-border hover:bg-oc-bg"
                }`}
              >
                {item.title}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Studio Panels */}
      <div className="flex flex-1 min-h-0">
        <PipelinePanel
          stages={stages}
          activeStageId={activeStageId}
          onSelectStage={setActiveStageId}
          content={contentMeta}
        />
        <DetailPanel
          stage={activeStage}
          characterRefs={characterRefs}
          publishTargets={publishTargets}
        />
        <PipelineSidebar
          models={PIPELINE_MODELS}
          costs={costBreakdown}
          content={contentMeta}
        />
      </div>
    </div>
  );
}
