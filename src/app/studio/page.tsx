"use client";

import { useState, useEffect } from "react";
import { PipelinePanel } from "@/components/studio/pipeline-panel";
import { DetailPanel } from "@/components/studio/detail-panel";
import { PipelineSidebar } from "@/components/studio/pipeline-sidebar";
import {
  PIPELINE_STAGES,
  CHARACTER_REFS,
  PUBLISH_TARGETS,
  CONTENT_META,
  PIPELINE_MODELS,
  COST_BREAKDOWN,
} from "@/lib/pipeline/mock-data";
import type { PipelineStage } from "@/lib/pipeline/types";

export default function StudioPage() {
  const [activeStageId, setActiveStageId] = useState("image");
  const [videoProgress, setVideoProgress] = useState(67);

  // Animate video progress
  useEffect(() => {
    const t = setInterval(() => {
      setVideoProgress((p) => (p >= 95 ? 67 : p + 1));
    }, 800);
    return () => clearInterval(t);
  }, []);

  // Inject live progress into stages
  const stages: PipelineStage[] = PIPELINE_STAGES.map((s) =>
    s.id === "video" ? { ...s, progress: videoProgress } : s
  );

  const activeStage = stages.find((s) => s.id === activeStageId) || null;

  return (
    <div className="flex -m-[22px_28px] h-screen">
      {/* Left: Pipeline Steps */}
      <PipelinePanel
        stages={stages}
        activeStageId={activeStageId}
        onSelectStage={setActiveStageId}
        content={CONTENT_META}
      />

      {/* Center: Detail View */}
      <DetailPanel
        stage={activeStage}
        characterRefs={CHARACTER_REFS}
        publishTargets={PUBLISH_TARGETS}
      />

      {/* Right: Sidebar */}
      <PipelineSidebar
        models={PIPELINE_MODELS}
        costs={COST_BREAKDOWN}
        content={CONTENT_META}
      />
    </div>
  );
}
