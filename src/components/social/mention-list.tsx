"use client";

import { OcBadge } from "@/components/shared";
import type { Mention } from "@/lib/social/types";

const SENTIMENT_STYLES: Record<string, { label: string; color: string; bg: string }> = {
  positive: { label: "Positive", color: "#059669", bg: "#ECFDF5" },
  neutral: { label: "Neutral", color: "#D97706", bg: "#FFFBEB" },
  negative: { label: "Negative", color: "#DC2626", bg: "#FEF2F2" },
};

function timeAgo(ts: string): string {
  const mins = Math.floor((Date.now() - new Date(ts).getTime()) / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function MentionList({
  mentions,
  onReply,
}: {
  mentions: Mention[];
  onReply: (id: string) => void;
}) {
  if (mentions.length === 0) {
    return (
      <div className="text-center py-8 text-tiny text-oc-text-muted">No mentions detected</div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {mentions.map((m) => {
        const style = SENTIMENT_STYLES[m.sentiment || "neutral"] || SENTIMENT_STYLES.neutral;
        return (
          <div key={m.id} className="p-[12px_14px] bg-oc-card border border-oc-border rounded-[10px]">
            <div className="flex items-start gap-2.5">
              <div className="w-8 h-8 rounded-full bg-oc-bg flex items-center justify-center text-[14px] shrink-0">
                {m.type === "twitter" ? "🐦" : m.type === "instagram" ? "📸" : m.type === "tiktok" ? "🎵" : "💬"}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-small font-semibold text-oc-text">{m.author}</span>
                  <OcBadge label={style.label} color={style.color} bg={style.bg} />
                  <span className="text-[9px] text-oc-text-muted ml-auto">{timeAgo(m.createdAt)}</span>
                </div>
                <div className="text-tiny text-oc-text-secondary leading-[1.5] mb-2">{m.content}</div>
                {m.isReplied ? (
                  <div className="p-[8px_10px] bg-oc-green-light rounded-oc-sm">
                    <div className="text-[9px] font-semibold text-oc-green uppercase tracking-[0.05em] mb-0.5">Auto-Reply Sent</div>
                    <div className="text-tiny text-oc-text-secondary">{m.replyText}</div>
                  </div>
                ) : (
                  <button
                    onClick={() => onReply(m.id)}
                    className="text-tiny font-semibold text-oc-blue bg-oc-blue-light border-none rounded-[6px] px-3 py-1.5 cursor-pointer hover:opacity-80 transition-opacity"
                  >
                    Auto-Reply
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
