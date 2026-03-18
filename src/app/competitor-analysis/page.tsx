"use client";

import { useState, useEffect, useCallback } from "react";
import { OcBadge } from "@/components/shared";
import {
  Search,
  Plus,
  RefreshCw,
  Users,
  TrendingUp,
  Hash,
  Clock,
  BarChart3,
  Radar,
  Globe,
} from "lucide-react";

interface Competitor {
  id: string;
  name: string;
  platform: string;
  handle: string;
  niche: string;
  followers: number;
  followingCount: number;
  postFrequency: number | null;
  avgEngagement: number | null;
  topHashtags: string[];
  contentFormats: Record<string, number> | null;
  bestPostingTime: { hour: number; dayOfWeek: number } | null;
  lastScanned: string | null;
  isActive: boolean;
  scans?: { id: string; followers: number; engagement: number | null; postsFound: number; insights: string | null; scannedAt: string }[];
}

const platformColors: Record<string, { color: string; bg: string }> = {
  TikTok: { color: "#000000", bg: "#F0F0F0" },
  Instagram: { color: "#E1306C", bg: "#FDF2F8" },
  YouTube: { color: "#FF0000", bg: "#FEF2F2" },
  Facebook: { color: "#1877F2", bg: "#EFF6FF" },
  Twitter: { color: "#1DA1F2", bg: "#EFF8FF" },
  LinkedIn: { color: "#0A66C2", bg: "#EFF6FF" },
};

