"use client";

import { useState, useEffect, useCallback } from "react";
import { OcBadge } from "@/components/shared";
import {
  Repeat,
  RefreshCw,
  Trash2,
  ChevronDown,
  Loader2,
  FileText,
  Film,
  Image,
  Headphones,
  MessageSquare,
  BookOpen,
  Layers,
  Copy,
  Check,
} from "lucide-react";

// ── Types ──

interface ContentItem {
  id: string;
  title: string;
  description: string | null;
  script: string | null;
  tags: string[];
  targetPlatforms: string[];
  status: string;
  niche: string | null;
}

interface RepurposedItem {
  id: string;
  sourceContentId: string;
  title: string;
  format: string;
  platform: string;
  aspectRatio: string;
  script: string | null;
  caption: string | null;
  hashtags: string[];
  status: string;
  outputPath: string | null;
  createdAt: string;
  sourceContent?: {
    id: string;
    title: string;
    status: string;
    niche: string | null;
  };
}

interface RepurposeFormat {
  format: string;
  platform: string;
  label: string;
  aspectRatio: string;
}

// ── Constants ──

const ALL_FORMATS: RepurposeFormat[] = [
  { format: "short_clip", platform: "TikTok", label: "Short Clip (TikTok)", aspectRatio: "9:16" },
  { format: "short_clip", platform: "YouTube", label: "Short Clip (YouTube Shorts)", aspectRatio: "9:16" },
  { format: "short_clip", platform: "Instagram", label: "Reel (Instagram)", aspectRatio: "9:16" },
  { format: "carousel", platform: "Instagram", label: "Carousel (Instagram)", aspectRatio: "1:1" },
  { format: "carousel", platform: "LinkedIn", label: "Carousel (LinkedIn)", aspectRatio: "1:1" },
  { format: "quote_card", platform: "Instagram", label: "Quote Card (Instagram)", aspectRatio: "1:1" },
  { format: "quote_card", platform: "Twitter/X", label: "Quote Card (Twitter/X)", aspectRatio: "16:9" },
  { format: "audiogram", platform: "Instagram", label: "Audiogram (Instagram)", aspectRatio: "1:1" },
  { format: "audiogram", platform: "TikTok", label: "Audiogram (TikTok)", aspectRatio: "9:16" },
  { format: "blog_excerpt", platform: "LinkedIn", label: "Blog Excerpt (LinkedIn)", aspectRatio: "16:9" },
  { format: "blog_excerpt", platform: "Twitter/X", label: "Blog Excerpt (Twitter/X)", aspectRatio: "16:9" },
  { format: "thread", platform: "Twitter/X", label: "Thread (Twitter/X)", aspectRatio: "16:9" },
  { format: "thread", platform: "LinkedIn", label: "Thread (LinkedIn)", aspectRatio: "16:9" },
  { format: "story", platform: "Instagram", label: "Story (Instagram)", aspectRatio: "9:16" },
  { format: "story", platform: "TikTok", label: "Story (TikTok)", aspectRatio: "9:16" },
  { format: "story", platform: "YouTube", label: "Story (YouTube)", aspectRatio: "9:16" },
];

const formatIcons: Record<string, typeof Film> = {
  short_clip: Film,
  carousel: Layers,
  quote_card: Image,
  audiogram: Headphones,
  blog_excerpt: BookOpen,
  thread: MessageSquare,
  story: FileText,
};

const platformColors: Record<string, { color: string; bg: string }> = {
  TikTok: { color: "#000000", bg: "#F0F0F0" },
  Instagram: { color: "#E1306C", bg: "#FDF2F8" },
  YouTube: { color: "#FF0000", bg: "#FEF2F2" },
  LinkedIn: { color: "#0A66C2", bg: "#EFF6FF" },
  "Twitter/X": { color: "#1DA1F2", bg: "#EFF8FF" },
};

const formatColors: Record<string, { color: string; bg: string }> = {
  short_clip: { color: "#7C3AED", bg: "#F5F3FF" },
  carousel: { color: "#059669", bg: "#ECFDF5" },
  quote_card: { color: "#D97706", bg: "#FFFBEB" },
  audiogram: { color: "#DC2626", bg: "#FEF2F2" },
  blog_excerpt: { color: "#2563EB", bg: "#EFF6FF" },
  thread: { color: "#0891B2", bg: "#ECFEFF" },
  story: { color: "#DB2777", bg: "#FDF2F8" },
};

const statusColors: Record<string, { color: string; bg: string }> = {
  draft: { color: "#6B7280", bg: "#F3F4F6" },
  ready: { color: "#059669", bg: "#ECFDF5" },
  posted: { color: "#2563EB", bg: "#EFF6FF" },
};

