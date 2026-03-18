"use client";

import { useState, useEffect, useCallback } from "react";
import { OcCard, SectionHeader, OcBadge } from "@/components/shared";

interface TrendingTopic {
  id: string;
  title: string;
  description: string | null;
  source: string;
  sourceUrl: string | null;
  sourceAuthor: string | null;
  sourceFollowers: number | null;
  platform: string | null;
  niche: string;
  tags: string[];
  viralityScore: number;
  growthRate: string | null;
  contentFormat: string | null;
  hookUsed: string | null;
  whyViral: string | null;
  contentAngle: string | null;
  audienceDemo: string | null;
  competitorsCovering: string[];
  status: string;
  scannedAt: string;
}

const PLATFORM_COLORS: Record<string, { color: string; bg: string }> = {
  "twitter": { color: "#000", bg: "#F0F0F0" },
  "tiktok": { color: "#000", bg: "#F0F0F0" },
  "youtube": { color: "#FF0000", bg: "#FEF2F2" },
  "reddit": { color: "#FF4500", bg: "#FFF7ED" },
  "instagram": { color: "#E4405F", bg: "#FDF2F8" },
  "linkedin": { color: "#0A66C2", bg: "#EFF4FF" },
  "google_trends": { color: "#4285F4", bg: "#EFF4FF" },
  "news": { color: "#059669", bg: "#ECFDF5" },
};

