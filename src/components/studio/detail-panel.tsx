"use client";

import { useState } from "react";
import { OcBadge } from "@/components/shared";
import type { PipelineStage, CharacterRef, PublishTarget } from "@/lib/pipeline/types";

/* ── Image Placeholder ── */
function ImagePlaceholder() {
  return (
    <div className="w-full max-w-[320px] aspect-square rounded-[10px] relative overflow-hidden flex flex-col items-center justify-center"
      style={{ background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 30%, #0f3460 60%, #533483 100%)" }}
    >
      <div className="absolute inset-0" style={{ background: "radial-gradient(circle at 30% 40%, rgba(37,99,235,0.3) 0%, transparent 60%)" }} />
      <div className="absolute inset-0" style={{ background: "radial-gradient(circle at 70% 70%, rgba(124,58,237,0.2) 0%, transparent 50%)" }} />
      <span className="text-[40px] relative z-10">&#x1F916;&#x1F4F1;</span>
      <span className="text-tiny font-mono text-white/50 mt-2 relative z-10">1024 &times; 1024</span>
      <span className="text-[9px] font-mono text-white/30 mt-0.5 relative z-10">Nano Banana 2</span>
    </div>
  );
}

/* ── Video Placeholder ── */
function VideoPlaceholder({ progress = 67 }: { progress?: number }) {
  return (
    <div className="w-full max-w-[280px] aspect-video rounded-[10px] relative overflow-hidden flex flex-col items-center justify-center"
      style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)" }}
    >
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-[3px] border-white/15 border-t-oc-blue animate-spin" />
      </div>
      <span className="text-tiny font-mono text-white/60 relative z-10 mt-9">
        {progress}% &middot; Generating...
      </span>
      <span className="text-[9px] font-mono text-white/30 mt-1 relative z-10">
        1080p &middot; 8s &middot; Veo 3.1
      </span>
    </div>
  );
}

/* ── Detail Panel (Center Column) ── */
export function DetailPanel({
  stage,
  characterRefs,
  publishTargets,
  contentId,
  onRefresh,
}: {
  stage: PipelineStage | null;
  characterRefs: CharacterRef[];
  publishTargets: PublishTarget[];
  contentId?: string;
  onRefresh?: () => void;
}) {
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  function triggerFeedback(msg: string) {
    setActionFeedback(msg);
    setTimeout(() => setActionFeedback(null), 2000);
  }

  async function handleRegenerate() {
    if (!contentId || !stage) return;
    triggerFeedback("Re-queuing stage...");
    try {
      await fetch(`/api/content/${contentId}/pipeline`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage: stage.id, model: stage.model || "claude", status: "pending" }),
      });
      triggerFeedback("Stage re-queued!");
      onRefresh?.();
    } catch {
      triggerFeedback("Failed to regenerate");
    }
  }

  function handleDownload() {
    if (!stage?.output) return;
    // If output looks like a file path, serve via API
    if (stage.output.includes("/") || stage.output.includes("\\")) {
      window.open(`/api/files?path=${encodeURIComponent(stage.output)}`, "_blank");
    } else {
      // Text output — download as file
      const blob = new Blob([stage.output], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${stage.id}-output.txt`;
      a.click();
      URL.revokeObjectURL(url);
    }
    triggerFeedback("Downloaded");
  }

  if (!stage) return null;

  const statChips = [
    { label: "Duration", value: stage.duration },
    { label: "Cost", value: stage.cost || "Free" },
    stage.resolution ? { label: "Output", value: stage.resolution } : null,
    stage.model ? { label: "Model", value: stage.model } : null,
    stage.voice ? { label: "Voice", value: stage.voice } : null,
    stage.tokens ? { label: "Tokens", value: `${stage.tokens.in} \u2192 ${stage.tokens.out}` } : null,
    stage.refImages ? { label: "Ref Images", value: String(stage.refImages) } : null,
  ].filter(Boolean) as { label: string; value: string }[];

  return (
    <div className="flex-1 overflow-y-auto h-[calc(100vh-44px)]" style={{ padding: "20px 28px" }}>
      <div className="flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center gap-2.5">
          <span className="text-[24px]">{stage.icon}</span>
          <div>
            <div className="text-[17px] font-bold text-oc-text">{stage.label}</div>
            <div className="text-small text-oc-text-secondary">{stage.agent}</div>
          </div>
          <div className="ml-auto">
            <OcBadge
              label={stage.status === "complete" ? "Complete" : stage.status === "running" ? "Running" : stage.status === "failed" ? "Failed" : "Queued"}
              color={stage.status === "complete" ? "#059669" : stage.status === "running" ? "#2563EB" : stage.status === "failed" ? "#DC2626" : "#9C9590"}
              bg={stage.status === "complete" ? "#ECFDF5" : stage.status === "running" ? "#EFF4FF" : stage.status === "failed" ? "#FEF2F2" : "#F0EDE6"}
            />
          </div>
        </div>

        {/* Stats row */}
        <div className="flex gap-2">
          {statChips.map((s) => (
            <div key={s.label} className="flex-1 min-w-0 p-[8px_12px] bg-oc-bg rounded-oc-sm">
              <div className="text-[9px] font-semibold text-oc-text-muted uppercase tracking-[0.05em] mb-0.5">
                {s.label}
              </div>
              <div className="text-small font-semibold font-mono text-oc-text truncate">
                {s.value}
              </div>
            </div>
          ))}
        </div>

        {/* Input Prompt */}
        <div>
          <div className="text-tiny font-semibold text-oc-text-muted uppercase tracking-[0.05em] mb-1.5">
            Input Prompt
          </div>
          <div className="p-[12px_14px] bg-oc-bg border border-oc-border-light rounded-[10px] text-[12.5px] text-oc-text leading-[1.6] whitespace-pre-wrap">
            {stage.input}
          </div>
        </div>

        {/* Output */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <div className="text-tiny font-semibold text-oc-text-muted uppercase tracking-[0.05em]">
              Output
            </div>
            {actionFeedback && (
              <span className="text-tiny font-semibold text-oc-green">{actionFeedback}</span>
            )}
            {stage.status === "complete" && !actionFeedback && (
              <div className="flex gap-1.5">
                <button onClick={handleRegenerate} className="text-tiny font-semibold text-oc-blue bg-oc-blue-light border-none rounded-[6px] px-2.5 py-1 cursor-pointer">
                  Regenerate
                </button>
                <button onClick={handleDownload} className="text-tiny font-semibold text-oc-text-secondary bg-oc-bg border border-oc-border rounded-[6px] px-2.5 py-1 cursor-pointer">
                  Download
                </button>
              </div>
            )}
          </div>

          {stage.output === "GENERATED_IMAGE" ? (
            <ImagePlaceholder />
          ) : stage.id === "video" && stage.status === "running" ? (
            <VideoPlaceholder progress={stage.progress} />
          ) : stage.output ? (
            <div
              className="p-[12px_14px] rounded-[10px] text-[12.5px] font-mono leading-[1.6] whitespace-pre-wrap"
              style={{ backgroundColor: "#1a1a2e", color: "#e2e8f0" }}
            >
              {stage.output}
            </div>
          ) : (
            <div className="p-5 bg-oc-bg rounded-[10px] text-center">
              <span className="text-small text-oc-text-muted">
                Waiting for previous step to complete...
              </span>
            </div>
          )}
        </div>

        {/* Running stage info — pipeline runs automatically through all stages */}
        {stage.status === "running" && (
          <div className="p-2 bg-oc-blue-light rounded-oc-sm text-center">
            <span className="text-tiny text-oc-blue font-semibold">Pipeline running — each stage completes automatically</span>
          </div>
        )}

        {/* Character References (shown on video stage) */}
        {stage.id === "video" && (
          <div className="mt-4">
            <div className="text-tiny font-semibold text-oc-text-muted uppercase tracking-[0.05em] mb-2">
              Character Reference Images
            </div>
            <div className="flex gap-2.5">
              {characterRefs.map((ch) => (
                <div
                  key={ch.name}
                  className="flex-1 p-[10px_14px] bg-oc-card border border-oc-border rounded-[10px] flex items-center gap-2.5"
                >
                  <div className="w-10 h-10 rounded-oc-sm bg-oc-purple-light flex items-center justify-center text-[20px]">
                    {ch.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-small font-semibold text-oc-text">{ch.name}</div>
                    <div className="text-tiny text-oc-text-muted">{ch.description}</div>
                  </div>
                  <OcBadge label="Active" color="#7C3AED" bg="#F5F3FF" />
                </div>
              ))}
              <span className="min-w-[80px] p-[10px_14px] bg-oc-bg border border-dashed border-oc-border rounded-[10px] flex items-center justify-center text-[10px] text-oc-text-muted">
                Add in Characters page
              </span>
            </div>
          </div>
        )}

        {/* Publish targets (shown on assembly stage) */}
        {stage.id === "assembly" && (
          <div className="mt-4">
            <div className="text-tiny font-semibold text-oc-text-muted uppercase tracking-[0.05em] mb-2">
              Publish After Assembly
            </div>
            <div className="flex gap-2">
              {publishTargets.map((p) => (
                <div
                  key={p.name}
                  className="flex-1 p-[10px_14px] bg-oc-card border border-oc-border rounded-[10px]"
                >
                  <div className="text-small font-semibold text-oc-text">{p.name}</div>
                  <div className="text-tiny font-mono text-oc-text-muted">{p.handle}</div>
                  <div className="text-tiny font-semibold text-oc-blue mt-1">
                    Scheduled: {p.time}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