export default function RepurposePage() {
  const [contentItems, setContentItems] = useState<ContentItem[]>([]);
  const [repurposedItems, setRepurposedItems] = useState<RepurposedItem[]>([]);
  const [selectedContentId, setSelectedContentId] = useState<string>("");
  const [selectedContent, setSelectedContent] = useState<ContentItem | null>(null);
  const [selectedFormats, setSelectedFormats] = useState<Set<string>>(new Set());
  const [isRepurposing, setIsRepurposing] = useState(false);
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch content items for dropdown
  const fetchContentItems = useCallback(async () => {
    const res = await fetch("/api/content").then((r) => r.json()).catch(() => ({ items: [] }));
    setContentItems(res.items || []);
  }, []);

  // Fetch repurposed content
  const fetchRepurposed = useCallback(async () => {
    const params = new URLSearchParams();
    if (selectedContentId) params.set("sourceContentId", selectedContentId);
    const res = await fetch(`/api/repurpose?${params.toString()}`).then((r) => r.json()).catch(() => ({ items: [] }));
    setRepurposedItems(res.items || []);
  }, [selectedContentId]);

  useEffect(() => {
    fetchContentItems();
    fetchRepurposed();
  }, [fetchContentItems, fetchRepurposed]);

  // When a content item is selected, load its details
  useEffect(() => {
    if (selectedContentId) {
      const item = contentItems.find((c) => c.id === selectedContentId);
      setSelectedContent(item || null);
      // Refresh repurposed items for this source
      fetchRepurposed();
    } else {
      setSelectedContent(null);
    }
  }, [selectedContentId, contentItems, fetchRepurposed]);

  const toggleFormat = (key: string) => {
    setSelectedFormats((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const selectAllFormats = () => {
    if (selectedFormats.size === ALL_FORMATS.length) {
      setSelectedFormats(new Set());
    } else {
      setSelectedFormats(new Set(ALL_FORMATS.map((f) => `${f.format}:${f.platform}`)));
    }
  };

  const handleRepurpose = async () => {
    if (!selectedContentId || selectedFormats.size === 0) return;
    setIsRepurposing(true);
    setError(null);

    try {
      const res = await fetch("/api/repurpose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contentItemId: selectedContentId,
          formats: Array.from(selectedFormats),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Repurpose failed");
      } else {
        setSelectedFormats(new Set());
        await fetchRepurposed();
      }
    } catch {
      setError("Network error. Check your connection.");
    } finally {
      setIsRepurposing(false);
    }
  };

  const deleteRepurposed = async (id: string) => {
    await fetch(`/api/repurpose/${id}`, { method: "DELETE" }).catch(() => {});
    await fetchRepurposed();
  };

  const copyToClipboard = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const updateStatus = async (id: string, status: string) => {
    await fetch(`/api/repurpose/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    }).catch(() => {});
    await fetchRepurposed();
  };

  // Group formats by type for checkbox UI
  const formatsByType = ALL_FORMATS.reduce<Record<string, RepurposeFormat[]>>((acc, f) => {
    if (!acc[f.format]) acc[f.format] = [];
    acc[f.format].push(f);
    return acc;
  }, {});

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="text-page-title text-oc-text">Content Repurposing</span>
          <OcBadge label="AI Powered" color="#7C3AED" bg="#F5F3FF" />
        </div>
        <button onClick={() => { fetchContentItems(); fetchRepurposed(); }} className="p-1.5 rounded-oc hover:bg-oc-bg" title="Refresh">
          <RefreshCw className="w-4 h-4 text-oc-text-muted" />
        </button>
      </div>

      {/* Source Content Selection */}
      <div className="p-4 bg-oc-card border border-oc-border rounded-oc">
        <div className="text-small font-semibold text-oc-text mb-3">1. Select Source Content</div>

        <div className="relative">
          <select
            value={selectedContentId}
            onChange={(e) => setSelectedContentId(e.target.value)}
            className="w-full text-small px-3 py-2 border border-oc-border rounded-oc bg-white text-oc-text appearance-none cursor-pointer"
          >
            <option value="">-- Select content to repurpose --</option>
            {contentItems.map((item) => (
              <option key={item.id} value={item.id}>
                {item.title} ({item.status}) {item.niche ? `[${item.niche}]` : ""}
              </option>
            ))}
          </select>
          <ChevronDown className="w-4 h-4 text-oc-text-muted absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        {/* Selected content preview */}
        {selectedContent && (
          <div className="mt-3 p-3 bg-oc-bg rounded-oc">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-small font-semibold text-oc-text">{selectedContent.title}</span>
              <OcBadge label={selectedContent.status} color="#6B6560" bg="#F8F7F4" />
              {selectedContent.niche && (
                <OcBadge label={selectedContent.niche} color="#7C3AED" bg="#F5F3FF" />
              )}
            </div>
            {selectedContent.script && (
              <div className="text-tiny text-oc-text-secondary line-clamp-3 mb-2">
                {selectedContent.script}
              </div>
            )}
            <div className="flex items-center gap-2 flex-wrap">
              {selectedContent.targetPlatforms.map((p) => {
                const pc = platformColors[p] || { color: "#6B7280", bg: "#F3F4F6" };
                return <OcBadge key={p} label={p} color={pc.color} bg={pc.bg} />;
              })}
              {selectedContent.tags.slice(0, 5).map((tag) => (
                <span key={tag} className="text-[10px] text-oc-blue bg-oc-blue-light px-1.5 py-0.5 rounded-oc">
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Format Selection */}
      {selectedContentId && (
        <div className="p-4 bg-oc-card border border-oc-border rounded-oc">
          <div className="flex items-center justify-between mb-3">
            <div className="text-small font-semibold text-oc-text">2. Choose Target Formats</div>
            <button
              onClick={selectAllFormats}
              className="text-[10px] font-semibold text-oc-blue hover:underline"
            >
              {selectedFormats.size === ALL_FORMATS.length ? "Deselect All" : "Select All"}
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {Object.entries(formatsByType).map(([formatType, formats]) => {
              const Icon = formatIcons[formatType] || FileText;
              const fc = formatColors[formatType] || { color: "#6B7280", bg: "#F3F4F6" };

              return (
                <div key={formatType}>
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className="w-3.5 h-3.5" style={{ color: fc.color }} />
                    <span className="text-[11px] font-semibold text-oc-text uppercase tracking-wide">
                      {formatType.replace(/_/g, " ")}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formats.map((f) => {
                      const key = `${f.format}:${f.platform}`;
                      const isSelected = selectedFormats.has(key);
                      const pc = platformColors[f.platform] || { color: "#6B7280", bg: "#F3F4F6" };

                      return (
                        <button
                          key={key}
                          onClick={() => toggleFormat(key)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-oc text-[11px] font-medium border transition-all ${
                            isSelected
                              ? "border-oc-blue bg-oc-blue-light text-oc-blue"
                              : "border-oc-border bg-white text-oc-text-secondary hover:border-oc-blue/40"
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3" />}
                          <span style={{ color: pc.color }}>{f.platform}</span>
                          <span className="text-oc-text-muted">({f.aspectRatio})</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Repurpose button */}
          <div className="mt-4 flex items-center gap-3">
            <button
              onClick={handleRepurpose}
              disabled={isRepurposing || selectedFormats.size === 0}
              className="flex items-center gap-2 px-4 py-2 bg-oc-text text-white rounded-oc text-small font-semibold hover:opacity-90 disabled:opacity-50"
            >
              {isRepurposing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating {selectedFormats.size} versions...
                </>
              ) : (
                <>
                  <Repeat className="w-4 h-4" />
                  Repurpose into {selectedFormats.size} format{selectedFormats.size !== 1 ? "s" : ""}
                </>
              )}
            </button>
            {selectedFormats.size > 0 && (
              <span className="text-tiny text-oc-text-muted">
                {selectedFormats.size} format{selectedFormats.size !== 1 ? "s" : ""} selected
              </span>
            )}
          </div>

          {error && (
            <div className="mt-3 p-2.5 bg-red-50 border border-red-200 rounded-oc text-small text-red-700">
              {error}
            </div>
          )}
        </div>
      )}

      {/* Results Grid */}
      {repurposedItems.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="text-small font-semibold text-oc-text">
              Repurposed Versions ({repurposedItems.length})
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {repurposedItems.map((item) => {
              const fc = formatColors[item.format] || { color: "#6B7280", bg: "#F3F4F6" };
              const pc = platformColors[item.platform] || { color: "#6B7280", bg: "#F3F4F6" };
              const sc = statusColors[item.status] || statusColors.draft;
              const Icon = formatIcons[item.format] || FileText;
              const isExpanded = expandedItem === item.id;

              return (
                <div key={item.id} className="p-4 bg-oc-card border border-oc-border rounded-oc">
                  {/* Card Header */}
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Icon className="w-3.5 h-3.5 shrink-0" style={{ color: fc.color }} />
                      <OcBadge label={item.format.replace(/_/g, " ")} color={fc.color} bg={fc.bg} />
                      <OcBadge label={item.platform} color={pc.color} bg={pc.bg} />
                      <OcBadge label={item.aspectRatio} color="#6B6560" bg="#F8F7F4" />
                    </div>
                    <div className="flex items-center gap-1">
                      {/* Status dropdown */}
                      <select
                        value={item.status}
                        onChange={(e) => updateStatus(item.id, e.target.value)}
                        className="text-[10px] font-semibold px-1.5 py-0.5 rounded-oc border-0 cursor-pointer"
                        style={{ color: sc.color, backgroundColor: sc.bg }}
                      >
                        <option value="draft">Draft</option>
                        <option value="ready">Ready</option>
                        <option value="posted">Posted</option>
                      </select>
                      <button
                        onClick={() => deleteRepurposed(item.id)}
                        className="p-1 rounded-oc hover:bg-red-50 text-oc-text-muted hover:text-red-500"
                        title="Delete"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* Title */}
                  <div className="text-small font-semibold text-oc-text mb-1.5">{item.title}</div>

                  {/* Source info */}
                  {item.sourceContent && (
                    <div className="text-[9px] text-oc-text-muted mb-2">
                      From: {item.sourceContent.title}
                    </div>
                  )}

                  {/* Caption preview */}
                  {item.caption && (
                    <div className="mb-2">
                      <div
                        className={`text-tiny text-oc-text-secondary ${isExpanded ? "" : "line-clamp-3"}`}
                      >
                        {item.caption}
                      </div>
                      {item.caption.length > 150 && (
                        <button
                          onClick={() => setExpandedItem(isExpanded ? null : item.id)}
                          className="text-[10px] text-oc-blue font-medium hover:underline mt-0.5"
                        >
                          {isExpanded ? "Show less" : "Show more"}
                        </button>
                      )}
                    </div>
                  )}

                  {/* Hashtags */}
                  {item.hashtags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {item.hashtags.slice(0, isExpanded ? item.hashtags.length : 5).map((tag) => (
                        <span key={tag} className="text-[10px] text-oc-blue bg-oc-blue-light px-1.5 py-0.5 rounded-oc">
                          #{tag}
                        </span>
                      ))}
                      {!isExpanded && item.hashtags.length > 5 && (
                        <span className="text-[10px] text-oc-text-muted">
                          +{item.hashtags.length - 5} more
                        </span>
                      )}
                    </div>
                  )}

                  {/* Actions row */}
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-oc-border-light">
                    <span className="text-[9px] text-oc-text-muted">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </span>
                    <div className="flex items-center gap-1">
                      {item.caption && (
                        <button
                          onClick={() => copyToClipboard(item.caption!, `caption-${item.id}`)}
                          className="flex items-center gap-1 text-[10px] text-oc-text-muted hover:text-oc-blue px-1.5 py-0.5 rounded-oc hover:bg-oc-bg"
                          title="Copy caption"
                        >
                          {copiedId === `caption-${item.id}` ? <Check className="w-3 h-3 text-oc-green" /> : <Copy className="w-3 h-3" />}
                          Caption
                        </button>
                      )}
                      {item.script && (
                        <button
                          onClick={() => copyToClipboard(item.script!, `script-${item.id}`)}
                          className="flex items-center gap-1 text-[10px] text-oc-text-muted hover:text-oc-blue px-1.5 py-0.5 rounded-oc hover:bg-oc-bg"
                          title="Copy script"
                        >
                          {copiedId === `script-${item.id}` ? <Check className="w-3 h-3 text-oc-green" /> : <Copy className="w-3 h-3" />}
                          Script
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty state */}
      {repurposedItems.length === 0 && !selectedContentId && (
        <div className="p-8 bg-oc-card border border-oc-border rounded-oc text-center">
          <Repeat className="w-8 h-8 text-oc-text-muted mx-auto mb-3" />
          <div className="text-small font-semibold text-oc-text mb-1">Content Repurposing</div>
          <div className="text-tiny text-oc-text-muted max-w-md mx-auto">
            Select a content item above to create platform-specific versions.
            Claude AI will adapt your content for TikTok, Instagram, YouTube, LinkedIn, and Twitter/X with optimized captions, hashtags, and formatting.
          </div>
        </div>
      )}

      {repurposedItems.length === 0 && selectedContentId && !isRepurposing && (
        <div className="p-6 bg-oc-card border border-oc-border rounded-oc text-center">
          <Layers className="w-6 h-6 text-oc-text-muted mx-auto mb-2" />
          <div className="text-small text-oc-text-muted">
            No repurposed versions yet. Select formats above and click Repurpose.
          </div>
        </div>
      )}
    </div>
  );
}
