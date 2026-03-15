"use client";

import { OcBadge } from "@/components/shared";
import type { SocialPost } from "@/lib/social/types";

function timeLabel(ts: string | null): string {
  if (!ts) return "Draft";
  const d = new Date(ts);
  const now = Date.now();
  if (d.getTime() < now) {
    const mins = Math.floor((now - d.getTime()) / 60000);
    if (mins < 60) return `${mins}m ago`;
    return `${Math.floor(mins / 60)}h ago`;
  }
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

const STATUS_STYLES: Record<string, { label: string; color: string; bg: string }> = {
  posted: { label: "Posted", color: "#059669", bg: "#ECFDF5" },
  scheduled: { label: "Scheduled", color: "#2563EB", bg: "#EFF4FF" },
  posting: { label: "Posting", color: "#D97706", bg: "#FFFBEB" },
  draft: { label: "Draft", color: "#9C9590", bg: "#F0EDE6" },
  failed: { label: "Failed", color: "#DC2626", bg: "#FEF2F2" },
};

export function PostQueue({ posts }: { posts: SocialPost[] }) {
  if (posts.length === 0) {
    return (
      <div className="text-center py-8 text-tiny text-oc-text-muted">
        No posts in queue
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {posts.map((post) => {
        const style = STATUS_STYLES[post.status] || STATUS_STYLES.draft;
        return (
          <div key={post.id} className="p-[12px_14px] bg-oc-card border border-oc-border rounded-[10px] hover:bg-oc-bg/50 transition-colors">
            <div className="flex items-start gap-2.5">
              <span className="text-[16px] mt-0.5">📄</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-small font-semibold text-oc-text truncate">
                    {post.platform?.name || post.platformId}
                  </span>
                  <OcBadge label={style.label} color={style.color} bg={style.bg} />
                </div>
                <div className="text-tiny text-oc-text-secondary truncate mb-1.5">
                  {post.content}
                </div>
                <div className="flex items-center gap-2">
                  {post.contentItem && (
                    <span className="text-[9px] font-mono text-oc-text-muted">{post.contentItem.title}</span>
                  )}
                  <span className="text-[9px] font-mono text-oc-text-muted ml-auto">
                    {timeLabel(post.scheduledAt)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