export default function CompetitorAnalysisPage() {
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [filterNiche, setFilterNiche] = useState<string>("all");
  const [filterPlatform, setFilterPlatform] = useState<string>("all");
  const [showAddForm, setShowAddForm] = useState(false);
  const [scanning, setScanning] = useState<string | null>(null);

  // Form state
  const [formName, setFormName] = useState("");
  const [formHandle, setFormHandle] = useState("");
  const [formPlatform, setFormPlatform] = useState("TikTok");
  const [formNiche, setFormNiche] = useState("AI");
  const [adding, setAdding] = useState(false);

  const fetchData = useCallback(async () => {
    const params = new URLSearchParams();
    if (filterNiche !== "all") params.set("niche", filterNiche);
    if (filterPlatform !== "all") params.set("platform", filterPlatform);

    const res = await fetch(`/api/competitors?${params.toString()}`)
      .then((r) => r.json())
      .catch(() => ({ competitors: [] }));
    setCompetitors(res.competitors || []);
  }, [filterNiche, filterPlatform]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const addCompetitor = async () => {
    if (!formName.trim() || !formHandle.trim()) return;
    setAdding(true);
    await fetch("/api/competitors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: formName.trim(),
        handle: formHandle.trim().replace(/^@/, ""),
        platform: formPlatform,
        niche: formNiche,
      }),
    });
    setFormName("");
    setFormHandle("");
    setShowAddForm(false);
    await fetchData();
    setAdding(false);
  };

  const scanCompetitor = async (id: string) => {
    setScanning(id);
    await fetch(`/api/competitors/${id}/scan`, { method: "POST" }).catch(() => {});
    await fetchData();
    setScanning(null);
  };

  const niches = Array.from(new Set(competitors.map((c) => c.niche)));
  const platforms = Array.from(new Set(competitors.map((c) => c.platform)));

  // Summary stats
  const totalCompetitors = competitors.length;
  const avgEngagement = competitors.length > 0
    ? competitors.reduce((s, c) => s + (c.avgEngagement || 0), 0) / competitors.length
    : 0;
  const totalFollowers = competitors.reduce((s, c) => s + c.followers, 0);
  const scannedCount = competitors.filter((c) => c.lastScanned).length;

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="text-page-title text-oc-text">Competitor Analysis</span>
          <OcBadge label="Intelligence" color="#DC2626" bg="#FEF2F2" />
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchData} className="p-1.5 rounded-oc hover:bg-oc-bg" title="Refresh">
            <RefreshCw className="w-4 h-4 text-oc-text-muted" />
          </button>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-oc-text text-white rounded-oc text-small font-semibold hover:opacity-90"
          >
            <Plus className="w-3.5 h-3.5" />Track Competitor
          </button>
        </div>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Tracked Competitors", value: totalCompetitors.toString(), color: "text-oc-blue", icon: Users },
          { label: "Total Follower Base", value: totalFollowers >= 1000 ? `${(totalFollowers / 1000).toFixed(1)}K` : totalFollowers.toString(), color: "text-oc-purple", icon: TrendingUp },
          { label: "Avg Engagement Rate", value: `${avgEngagement.toFixed(2)}%`, color: "text-oc-green", icon: BarChart3 },
          { label: "Scanned", value: `${scannedCount}/${totalCompetitors}`, color: "text-oc-teal", icon: Radar },
        ].map((kpi) => (
          <div key={kpi.label} className="p-[14px_16px] bg-oc-card border border-oc-border rounded-oc">
            <div className="flex items-center gap-1.5 mb-1">
              <kpi.icon className="w-3 h-3 text-oc-text-muted" />
              <div className="text-[9px] font-semibold text-oc-text-muted uppercase tracking-[0.05em]">{kpi.label}</div>
            </div>
            <div className={`text-[22px] font-bold font-mono ${kpi.color}`}>{kpi.value}</div>
          </div>
        ))}
      </div>

      {/* Add Competitor Form */}
      {showAddForm && (
        <div className="p-4 bg-oc-card border border-oc-border rounded-oc">
          <div className="text-small font-semibold text-oc-text mb-3">Track New Competitor</div>
          <div className="grid grid-cols-5 gap-3 items-end">
            <div>
              <label className="text-[9px] font-semibold text-oc-text-muted uppercase block mb-1">Name</label>
              <input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Competitor name"
                className="w-full text-small px-3 py-1.5 border border-oc-border rounded-oc bg-white text-oc-text"
              />
            </div>
            <div>
              <label className="text-[9px] font-semibold text-oc-text-muted uppercase block mb-1">Handle</label>
              <input
                value={formHandle}
                onChange={(e) => setFormHandle(e.target.value)}
                placeholder="@username"
                className="w-full text-small px-3 py-1.5 border border-oc-border rounded-oc bg-white text-oc-text"
              />
            </div>
            <div>
              <label className="text-[9px] font-semibold text-oc-text-muted uppercase block mb-1">Platform</label>
              <select value={formPlatform} onChange={(e) => setFormPlatform(e.target.value)} className="w-full text-small px-3 py-1.5 border border-oc-border rounded-oc bg-white text-oc-text">
                <option>TikTok</option><option>Instagram</option><option>YouTube</option><option>Facebook</option><option>Twitter</option><option>LinkedIn</option>
              </select>
            </div>
            <div>
              <label className="text-[9px] font-semibold text-oc-text-muted uppercase block mb-1">Niche</label>
              <select value={formNiche} onChange={(e) => setFormNiche(e.target.value)} className="w-full text-small px-3 py-1.5 border border-oc-border rounded-oc bg-white text-oc-text">
                <option>AI</option><option>Fitness</option><option>Finance</option><option>Beauty</option><option>Tech</option><option>Food</option>
              </select>
            </div>
            <button
              onClick={addCompetitor}
              disabled={adding || !formName.trim() || !formHandle.trim()}
              className="px-3 py-1.5 bg-oc-green text-white rounded-oc text-small font-semibold hover:opacity-90 disabled:opacity-50"
            >
              {adding ? "Adding..." : "Add"}
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-3">
        <Search className="w-3.5 h-3.5 text-oc-text-muted" />
        <select value={filterPlatform} onChange={(e) => setFilterPlatform(e.target.value)} className="text-small px-3 py-1.5 border border-oc-border rounded-oc bg-oc-card text-oc-text">
          <option value="all">All Platforms</option>
          {platforms.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
        <select value={filterNiche} onChange={(e) => setFilterNiche(e.target.value)} className="text-small px-3 py-1.5 border border-oc-border rounded-oc bg-oc-card text-oc-text">
          <option value="all">All Niches</option>
          {niches.map((n) => <option key={n} value={n}>{n}</option>)}
        </select>
        <span className="text-tiny text-oc-text-muted ml-auto">{competitors.length} competitor{competitors.length !== 1 ? "s" : ""}</span>
      </div>

      {/* Competitor Cards */}
      {competitors.length === 0 ? (
        <div className="p-8 bg-oc-card border border-oc-border rounded-oc text-center">
          <Radar className="w-8 h-8 text-oc-text-muted mx-auto mb-3" />
          <div className="text-small text-oc-text-muted">No competitors tracked yet. Add a competitor to start analyzing their content strategy.</div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {competitors.map((comp) => {
            const pc = platformColors[comp.platform] || { color: "#6B7280", bg: "#F3F4F6" };
            const latestScan = comp.scans?.[0];
            return (
              <div key={comp.id} className="p-4 bg-oc-card border border-oc-border rounded-oc">
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-small font-semibold text-oc-text">{comp.name}</span>
                      <OcBadge label={comp.platform} color={pc.color} bg={pc.bg} />
                    </div>
                    <div className="text-tiny text-oc-text-muted mt-0.5">@{comp.handle} · {comp.niche}</div>
                  </div>
                  <button
                    onClick={() => scanCompetitor(comp.id)}
                    disabled={scanning === comp.id}
                    className="flex items-center gap-1 px-2 py-1 text-[10px] font-semibold text-oc-blue border border-oc-blue/30 rounded-oc hover:bg-oc-blue-light disabled:opacity-50"
                  >
                    <Search className="w-3 h-3" />
                    {scanning === comp.id ? "Scanning..." : "Scan"}
                  </button>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-4 gap-2 mb-3">
                  <div className="text-center p-2 bg-oc-bg rounded-oc">
                    <div className="flex items-center justify-center gap-1 mb-0.5">
                      <Users className="w-3 h-3 text-oc-text-muted" />
                    </div>
                    <div className="text-[14px] font-bold font-mono text-oc-text">
                      {comp.followers >= 1000 ? `${(comp.followers / 1000).toFixed(1)}K` : comp.followers}
                    </div>
                    <div className="text-[9px] text-oc-text-muted uppercase">Followers</div>
                  </div>
                  <div className="text-center p-2 bg-oc-bg rounded-oc">
                    <div className="flex items-center justify-center gap-1 mb-0.5">
                      <TrendingUp className="w-3 h-3 text-oc-text-muted" />
                    </div>
                    <div className="text-[14px] font-bold font-mono text-oc-green">
                      {comp.avgEngagement ? `${comp.avgEngagement.toFixed(2)}%` : "N/A"}
                    </div>
                    <div className="text-[9px] text-oc-text-muted uppercase">Engagement</div>
                  </div>
                  <div className="text-center p-2 bg-oc-bg rounded-oc">
                    <div className="flex items-center justify-center gap-1 mb-0.5">
                      <Globe className="w-3 h-3 text-oc-text-muted" />
                    </div>
                    <div className="text-[14px] font-bold font-mono text-oc-text">
                      {comp.postFrequency ? `${comp.postFrequency.toFixed(1)}/d` : "N/A"}
                    </div>
                    <div className="text-[9px] text-oc-text-muted uppercase">Post Freq</div>
                  </div>
                  <div className="text-center p-2 bg-oc-bg rounded-oc">
                    <div className="flex items-center justify-center gap-1 mb-0.5">
                      <Clock className="w-3 h-3 text-oc-text-muted" />
                    </div>
                    <div className="text-[14px] font-bold font-mono text-oc-text">
                      {comp.bestPostingTime ? `${comp.bestPostingTime.hour}:00` : "N/A"}
                    </div>
                    <div className="text-[9px] text-oc-text-muted uppercase">Best Time</div>
                  </div>
                </div>

                {/* Content Formats */}
                {comp.contentFormats && Object.keys(comp.contentFormats).length > 0 && (
                  <div className="mb-3">
                    <div className="text-[9px] font-semibold text-oc-text-muted uppercase mb-1">Content Formats</div>
                    <div className="flex gap-1.5">
                      {Object.entries(comp.contentFormats).map(([format, pct]) => (
                        <div key={format} className="flex items-center gap-1">
                          <OcBadge label={`${format}: ${typeof pct === "number" ? pct : 0}%`} color="#6B6560" bg="#F8F7F4" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Top Hashtags */}
                {comp.topHashtags.length > 0 && (
                  <div className="mb-3">
                    <div className="flex items-center gap-1 mb-1">
                      <Hash className="w-3 h-3 text-oc-text-muted" />
                      <div className="text-[9px] font-semibold text-oc-text-muted uppercase">Top Hashtags</div>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {comp.topHashtags.slice(0, 8).map((tag) => (
                        <span key={tag} className="text-[10px] text-oc-blue bg-oc-blue-light px-1.5 py-0.5 rounded-oc">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Latest Scan Insights */}
                {latestScan?.insights && (
                  <div className="p-2.5 bg-oc-bg rounded-oc">
                    <div className="text-[9px] font-semibold text-oc-text-muted uppercase mb-1">AI Insights</div>
                    <div className="text-tiny text-oc-text leading-relaxed line-clamp-3">{latestScan.insights}</div>
                  </div>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between text-[9px] text-oc-text-muted mt-3 pt-2 border-t border-oc-border-light">
                  <span>
                    Last scanned: {comp.lastScanned ? new Date(comp.lastScanned).toLocaleDateString() : "Never"}
                  </span>
                  {latestScan && (
                    <span>{latestScan.postsFound} posts found</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
