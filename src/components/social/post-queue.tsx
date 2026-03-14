"use client";

import { OcBadge } from "@/components/shared";
import type { ScheduledPost } from "@/lib/social/types";

function timeLabel(ts: number): string {
  const d = new Date(ts);
  const now = Date.now();
  if (ts < now) {
    const mins = Math.floor((now - ts) / 60000);
    if (mins < 60) return `${mins}m ago`;
    return `${Math.floor(mins / 60)}h ago`;
  }
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

const STATUS_STYLES: Record<string, { label: string; color: string; bg: string }> = {
  published: { label: "Published", color: "#059669", bg: "#ECFDF5" },
  scheduled: { label: "Scheduled", color: "#2563EB", bg: "#EFF4FF" },
  publishing: { label: "Publishing", color: "#D97706", bg: "#FFFBEB" },
  draft: { label: "Draft", color: "#9C9590", bg: "#F0EDE6" },
  failed: { label: "Failed", color: "#DC2626", bg: "#FEF2F2" },
};

const MEDIA_ICONS: Record<string, string> = {
  video: "🎬",
  image: "🖼️",
  text: "📝",
  carousel: "🎠",
};

export function PostQueue({ posts }: { posts: ScheduledPost[] }) {
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
          <div
            key={post.id}
            className="p-[12px_14px] bg-oc-card border border-oc-border rounded-[10px] hover:bg-oc-bg/50 transition-colors"
          >
            <div className="flex items-start gap-2.5">
              <span className="text-[16px] mt-0.5">{MEDIA_ICONS[post.mediaType] || "📄"}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-small font-semibold text-oc-text truncate">
                    {post.title}
                  </span>
                  <OcBadge label={style.label} color={style.color} bg={style.bg} />
                </div>
                <div className="text-tiny text-oc-text-secondary truncate mb-1.5">
                  {post.caption}
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    {post.platforms.map((p) => (
                      <span
                        key={p}
                        className="text-[9px] font-semibold px-[6px] py-[2px] rounded bg-oc-bg text-oc-text-secondary border border-oc-border-light"
                      >
                        {p}
                      </span>
                    ))}
                  </div>
                  <span className="text-[9px] font-mono text-oc-text-muted">
                    {post.contentId}
                  </span>
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
