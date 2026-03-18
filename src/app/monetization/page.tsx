"use client";

import { useState, useEffect, useCallback } from "react";
import { OcBadge } from "@/components/shared";
import { TrendingUp, Link2, Plus } from "lucide-react";

interface AffLink { id: string; name: string; niche: string; url: string; shortCode: string | null; platform: string; campaign: string | null; clicks: number; conversions: number; revenue: number; isActive: boolean; }
interface ROIReport { totalClicks: number; totalConversions: number; totalRevenue: number; totalCost: number; roi: number; revenuePerPost: number; conversionRate: number; topLinks: AffLink[]; }

export default function MonetizationPage() {
  const [links, setLinks] = useState<AffLink[]>([]);
  const [roi, setRoi] = useState<ROIReport | null>(null);
  const [tab, setTab] = useState<"overview" | "links" | "cta">("overview");

  const fetchData = useCallback(async () => {
    const [linksRes, roiRes] = await Promise.all([
      fetch("/api/monetization/links").then((r) => r.json()).catch(() => ({ links: [] })),
      fetch("/api/monetization/roi").then((r) => r.json()).catch(() => ({ report: null })),
    ]);
    setLinks(linksRes.links || []);
    setRoi(roiRes.report || null);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-2.5">
        <span className="text-page-title text-oc-text">Monetization</span>
        <OcBadge label="Revenue Tracking" color="#059669" bg="#ECFDF5" />
      </div>

      {/* ROI KPIs */}
      <div className="grid grid-cols-5 gap-3">
        {[
          { label: "Total Revenue", value: roi ? `$${roi.totalRevenue.toFixed(2)}` : "$0.00", color: "text-oc-green" },
          { label: "Total Cost", value: roi ? `$${roi.totalCost.toFixed(2)}` : "$0.00", color: "text-red-500" },
          { label: "ROI", value: roi ? `${roi.roi.toFixed(0)}%` : "0%", color: "text-oc-purple" },
          { label: "Revenue/Post", value: roi ? `$${roi.revenuePerPost.toFixed(2)}` : "$0.00", color: "text-oc-blue" },
          { label: "Conversion Rate", value: roi ? `${roi.conversionRate.toFixed(1)}%` : "0%", color: "text-oc-teal" },
        ].map((kpi) => (
          <div key={kpi.label} className="p-[14px_16px] bg-oc-card border border-oc-border rounded-oc">
            <div className="text-[9px] font-semibold text-oc-text-muted uppercase tracking-[0.05em] mb-1">{kpi.label}</div>
            <div className={`text-[22px] font-bold font-mono ${kpi.color}`}>{kpi.value}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-oc-border">
        {(["overview", "links", "cta"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`pb-2 text-small font-semibold capitalize ${tab === t ? "text-oc-text border-b-2 border-oc-blue" : "text-oc-text-muted"}`}>{t === "cta" ? "CTA Templates" : t === "links" ? "Affiliate Links" : "Overview"}</button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="p-6 bg-oc-card border border-oc-border rounded-oc">
          <div className="flex items-center gap-3 mb-4">
            <TrendingUp className="w-5 h-5 text-oc-green" />
            <span className="text-small font-semibold text-oc-text">Revenue Pipeline</span>
          </div>
          <div className="text-tiny text-oc-text-muted leading-relaxed">
            Content is created → CTA is injected into post captions → Audience clicks affiliate links → Revenue tracked per click/conversion → ROI calculated against AI costs.
          </div>
          <div className="mt-4 grid grid-cols-3 gap-3">
            <div className="p-3 bg-oc-bg rounded-oc text-center">
              <div className="text-[22px] font-bold font-mono text-oc-text">{roi?.totalClicks || 0}</div>
              <div className="text-[9px] text-oc-text-muted uppercase">Total Clicks</div>
            </div>
            <div className="p-3 bg-oc-bg rounded-oc text-center">
              <div className="text-[22px] font-bold font-mono text-oc-text">{roi?.totalConversions || 0}</div>
              <div className="text-[9px] text-oc-text-muted uppercase">Conversions</div>
            </div>
            <div className="p-3 bg-oc-bg rounded-oc text-center">
              <div className="text-[22px] font-bold font-mono text-oc-green">${roi?.totalRevenue.toFixed(2) || "0.00"}</div>
              <div className="text-[9px] text-oc-text-muted uppercase">Revenue</div>
            </div>
          </div>
        </div>
      )}

      {tab === "links" && (
        <div>
          <div className="flex justify-end mb-3">
            <button onClick={async () => {
              const name = prompt("Link name (e.g. 'AI Tool Affiliate'):");
              if (!name) return;
              const url = prompt("Affiliate URL:");
              if (!url) return;
              const platform = prompt("Platform (TikTok, Instagram, YouTube, etc.):");
              if (!platform) return;
              await fetch("/api/monetization/links", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, url, niche: "AI", platform, isActive: true }),
              });
              fetchData();
            }} className="flex items-center gap-1.5 px-3 py-1.5 bg-oc-text text-white rounded-oc text-small font-semibold"><Plus className="w-3.5 h-3.5" />Add Link</button>
          </div>
          {links.length === 0 ? (
            <div className="p-8 bg-oc-card border border-oc-border rounded-oc text-center">
              <Link2 className="w-8 h-8 text-oc-text-muted mx-auto mb-3" />
              <div className="text-small text-oc-text-muted">No affiliate links yet. Add your first link to start tracking revenue.</div>
            </div>
          ) : (
            <div className="bg-oc-card border border-oc-border rounded-oc overflow-hidden">
              <table className="w-full">
                <thead><tr className="border-b border-oc-border">
                  <th className="text-left p-3 text-[9px] font-semibold text-oc-text-muted uppercase">Name</th>
                  <th className="text-left p-3 text-[9px] font-semibold text-oc-text-muted uppercase">Platform</th>
                  <th className="text-right p-3 text-[9px] font-semibold text-oc-text-muted uppercase">Clicks</th>
                  <th className="text-right p-3 text-[9px] font-semibold text-oc-text-muted uppercase">Conversions</th>
                  <th className="text-right p-3 text-[9px] font-semibold text-oc-text-muted uppercase">Revenue</th>
                  <th className="text-center p-3 text-[9px] font-semibold text-oc-text-muted uppercase">Status</th>
                </tr></thead>
                <tbody>
                  {links.map((link) => (
                    <tr key={link.id} className="border-b border-oc-border-light">
                      <td className="p-3 text-small text-oc-text font-semibold">{link.name}</td>
                      <td className="p-3"><OcBadge label={link.platform} color="#6B6560" bg="#F8F7F4" /></td>
                      <td className="p-3 text-right text-small font-mono text-oc-text">{link.clicks}</td>
                      <td className="p-3 text-right text-small font-mono text-oc-text">{link.conversions}</td>
                      <td className="p-3 text-right text-small font-mono text-oc-green font-semibold">${link.revenue.toFixed(2)}</td>
                      <td className="p-3 text-center"><OcBadge label={link.isActive ? "Active" : "Inactive"} color={link.isActive ? "#059669" : "#9CA3AF"} bg={link.isActive ? "#ECFDF5" : "#F3F4F6"} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === "cta" && (
        <div>
          <div className="p-8 bg-oc-card border border-oc-border rounded-oc text-center">
            <div className="text-small text-oc-text-muted mb-2">CTA Templates</div>
            <div className="text-tiny text-oc-text-muted">Create call-to-action templates that get injected into post captions automatically. Templates support {"{{link}}"} and {"{{url}}"} placeholders.</div>
            <button onClick={() => fetch("/api/monetization/cta", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ niche: "AI", name: "Link in Bio", type: "link_in_bio", template: "Link in bio for the free guide 👆 {{link}}", platform: "TikTok" }) }).then(() => fetchData())} className="mt-3 px-3 py-1.5 bg-oc-text text-white rounded-oc text-small font-semibold">Create Sample CTA</button>
          </div>
        </div>
      )}
    </div>
  );
}
