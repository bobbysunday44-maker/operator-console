"use client";

import { OcBadge, ProgressBar } from "@/components/shared";
import type { PipelineStage, ContentMeta } from "@/lib/pipeline/types";

/* ── Stage Card ── */
function StageCard({
  stage,
  isActive,
  isFirst,
  onClick,
}: {
  stage: PipelineStage;
  isActive: boolean;
  isFirst: boolean;
  onClick: () => void;
}) {
  const isComplete = stage.status === "complete";
  const isRunning = stage.status === "running";

  return (
    <button
      onClick={onClick}
      className={`relative w-full flex items-center gap-3 p-[14px_16px] rounded-oc border-[1.5px] text-left transition-all duration-hover font-sans ${
        isActive
          ? "border-oc-blue bg-oc-blue-light shadow-[0_2px_8px_rgba(37,99,235,0.08)]"
          : "border-oc-border bg-oc-card hover:bg-oc-bg/50"
      }`}
    >
      {/* Connector line */}
      {!isFirst && (
        <div
          className={`absolute left-[28px] -top-4 w-0.5 h-4 ${
            isComplete ? "bg-oc-green" : "bg-oc-border-light"
          }`}
        />
      )}

      {/* Status circle */}
      <div
        className={`w-9 h-9 rounded-full shrink-0 flex items-center justify-center text-[16px] border-2 ${
          isComplete
            ? "bg-oc-green-light border-oc-green text-oc-green"
            : isRunning
            ? "bg-oc-blue-light border-oc-blue"
            : "bg-oc-border-light border-oc-border"
        }`}
      >
        {isComplete ? (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          <span>{stage.icon}</span>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-small font-semibold text-oc-text">{stage.label}</span>
          <OcBadge
            label={stage.status === "complete" ? "Complete" : stage.status === "running" ? "Running" : stage.status === "failed" ? "Failed" : "Queued"}
            color={
              stage.status === "complete" ? "#059669"
                : stage.status === "running" ? "#2563EB"
                : stage.status === "failed" ? "#DC2626"
                : "#9C9590"
            }
            bg={
              stage.status === "complete" ? "#ECFDF5"
                : stage.status === "running" ? "#EFF4FF"
                : stage.status === "failed" ? "#FEF2F2"
                : "#F0EDE6"
            }
          />
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-tiny text-oc-text-secondary">{stage.agent}</span>
          <span className="text-tiny font-mono text-oc-text-muted">{stage.duration}</span>
          {stage.cost && (
            <span className="text-tiny font-mono text-oc-text-muted">{stage.cost}</span>
          )}
        </div>
        {isRunning && stage.progress != null && (
          <div className="mt-1.5">
            <ProgressBar value={stage.progress} />
          </div>
        )}
      </div>

      <span className="text-[14px] text-oc-text-muted">&rarr;</span>
    </button>
  );
}

/* ── Pipeline Panel (Left Column) ── */
export function PipelinePanel({
  stages,
  activeStageId,
  onSelectStage,
  content,
}: {
  stages: PipelineStage[];
  activeStageId: string;
  onSelectStage: (id: string) => void;
  content: ContentMeta;
}) {
  const completedCount = stages.filter((s) => s.status === "complete").length;
  const totalProgress = (completedCount / stages.length) * 100;

  return (
    <div className="w-studio-left border-r border-oc-border flex flex-col shrink-0 overflow-y-auto h-[calc(100vh-44px)]" style={{ padding: "20px 16px" }}>
      {/* Header */}
      <div className="mb-5">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-section-title text-oc-text">Creation Studio</span>
          <OcBadge label="Live" color="#059669" bg="#ECFDF5" />
        </div>
        <div className="text-tiny text-oc-text-muted">
          {content.platform} &middot; {content.title.slice(0, 30)} &middot; {content.date}
        </div>
      </div>

      {/* Content item card */}
      <div className="p-[12px_14px] bg-oc-card border border-oc-border rounded-[10px] mb-5">
        <div className="text-small font-semibold text-oc-text mb-1">{content.title}</div>
        <div className="flex gap-1.5 flex-wrap">
          {content.tags.map((tag) => (
            <span
              key={tag}
              className="text-[9px] font-semibold px-[7px] py-[2px] rounded bg-oc-bg text-oc-text-secondary border border-oc-border-light"
            >
              {tag}
            </span>
          ))}
        </div>
        <div className="flex items-center gap-1.5 mt-2">
          <span className="text-tiny text-oc-text-muted">Target:</span>
          {content.targets.map((t) => (
            <OcBadge key={t} label={t} color="#1A1A1A" bg="#F0EDE6" />
          ))}
        </div>
      </div>

      {/* Pipeline steps */}
      <div className="flex flex-col gap-4">
        {stages.map((stage, i) => (
          <StageCard
            key={stage.id}
            stage={stage}
            isActive={activeStageId === stage.id}
            isFirst={i === 0}
            onClick={() => onSelectStage(stage.id)}
          />
        ))}
      </div>

      {/* Pipeline summary */}
      <div className="mt-auto pt-4 border-t border-oc-border">
        <div className="flex justify-between mb-1.5">
          <span className="text-tiny text-oc-text-muted">Total Progress</span>
          <span className="text-tiny font-semibold text-oc-text">
            {completedCount} of {stages.length} complete
          </span>
        </div>
        <ProgressBar value={totalProgress} color="#059669" />
        <div className="flex justify-between mt-2">
          <span className="text-tiny font-mono text-oc-text-muted">Est. total: ~55s</span>
          <span className="text-tiny font-mono text-oc-text-muted">Est. cost: ~$0.06</span>
        </div>
      </div>
    </div>
  );
}
