"use client";

import { useState, useEffect, useCallback } from "react";
import { OcBadge } from "@/components/shared";
import { PlatformCard } from "@/components/social/platform-card";
import { PostQueue } from "@/components/social/post-queue";
import { MentionList } from "@/components/social/mention-list";
import type { PlatformConfig, SocialPost, Mention, SocialStats } from "@/lib/social/types";

type TabId = "queue" | "mentions" | "platforms";

export default function SocialPage() {
  const [tab, setTab] = useState<TabId>("queue");
  const [platforms, setPlatforms] = useState<PlatformConfig[]>([]);
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [mentions, setMentions] = useState<Mention[]>([]);
  const [stats, setStats] = useState<SocialStats | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [statsRes, postsRes, mentionsRes] = await Promise.all([
        fetch("/api/social/stats"),
        fetch("/api/social/posts"),
        fetch("/api/social/mentions"),
      ]);
      const statsData = await statsRes.json();
      const postsData = await postsRes.json();
      const mentionsData = await mentionsRes.json();

      setPlatforms(statsData.platforms || []);
      setStats(statsData.stats || null);
      setPosts(postsData.posts || []);
      setMentions(mentionsData.mentions || []);
    } catch {
      // silently fail
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleReply = async (mentionId: string) => {
    try {
      const res = await fetch("/api/social/mentions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mentionId }),
      });
      if (res.ok) await fetchData();
    } catch {
      console.error("[Social] Reply failed");
    }
  };

  const connectedCount = platforms.filter((p) => p.connected).length;
  const unrepliedCount = mentions.filter((m) => !m.isReplied).length;
  const scheduledCount = posts.filter((p) => p.status === "scheduled").length;

  const TABS: { id: TabId; label: string; count?: number }[] = [
    { id: "queue", label: "Post Queue", count: scheduledCount },
    { id: "mentions", label: "Mentions", count: unrepliedCount },
    { id: "platforms", label: "Platforms", count: connectedCount },
  ];

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-2.5">
        <span className="text-page-title text-oc-text">Social Media</span>
        <OcBadge label="Live" color="#059669" bg="#ECFDF5" />
      </div>

      <div className="grid grid-cols-5 gap-3">
        {[
          { label: "Total Posts", value: stats?.totalPosts ?? 0, color: "text-oc-green" },
          { label: "Scheduled", value: stats?.scheduled ?? 0, color: "text-oc-blue" },
          { label: "Total Mentions", value: stats?.totalMentions ?? 0, color: "text-oc-purple" },
          { label: "Unreplied", value: stats?.unrepliedMentions ?? 0, color: "text-oc-amber" },
          { label: "Posted", value: stats?.posted ?? 0, color: "text-oc-teal" },
        ].map((s) => (
          <div key={s.label} className="p-[14px_16px] bg-oc-card border border-oc-border rounded-oc">
            <div className="text-[9px] font-semibold text-oc-text-muted uppercase tracking-[0.05em] mb-1">{s.label}</div>
            <div className={`text-[22px] font-bold font-mono ${s.color}`}>{s.value}</div>
          </div>
        ))}
      </div>

      <div className="flex gap-1 border-b border-oc-border">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-small font-semibold border-b-2 transition-colors cursor-pointer bg-transparent ${
              tab === t.id ? "text-oc-blue border-oc-blue" : "text-oc-text-muted border-transparent hover:text-oc-text-secondary"
            }`}
          >
            {t.label}
            {t.count !== undefined && t.count > 0 && (
              <span className="text-[9px] font-bold bg-oc-bg text-oc-text-secondary rounded-full px-1.5 py-0.5 min-w-[18px] text-center">{t.count}</span>
            )}
          </button>
        ))}
      </div>

      <div>
        {tab === "queue" && <PostQueue posts={posts} />}
        {tab === "mentions" && <MentionList mentions={mentions} onReply={handleReply} />}
        {tab === "platforms" && (
          <div className="grid grid-cols-2 gap-3">
            {platforms.map((p) => (
              <PlatformCard key={p.id} platform={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
