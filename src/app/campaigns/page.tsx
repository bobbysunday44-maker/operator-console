"use client";

import { useState, useEffect, useCallback } from "react";
import { OcBadge } from "@/components/shared";
import {
  Megaphone,
  Plus,
  RefreshCw,
  Filter,
  DollarSign,
  MousePointerClick,
  BarChart3,
  FileText,
} from "lucide-react";

interface Campaign {
  id: string;
  businessName: string;
  businessEmail: string | null;
  businessUrl: string | null;
  characterId: string | null;
  niche: string;
  status: string;
  commission: number;
  totalRevenue: number;
  totalClicks: number;
  totalConversions: number;
  contentCount: number;
  notes: string | null;
  startedAt: string;
  createdAt: string;
}

interface DashboardStats {
  activeCampaigns: number;
  totalCampaigns: number;
  totalRevenue: number;
  totalCommission: number;
  totalClicks: number;
  totalConversions: number;
  conversionRate: number;
  topCampaigns: { id: string; businessName: string; niche: string; revenue: number; commission: number }[];
  byNiche: Record<string, { count: number; revenue: number }>;
}

interface Character {
  id: string;
  name: string;
  niche: string | null;
}

const statusColors: Record<string, { color: string; bg: string }> = {
  active: { color: "#059669", bg: "#ECFDF5" },
  paused: { color: "#D97706", bg: "#FFFBEB" },
  completed: { color: "#6366F1", bg: "#EEF2FF" },
  pitched: { color: "#9CA3AF", bg: "#F3F4F6" },
  draft: { color: "#6B7280", bg: "#F9FAFB" },
};

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterNiche, setFilterNiche] = useState<string>("all");
  const [showNewForm, setShowNewForm] = useState(false);
  const [newBiz, setNewBiz] = useState("");
  const [newNiche, setNewNiche] = useState("AI");
  const [newCharId, setNewCharId] = useState("");
  const [newCommission, setNewCommission] = useState("15");
  const [creating, setCreating] = useState(false);

  const fetchData = useCallback(async () => {
    const [campaignsRes, statsRes, charsRes] = await Promise.all([
      fetch("/api/campaigns").then((r) => r.json()).catch(() => ({ campaigns: [] })),
      fetch("/api/campaigns?dashboard=true").then((r) => r.json()).catch(() => ({ stats: null })),
      fetch("/api/characters").then((r) => r.json()).catch(() => ({ characters: [] })),
    ]);
    setCampaigns(campaignsRes.campaigns || []);
    setStats(statsRes.stats || null);
    setCharacters(charsRes.characters || []);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const createCampaign = async () => {
    if (!newBiz.trim()) return;
    setCreating(true);
    await fetch("/api/campaigns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        businessName: newBiz.trim(),
        niche: newNiche,
        characterId: newCharId || undefined,
        commission: parseFloat(newCommission) / 100,
      }),
    });
    setNewBiz("");
    setNewCharId("");
    setShowNewForm(false);
    await fetchData();
    setCreating(false);
  };

  const filtered = campaigns.filter((c) => {
    if (filterStatus !== "all" && c.status !== filterStatus) return false;
    if (filterNiche !== "all" && c.niche !== filterNiche) return false;
    return true;
  });

  const niches = Array.from(new Set(campaigns.map((c) => c.niche)));

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="text-page-title text-oc-text">Campaigns</span>
          <OcBadge label="Ad Agency" color="#6366F1" bg="#EEF2FF" />
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchData} className="p-1.5 rounded-oc hover:bg-oc-bg" title="Refresh">
            <RefreshCw className="w-4 h-4 text-oc-text-muted" />
          </button>
          <button
            onClick={() => setShowNewForm(!showNewForm)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-oc-text text-white rounded-oc text-small font-semibold hover:opacity-90"
          >
            <Plus className="w-3.5 h-3.5" />New Campaign
          </button>
        </div>
      </div>

      {/* Revenue Summary KPIs */}
      <div className="grid grid-cols-5 gap-3">
        {[
          { label: "Total Commission", value: stats ? `$${stats.totalCommission.toFixed(2)}` : "$0.00", color: "text-oc-green", icon: DollarSign },
          { label: "Active Campaigns", value: stats ? `${stats.activeCampaigns}` : "0", color: "text-oc-blue", icon: Megaphone },
          { label: "Content Produced", value: filtered.reduce((s, c) => s + c.contentCount, 0).toString(), color: "text-oc-purple", icon: FileText },
          { label: "Total Clicks", value: stats ? stats.totalClicks.toLocaleString() : "0", color: "text-oc-teal", icon: MousePointerClick },
          { label: "Conversion Rate", value: stats ? `${stats.conversionRate}%` : "0%", color: "text-amber-500", icon: BarChart3 },
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

      {/* New Campaign Form */}
      {showNewForm && (
        <div className="p-4 bg-oc-card border border-oc-border rounded-oc">
          <div className="text-small font-semibold text-oc-text mb-3">Create New Campaign</div>
          <div className="grid grid-cols-4 gap-3">
            <div>
              <label className="text-[9px] font-semibold text-oc-text-muted uppercase block mb-1">Business Name</label>
              <input
                value={newBiz}
                onChange={(e) => setNewBiz(e.target.value)}
                placeholder="Acme Corp"
                className="w-full text-small px-3 py-1.5 border border-oc-border rounded-oc bg-white text-oc-text"
              />
            </div>
            <div>
              <label className="text-[9px] font-semibold text-oc-text-muted uppercase block mb-1">Niche</label>
              <select value={newNiche} onChange={(e) => setNewNiche(e.target.value)} className="w-full text-small px-3 py-1.5 border border-oc-border rounded-oc bg-white text-oc-text">
                <option>AI</option><option>Fitness</option><option>Finance</option><option>Beauty</option><option>Tech</option><option>Food</option>
              </select>
            </div>
            <div>
              <label className="text-[9px] font-semibold text-oc-text-muted uppercase block mb-1">AI Model</label>
              <select value={newCharId} onChange={(e) => setNewCharId(e.target.value)} className="w-full text-small px-3 py-1.5 border border-oc-border rounded-oc bg-white text-oc-text">
                <option value="">Auto-assign</option>
                {characters.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[9px] font-semibold text-oc-text-muted uppercase block mb-1">Commission %</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={newCommission}
                  onChange={(e) => setNewCommission(e.target.value)}
                  className="w-20 text-small px-3 py-1.5 border border-oc-border rounded-oc bg-white text-oc-text font-mono"
                  min="0"
                  max="100"
                />
                <button
                  onClick={createCampaign}
                  disabled={creating || !newBiz.trim()}
                  className="px-3 py-1.5 bg-oc-green text-white rounded-oc text-small font-semibold hover:opacity-90 disabled:opacity-50"
                >
                  {creating ? "Creating..." : "Create"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-3">
        <Filter className="w-3.5 h-3.5 text-oc-text-muted" />
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="text-small px-3 py-1.5 border border-oc-border rounded-oc bg-oc-card text-oc-text">
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="paused">Paused</option>
          <option value="completed">Completed</option>
          <option value="pitched">Pitched</option>
        </select>
        <select value={filterNiche} onChange={(e) => setFilterNiche(e.target.value)} className="text-small px-3 py-1.5 border border-oc-border rounded-oc bg-oc-card text-oc-text">
          <option value="all">All Niches</option>
          {niches.map((n) => <option key={n} value={n}>{n}</option>)}
        </select>
        <span className="text-tiny text-oc-text-muted ml-auto">{filtered.length} campaign{filtered.length !== 1 ? "s" : ""}</span>
      </div>

      {/* Campaign Cards */}
      {filtered.length === 0 ? (
        <div className="p-8 bg-oc-card border border-oc-border rounded-oc text-center">
          <Megaphone className="w-8 h-8 text-oc-text-muted mx-auto mb-3" />
          <div className="text-small text-oc-text-muted">No campaigns yet. Create your first campaign to start advertising for businesses.</div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {filtered.map((camp) => {
            const sc = statusColors[camp.status] || statusColors.draft;
            const commEarned = camp.totalRevenue * camp.commission;
            return (
              <div key={camp.id} className="p-4 bg-oc-card border border-oc-border rounded-oc">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="text-small font-semibold text-oc-text">{camp.businessName}</div>
                    <div className="text-tiny text-oc-text-muted mt-0.5">{camp.niche} niche</div>
                  </div>
                  <OcBadge label={camp.status} color={sc.color} bg={sc.bg} />
                </div>

                <div className="grid grid-cols-4 gap-2 mb-3">
                  <div className="text-center">
                    <div className="text-[16px] font-bold font-mono text-oc-text">{camp.contentCount}</div>
                    <div className="text-[9px] text-oc-text-muted uppercase">Content</div>
                  </div>
                  <div className="text-center">
                    <div className="text-[16px] font-bold font-mono text-oc-text">{camp.totalClicks}</div>
                    <div className="text-[9px] text-oc-text-muted uppercase">Clicks</div>
                  </div>
                  <div className="text-center">
                    <div className="text-[16px] font-bold font-mono text-oc-text">{camp.totalConversions}</div>
                    <div className="text-[9px] text-oc-text-muted uppercase">Conversions</div>
                  </div>
                  <div className="text-center">
                    <div className="text-[16px] font-bold font-mono text-oc-green">${commEarned.toFixed(2)}</div>
                    <div className="text-[9px] text-oc-text-muted uppercase">Commission</div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[9px] text-oc-text-muted pt-2 border-t border-oc-border-light">
                  <span>Revenue: <span className="font-mono font-semibold text-oc-text">${camp.totalRevenue.toFixed(2)}</span></span>
                  <span>Rate: <span className="font-mono font-semibold text-oc-text">{(camp.commission * 100).toFixed(0)}%</span></span>
                  <span>Started: {new Date(camp.startedAt).toLocaleDateString()}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Top Campaigns by Revenue */}
      {stats && stats.topCampaigns.length > 0 && (
        <div>
          <h2 className="text-section-title text-oc-text mb-3">Top Campaigns by Revenue</h2>
          <div className="bg-oc-card border border-oc-border rounded-oc overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-oc-border">
                  <th className="text-left p-3 text-[9px] font-semibold text-oc-text-muted uppercase">Business</th>
                  <th className="text-left p-3 text-[9px] font-semibold text-oc-text-muted uppercase">Niche</th>
                  <th className="text-right p-3 text-[9px] font-semibold text-oc-text-muted uppercase">Revenue</th>
                  <th className="text-right p-3 text-[9px] font-semibold text-oc-text-muted uppercase">Commission</th>
                </tr>
              </thead>
              <tbody>
                {stats.topCampaigns.map((tc) => (
                  <tr key={tc.id} className="border-b border-oc-border-light">
                    <td className="p-3 text-small text-oc-text font-semibold">{tc.businessName}</td>
                    <td className="p-3"><OcBadge label={tc.niche} color="#6B6560" bg="#F8F7F4" /></td>
                    <td className="p-3 text-right text-small font-mono text-oc-text">${tc.revenue.toFixed(2)}</td>
                    <td className="p-3 text-right text-small font-mono text-oc-green font-semibold">${tc.commission.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
