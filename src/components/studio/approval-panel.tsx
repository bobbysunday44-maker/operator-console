"use client";

import { useState } from "react";
import { OcCard, OcBadge, SectionHeader } from "@/components/shared";

interface PipelineRun {
  id: string;
  stage: string;
  model: string;
  status: string;
  outputPreview: string | null;
  cost: number | null;
  duration: number | null;
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

export function ApprovalPanel({
  content,
  onRefresh,
}: {
  content: ContentItem;
  onRefresh: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [rejectNotes, setRejectNotes] = useState("");
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Find opus review run if it exists
  const reviewRun = content.pipelineRuns.find(
    (r) => r.stage === "review" || r.outputPreview?.includes("Score:")
  );

  // Parse review score from outputPreview (format: "Score: 8/10\nNotes...")
  let reviewScore: number | null = null;
  let reviewNotes: string | null = null;
  if (reviewRun?.outputPreview) {
    const scoreMatch = reviewRun.outputPreview.match(/Score:\s*(\d+)/i);
    if (scoreMatch) reviewScore = parseInt(scoreMatch[1], 10);
    reviewNotes = reviewRun.outputPreview;
  }

  // Cost breakdown from pipeline runs
  const costItems = content.pipelineRuns
    .filter((r) => r.cost != null && r.cost > 0)
    .map((r) => ({
      stage: r.stage,
      cost: r.cost!,
    }));

  async function handleApprove() {
    setLoading(true);
    setFeedback(null);
    try {
      const res = await fetch(`/api/content/${content.id}/approve`, {
        method: "POST",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Approval failed");
      }
      setFeedback({ type: "success", message: "Content approved and scheduled!" });
      setTimeout(() => {
        onRefresh();
      }, 1000);
    } catch (err) {
      setFeedback({
        type: "error",
        message: err instanceof Error ? err.message : "Approval failed",
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleReject() {
    setLoading(true);
    setFeedback(null);
    try {
      const res = await fetch(`/api/content/${content.id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: rejectNotes || undefined }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Rejection failed");
      }
      setFeedback({ type: "success", message: "Content rejected and sent back to ideation." });
      setShowRejectInput(false);
      setRejectNotes("");
      setTimeout(() => {
        onRefresh();
      }, 1000);
    } catch (err) {
      setFeedback({
        type: "error",
        message: err instanceof Error ? err.message : "Rejection failed",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex-1 overflow-y-auto h-[calc(100vh-44px)]" style={{ padding: "20px 28px" }}>
      <div className="flex flex-col gap-4">
        {/* Header */}
        <SectionHeader
          title="Content Review"
          subtitle="Approve or reject this content before publishing"
        />

        {/* Content Summary */}
        <OcCard>
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 min-w-0">
              <h3 className="text-[17px] font-bold text-oc-text m-0 mb-1">
                {content.title}
              </h3>
              {content.description && (
                <p className="text-small text-oc-text-secondary m-0 leading-[1.5]">
                  {content.description.split("\n--- Rejected")[0]}
                </p>
              )}
            </div>
            <OcBadge
              label={content.status === "review" ? "In Review" : "Pending Approval"}
              color="#D97706"
              bg="#FFFBEB"
            />
          </div>

          {/* Tags */}
          {content.tags.length > 0 && (
            <div className="flex gap-1.5 mb-3">
              {content.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-[10px] font-semibold px-2 py-[2px] rounded-oc-pill bg-oc-bg text-oc-text-secondary"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Target Platforms */}
          <div className="flex gap-1.5">
            {content.targetPlatforms.map((p) => (
              <OcBadge key={p} label={p} color="#2563EB" bg="#EFF4FF" />
            ))}
          </div>
        </OcCard>

        {/* Script Preview */}
        {content.script && (
          <div>
            <div className="text-tiny font-semibold text-oc-text-muted uppercase tracking-[0.05em] mb-1.5">
              Script Preview
            </div>
            <div className="p-[12px_14px] bg-oc-bg border border-oc-border-light rounded-[10px] text-[12.5px] text-oc-text leading-[1.6] whitespace-pre-wrap max-h-[200px] overflow-y-auto">
              {content.script}
            </div>
          </div>
        )}

        {/* AI Review Score */}
        {reviewScore !== null && (
          <OcCard className={reviewScore >= 7 ? "border-l-[3px] border-l-oc-green" : reviewScore >= 5 ? "border-l-[3px] border-l-oc-amber" : "border-l-[3px] border-l-oc-red"}>
            <div className="flex items-center gap-3 mb-2">
              <div className="text-tiny font-semibold text-oc-text-muted uppercase tracking-[0.05em]">
                AI Review
              </div>
              <OcBadge
                label={`${reviewScore}/10`}
                color={reviewScore >= 7 ? "#059669" : reviewScore >= 5 ? "#D97706" : "#DC2626"}
                bg={reviewScore >= 7 ? "#ECFDF5" : reviewScore >= 5 ? "#FFFBEB" : "#FEF2F2"}
              />
            </div>
            {reviewNotes && (
              <div className="text-[12.5px] text-oc-text-secondary leading-[1.6] whitespace-pre-wrap">
                {reviewNotes}
              </div>
            )}
          </OcCard>
        )}

        {/* Cost Breakdown */}
        <div>
          <div className="text-tiny font-semibold text-oc-text-muted uppercase tracking-[0.05em] mb-1.5">
            Cost Breakdown
          </div>
          <div className="flex gap-2">
            {costItems.map((item) => (
              <div key={item.stage} className="flex-1 min-w-0 p-[8px_12px] bg-oc-bg rounded-oc-sm">
                <div className="text-[9px] font-semibold text-oc-text-muted uppercase tracking-[0.05em] mb-0.5">
                  {item.stage}
                </div>
                <div className="text-small font-semibold font-mono text-oc-text">
                  ${item.cost.toFixed(3)}
                </div>
              </div>
            ))}
            <div className="flex-1 min-w-0 p-[8px_12px] bg-oc-bg rounded-oc-sm border border-oc-border">
              <div className="text-[9px] font-semibold text-oc-text-muted uppercase tracking-[0.05em] mb-0.5">
                Total
              </div>
              <div className="text-small font-bold font-mono text-oc-text">
                ${content.totalCost.toFixed(3)}
              </div>
            </div>
          </div>
        </div>

        {/* Feedback banner */}
        {feedback && (
          <div
            className={`p-[10px_14px] rounded-[10px] text-small font-semibold ${
              feedback.type === "success"
                ? "bg-[#ECFDF5] text-[#059669]"
                : "bg-[#FEF2F2] text-[#DC2626]"
            }`}
          >
            {feedback.message}
          </div>
        )}

        {/* Reject Notes Input */}
        {showRejectInput && (
          <div>
            <div className="text-tiny font-semibold text-oc-text-muted uppercase tracking-[0.05em] mb-1.5">
              Rejection Notes
            </div>
            <textarea
              value={rejectNotes}
              onChange={(e) => setRejectNotes(e.target.value)}
              placeholder="Why is this content being rejected? (optional)"
              className="w-full p-[10px_14px] bg-oc-bg border border-oc-border rounded-[10px] text-small text-oc-text resize-y min-h-[80px] outline-none focus:border-oc-blue transition-colors"
            />
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 mt-1">
          {!showRejectInput ? (
            <>
              <button
                onClick={handleApprove}
                disabled={loading}
                className="flex-1 text-small font-semibold text-white bg-[#059669] border-none rounded-oc-sm py-2.5 cursor-pointer hover:bg-[#047857] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Processing..." : "Approve & Schedule"}
              </button>
              <button
                onClick={() => setShowRejectInput(true)}
                disabled={loading}
                className="flex-1 text-small font-semibold text-[#DC2626] bg-[#FEF2F2] border-none rounded-oc-sm py-2.5 cursor-pointer hover:bg-[#FEE2E2] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Reject
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleReject}
                disabled={loading}
                className="flex-1 text-small font-semibold text-white bg-[#DC2626] border-none rounded-oc-sm py-2.5 cursor-pointer hover:bg-[#B91C1C] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Processing..." : "Confirm Rejection"}
              </button>
              <button
                onClick={() => { setShowRejectInput(false); setRejectNotes(""); }}
                disabled={loading}
                className="flex-1 text-small font-semibold text-oc-text-secondary bg-oc-bg border border-oc-border rounded-oc-sm py-2.5 cursor-pointer hover:bg-oc-card transition-colors"
              >
                Cancel
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