export default function IdeasPage() {
  const [topics, setTopics] = useState<TrendingTopic[]>([]);
  const [niches, setNiches] = useState<{ niche: string; count: number }[]>([]);
  const [filterNiche, setFilterNiche] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<string | null>(null);

  const fetchTopics = useCallback(async () => {
    const params = new URLSearchParams();
    if (filterNiche) params.set("niche", filterNiche);
    if (filterStatus) params.set("status", filterStatus);
    params.set("limit", "50");

    const res = await fetch(`/api/research/trending?${params}`);
    const data = await res.json();
    setTopics(data.topics || []);
    setNiches(data.niches || []);
  }, [filterNiche, filterStatus]);

  useEffect(() => { fetchTopics(); }, [fetchTopics]);

  async function handleScan() {
    setScanning(true);
    setScanResult(null);
    try {
      const res = await fetch("/api/research/scan", { method: "POST" });
      const data = await res.json();
      setScanResult(data.message || `Found ${data.scanned} topics`);
      fetchTopics();
    } catch {
      setScanResult("Scan failed");
    } finally {
      setScanning(false);
    }
  }

  async function handleUseForContent(topicId: string) {
    const topic = topics.find((t) => t.id === topicId);
    if (!topic) return;

    // Create content item from topic
    const res = await fetch("/api/content", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: topic.title,
        description: `${topic.description || ""}\n\nSource: ${topic.source} (${topic.platform || "web"})${topic.sourceUrl ? `\nURL: ${topic.sourceUrl}` : ""}`,
        tags: topic.tags,
        niche: topic.niche,
        targetPlatforms: ["tiktok", "instagram", "youtube"],
      }),
    });

    if (res.ok) {
      // Mark topic as used
      await fetch(`/api/research/trending`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...topic, status: "used" }),
      });
      fetchTopics();
    }
  }

  return (
    <>
      <SectionHeader
        title="Ideas & Research"
        subtitle="Trending topics scanned from across the internet"
      />

      {/* Controls */}
      <div className="flex items-center gap-3 mb-5">
        <select
          value={filterNiche}
          onChange={(e) => setFilterNiche(e.target.value)}
          className="px-3 py-2 text-small bg-oc-card border border-oc-border rounded-oc-sm text-oc-text"
        >
          <option value="">All Niches</option>
          {niches.map((n) => (
            <option key={n.niche} value={n.niche}>{n.niche} ({n.count})</option>
          ))}
        </select>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2 text-small bg-oc-card border border-oc-border rounded-oc-sm text-oc-text"
        >
          <option value="">All Status</option>
          <option value="new">New</option>
          <option value="reviewed">Reviewed</option>
          <option value="selected">Selected</option>
          <option value="used">Used</option>
          <option value="dismissed">Dismissed</option>
        </select>

        <div className="ml-auto flex items-center gap-2">
          {scanResult && (
            <span className="text-tiny font-semibold text-oc-green">{scanResult}</span>
          )}
          <button
            onClick={handleScan}
            disabled={scanning}
            className="px-4 py-2 text-small font-semibold text-white bg-oc-text rounded-oc-sm cursor-pointer border-none disabled:opacity-50"
          >
            {scanning ? "Scanning..." : "Scan Now"}
          </button>
        </div>
      </div>

      {/* Topics Grid */}
      {topics.length === 0 ? (
        <OcCard>
          <div className="text-center py-12">
            <div className="text-[32px] mb-3">🔍</div>
            <div className="text-small font-semibold text-oc-text mb-1">No trending topics yet</div>
            <div className="text-tiny text-oc-text-muted mb-4">Click Scan Now to search for trending content across the internet</div>
          </div>
        </OcCard>
      ) : (
        <div className="grid grid-cols-2 xl:grid-cols-3 gap-3">
          {topics.map((topic) => {
            const pc = PLATFORM_COLORS[topic.source] || PLATFORM_COLORS.news;
            return (
              <OcCard key={topic.id}>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    {topic.platform && (
                      <OcBadge label={topic.platform} color={pc.color} bg={pc.bg} />
                    )}
                    <OcBadge label={topic.niche} color="#7C3AED" bg="#F5F3FF" />
                  </div>
                  <div className="text-tiny font-mono text-oc-text-muted">
                    {new Date(topic.scannedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </div>
                </div>

                <h3 className="text-small font-semibold text-oc-text mb-1 leading-[1.3]">
                  {topic.title}
                </h3>

                {topic.description && (
                  <p className="text-tiny text-oc-text-secondary leading-[1.5] mb-2 line-clamp-2">
                    {topic.description}
                  </p>
                )}

                {/* Hook — the most important intel */}
                {topic.hookUsed && (
                  <div className="mb-2 p-2 bg-oc-blue-light rounded-[6px] border-l-2 border-oc-blue">
                    <div className="text-[9px] font-semibold text-oc-blue uppercase mb-0.5">Hook used</div>
                    <div className="text-tiny text-oc-text leading-[1.4] italic">&ldquo;{topic.hookUsed}&rdquo;</div>
                  </div>
                )}

                {/* Why viral */}
                {topic.whyViral && (
                  <p className="text-tiny text-oc-text-muted leading-[1.4] mb-2">
                    <span className="font-semibold text-oc-text-secondary">Why viral:</span> {topic.whyViral.slice(0, 120)}
                  </p>
                )}

                {/* Virality Score + Growth */}
                <div className="mb-2">
                  <div className="flex justify-between text-tiny mb-0.5">
                    <span className="text-oc-text-muted">Virality</span>
                    <div className="flex items-center gap-2">
                      {topic.growthRate && <span className="text-[9px] text-oc-green font-semibold">{topic.growthRate}</span>}
                      <span className="font-mono font-semibold text-oc-text">{Math.round(topic.viralityScore)}</span>
                    </div>
                  </div>
                  <div className="w-full h-[4px] bg-oc-border-light rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${topic.viralityScore}%`,
                        backgroundColor: topic.viralityScore > 70 ? "#059669" : topic.viralityScore > 40 ? "#2563EB" : "#D97706",
                      }}
                    />
                  </div>
                </div>

                {/* Meta row: format, audience, source author */}
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {topic.contentFormat && (
                    <OcBadge label={topic.contentFormat} color="#6B6560" bg="#F8F7F4" />
                  )}
                  {topic.audienceDemo && (
                    <OcBadge label={topic.audienceDemo} color="#0D9488" bg="#F0FDFA" />
                  )}
                  {topic.sourceAuthor && (
                    <span className="text-[9px] font-mono text-oc-text-muted">{topic.sourceAuthor}{topic.sourceFollowers ? ` (${topic.sourceFollowers >= 1000 ? Math.round(topic.sourceFollowers / 1000) + "K" : topic.sourceFollowers})` : ""}</span>
                  )}
                </div>

                {/* Tags */}
                {topic.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {topic.tags.slice(0, 4).map((tag) => (
                      <span key={tag} className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-oc-bg text-oc-text-secondary border border-oc-border-light">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-oc-border-light">
                  {topic.sourceUrl ? (
                    <a
                      href={topic.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-tiny font-semibold text-oc-blue no-underline"
                    >
                      View Source →
                    </a>
                  ) : (
                    <span className="text-tiny text-oc-text-muted">{topic.source}</span>
                  )}

                  {topic.status !== "used" && (
                    <button
                      onClick={() => handleUseForContent(topic.id)}
                      className="text-tiny font-semibold text-white bg-oc-blue px-2.5 py-1 rounded-[4px] border-none cursor-pointer"
                    >
                      Use for Content
                    </button>
                  )}
                  {topic.status === "used" && (
                    <span className="text-tiny font-semibold text-oc-green">Used ✓</span>
                  )}
                </div>
              </OcCard>
            );
          })}
        </div>
      )}
    </>
  );
}
