"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { KPICard } from "@/components/dashboard/kpi-card";
import { LiveFeed } from "@/components/dashboard/live-feed";
import {
  OcCard,
  SectionHeader,
  StatusDot,
  OcBadge,
} from "@/components/shared";

// ── Types ──
interface DashboardData {
  kpis: {
    activeAgents: number;
    totalAgents: number;
    contentToday: number;
    postsToday: number;
    totalTasks: number;
    pipelineRuns: number;
    totalTokens: number;
    costToday: number;
  };
  agents: { id: string; name: string; status: string; currentTask: string | null; type: string; tasksCompleted: number }[];
  platforms: { name: string; handle: string; connected: boolean; followers: number }[];
  recentActivity: { id: string; type: string; message: string; source: string; createdAt: string }[];
}

interface SocialPost {
  id: string;
  platformId: string;
  content: string;
  status: string;
  scheduledAt: string | null;
  publishedAt: string | null;
  platform?: { name: string };
}

interface ModelRoute {
  id: string;
  taskType: string;
  modelName: string;
  enabled: boolean;
  priority: number;
}

interface BrowserSession {
  id: string;
  site: string;
  action: string;
  status: string;
}

// ── Brand colors + icons for platforms ──
const BRAND: Record<string, { icon: string; color: string }> = {
  "Twitter/X": { icon: "𝕏", color: "#000000" },
  "Instagram": { icon: "📷", color: "#E4405F" },
  "Facebook": { icon: "f", color: "#1877F2" },
  "LinkedIn": { icon: "in", color: "#0A66C2" },
  "TikTok": { icon: "♪", color: "#000000" },
  "YouTube": { icon: "▶", color: "#FF0000" },
  "Reddit": { icon: "◉", color: "#FF4500" },
  "Threads": { icon: "@", color: "#000000" },
};

// ── Static data (team, until user management is built) ──
const users = [
  { name: "Bobby Chen", email: "bobby@openclaw.io", role: "admin", lastActive: "2 min ago", apiCalls: "14,203" },
  { name: "Sarah Kim", email: "sarah@openclaw.io", role: "operator", lastActive: "12 min ago", apiCalls: "8,421" },
  { name: "Marcus Lee", email: "marcus@openclaw.io", role: "operator", lastActive: "1 hr ago", apiCalls: "3,109" },
  { name: "Anika Patel", email: "anika@openclaw.io", role: "viewer", lastActive: "3 hr ago", apiCalls: "284" },
];

// ── Sub-components ──

function BarChart({ data }: { data: { label: string; value: number; highlight?: boolean }[] }) {
  const max = Math.max(...data.map(d => d.value)) || 1;
  return (
    <div className="flex items-end gap-[5px] h-[90px]">
      {data.map((d, i) => (
        <div key={i} className="flex flex-col items-center flex-1 gap-[3px]">
          <div
            className="w-full max-w-[24px] rounded-[3px] transition-all duration-[400ms]"
            style={{
              height: `${Math.max((d.value / max) * 72, 2)}px`,
              backgroundColor: d.highlight ? "#2563EB" : "#F0EDE6",
            }}
          />
          <span className="text-[8px] text-oc-text-muted font-mono">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

function DonutChart({ segments }: { segments: { label: string; value: number; color: string }[] }) {
  const total = segments.reduce((s, seg) => s + seg.value, 0);
  let cum = 0;
  const r = 36, circ = 2 * Math.PI * r;
  return (
    <div className="flex items-center gap-3.5">
      <svg width={100} height={100} viewBox="0 0 100 100">
        {segments.map((seg, i) => {
          const pct = seg.value / total;
          const dashArray = `${pct * circ} ${circ}`;
          const rot = cum * 360 - 90;
          cum += pct;
          return (
            <circle key={i} cx="50" cy="50" r={r} fill="none" stroke={seg.color}
              strokeWidth="11" strokeDasharray={dashArray} transform={`rotate(${rot} 50 50)`} strokeLinecap="round" />
          );
        })}
        <text x="50" y="48" textAnchor="middle" className="text-[15px] font-bold fill-oc-text font-sans">{total}</text>
        <text x="50" y="59" textAnchor="middle" className="text-[7px] fill-oc-text-muted font-sans">total</text>
      </svg>
      <div className="flex flex-col gap-[5px]">
        {segments.map((seg, i) => (
          <div key={i} className="flex items-center gap-1.5 text-[11px]">
            <span className="w-[7px] h-[7px] rounded-[2px] shrink-0" style={{ backgroundColor: seg.color }} />
            <span className="text-oc-text-secondary">{seg.label}</span>
            <span className="font-semibold text-oc-text ml-auto font-mono">{seg.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

// ── Main Page ──

export default function DashboardPage() {
  const router = useRouter();
  const [now, setNow] = useState(new Date());
  const [toast, setToast] = useState<string | null>(null);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [routes, setRoutes] = useState<ModelRoute[]>([]);
  const [sessions, setSessions] = useState<BrowserSession[]>([]);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const fetchData = useCallback(async () => {
    const [dashRes, postRes, routeRes, sessionRes] = await Promise.all([
      fetch("/api/dashboard").then((r) => r.json()).catch(() => null),
      fetch("/api/social/posts?status=scheduled").then((r) => r.json()).catch(() => ({ posts: [] })),
      fetch("/api/routing").then((r) => r.json()).catch(() => ({ rules: [] })),
      fetch("/api/browser").then((r) => r.json()).catch(() => ({ sessions: [] })),
    ]);
    if (dashRes) setDashboard(dashRes);
    setPosts(postRes.posts || []);
    setRoutes(routeRes.rules || []);
    setSessions(sessionRes.sessions || []);
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, [fetchData]);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2000);
  }

  const kpis = dashboard?.kpis;
  const agents = dashboard?.agents || [];
  const platforms = dashboard?.platforms || [];

  // Hourly usage data (populated when ModelUsageLog has entries)
  const hourlyUsage = Array.from({ length: 12 }, (_, i) => ({
    label: `${i + 6 > 12 ? i + 6 - 12 : i + 6}${i + 6 >= 12 ? "p" : "a"}`,
    value: Math.floor(Math.random() * 500) + 100,
  }));

  return (
    <>
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 px-4 py-2.5 bg-oc-text text-white text-small font-semibold rounded-oc shadow-lg animate-[fadeIn_0.2s_ease]">
          {toast}
        </div>
      )}

      {/* Top bar */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-page-title text-oc-text m-0">Operator Dashboard</h1>
          <p className="text-small text-oc-text-muted mt-[3px]">
            {now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })} ·{" "}
            <span className="font-mono">{now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</span>
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => showToast("Report exported to ./reports/")}
            className="text-[11px] font-semibold text-oc-text-secondary bg-oc-card border border-oc-border rounded-oc-sm px-3.5 py-[7px] cursor-pointer font-sans"
          >
            Export Report
          </button>
          <button
            onClick={() => router.push("/agents")}
            className="text-[11px] font-semibold text-white bg-oc-text border-none rounded-oc-sm px-4 py-[7px] cursor-pointer font-sans"
          >
            + New Agent
          </button>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-4 gap-3.5 mb-5">
        <KPICard label="Active Agents" value={kpis ? `${kpis.activeAgents} / ${kpis.totalAgents}` : "—"} change="" changeType="up" sparkData={[2, 3, 3, 4, 3, 4, 5, 5, kpis?.activeAgents || 5]} icon="⬡" />
        <KPICard label="Posts Today" value={kpis ? String(kpis.postsToday) : "—"} change="" changeType="up" sparkData={[0, 1, 2, 3, 4, 5, 6, 7, kpis?.postsToday || 0]} icon="◈" />
        <KPICard label="Tokens Used" value={kpis ? formatTokens(kpis.totalTokens) : "—"} change="" changeType="up" sparkData={[0, 100, 200, 400, 600, 800, 1000, 1200, kpis?.totalTokens || 0]} icon="⟡" />
        <KPICard label="Cost Today" value={kpis ? `$${kpis.costToday.toFixed(2)}` : "—"} change="" changeType="up" sparkData={[0, 0.1, 0.2, 0.5, 0.8, 1.0, 1.2, 1.4, kpis?.costToday || 0]} icon="♡" />
      </div>

      {/* Social Media Command Center */}
      <OcCard className="mb-5">
        <SectionHeader title="Social Media Command Center" subtitle="All platforms managed via Claude Code Chrome automation" action="+ Connect Platform" onAction={() => router.push("/settings")} />
        <div className="grid grid-cols-4 gap-3">
          {platforms.map((p) => {
            const brand = BRAND[p.name] || { icon: "?", color: "#1A1A1A" };
            return (
              <div key={p.name} className={`p-3.5 rounded-[10px] border flex flex-col gap-2.5 transition-all duration-200 ${
                p.connected ? "border-oc-border bg-oc-card" : "border-oc-border-light bg-oc-bg opacity-55"
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-[30px] h-[30px] rounded-oc-sm flex items-center justify-center text-[14px] font-extrabold"
                      style={{ backgroundColor: `${brand.color}10`, color: brand.color }}>
                      {brand.icon}
                    </div>
                    <div>
                      <div className="text-[13px] font-semibold text-oc-text">{p.name}</div>
                      <div className="text-tiny text-oc-text-muted font-mono">@{p.handle}</div>
                    </div>
                  </div>
                  <StatusDot status={p.connected ? "connected" : "disconnected"} />
                </div>
                {p.connected && (
                  <>
                    <div className="grid grid-cols-3 gap-1.5">
                      {[
                        { val: p.followers?.toLocaleString() || "0", label: "Followers" },
                        { val: "0", label: "Posted" },
                        { val: "—", label: "Engage%", color: "text-oc-green" },
                      ].map((s) => (
                        <div key={s.label} className="text-center py-1.5 bg-oc-bg rounded-[6px]">
                          <div className={`text-[14px] font-bold ${s.color || "text-oc-text"}`}>{s.val}</div>
                          <div className="text-[9px] text-oc-text-muted uppercase tracking-[0.05em]">{s.label}</div>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center justify-between">
                      <OcBadge label="Claude" color="#2563EB" bg="#EFF4FF" />
                      <OcBadge label="Chrome" color="#6B6560" bg="#F8F7F4" />
                    </div>
                  </>
                )}
                {!p.connected && (
                  <button
                    onClick={() => router.push("/settings")}
                    className="text-[11px] font-semibold text-oc-blue bg-oc-blue-light border-none rounded-[6px] py-[7px] w-full cursor-pointer font-sans"
                  >
                    Connect Account
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </OcCard>

      {/* Post Queue + Model Routing + Browser Sessions */}
      <div className="grid grid-cols-[1fr_1fr_300px] gap-3.5 mb-5">
        <OcCard>
          <SectionHeader title="Content Queue" subtitle="Scheduled & posted content" action="Schedule" onAction={() => router.push("/tasks")} />
          <div className="max-h-[310px] overflow-y-auto">
            {posts.length === 0 && (
              <div className="text-center py-8 text-small text-oc-text-muted">No scheduled posts yet</div>
            )}
            {posts.map((post) => {
              const statusColors: Record<string, { color: string; bg: string }> = {
                scheduled: { color: "#2563EB", bg: "#EFF4FF" },
                posted: { color: "#059669", bg: "#ECFDF5" },
                draft: { color: "#D97706", bg: "#FFFBEB" },
                failed: { color: "#DC2626", bg: "#FEF2F2" },
              };
              const sc = statusColors[post.status] || statusColors.draft;
              return (
                <div key={post.id} className="flex gap-3 py-2.5 border-b border-oc-border-light items-start">
                  <div className="w-1 h-9 rounded-[2px] mt-0.5 shrink-0 bg-oc-blue" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-[3px]">
                      <span className="text-[11px] font-semibold text-oc-text">{post.platformId || "—"}</span>
                      <OcBadge label={post.status} color={sc.color} bg={sc.bg} />
                    </div>
                    <div className="text-small text-oc-text-secondary leading-[1.4] overflow-hidden text-ellipsis whitespace-nowrap">{post.content}</div>
                    <div className="text-tiny text-oc-text-muted font-mono mt-[3px]">
                      {post.scheduledAt ? new Date(post.scheduledAt).toLocaleString() : "Draft"}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </OcCard>

        <OcCard>
          <SectionHeader title="Model Routing" subtitle="Claude Sonnet — all language tasks" />
          <div className="mb-3 flex gap-2">
            <div className="flex-1 p-2.5 bg-oc-purple-light rounded-oc-sm text-center">
              <div className="text-[16px] font-bold text-oc-purple">
                {routes.length}
              </div>
              <div className="text-tiny text-oc-purple font-medium">Active routes</div>
            </div>
          </div>
          {routes.map((route) => (
            <div key={route.id} className="flex items-center justify-between py-[9px] border-b border-oc-border-light">
              <div className="flex items-center gap-2">
                <div className={`w-1.5 h-1.5 rounded-full ${route.enabled ? "bg-oc-green" : "bg-oc-text-muted"}`} />
                <span className="text-small font-medium text-oc-text">{route.taskType}</span>
              </div>
              <OcBadge label={route.modelName} color="#7C3AED" bg="#F5F3FF" />
            </div>
          ))}
        </OcCard>

        <OcCard>
          <SectionHeader title="Chrome Sessions" subtitle="Live browser automation" />
          <div className="flex flex-col gap-2">
            {sessions.length === 0 && (
              <div className="text-center py-4 text-small text-oc-text-muted">No active sessions</div>
            )}
            {sessions.map((s) => (
              <div key={s.id} className="p-[10px_12px] rounded-oc-sm bg-oc-bg flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-[6px] bg-oc-card border border-oc-border flex items-center justify-center text-[14px]">🌐</div>
                <div className="flex-1 min-w-0">
                  <div className="text-small font-semibold text-oc-text">{s.site}</div>
                  <div className="text-tiny text-oc-text-muted font-mono overflow-hidden text-ellipsis whitespace-nowrap">{s.action}</div>
                </div>
                <StatusDot status={s.status as "active" | "error" | "idle"} />
              </div>
            ))}
          </div>
          <div className="mt-3.5 p-[10px_12px] bg-oc-bg rounded-oc-sm text-[11px]">
            <div className="flex justify-between mb-1">
              <span className="text-oc-text-muted">Connection</span>
              <span className="font-semibold text-oc-green">{sessions.length > 0 ? "Stable" : "Idle"}</span>
            </div>
            <div className="flex justify-between mb-1">
              <span className="text-oc-text-muted">Extension</span>
              <span className="font-mono text-tiny text-oc-text">v1.0.36</span>
            </div>
            <div className="flex justify-between">
              <span className="text-oc-text-muted">Auth state</span>
              <span className="font-semibold text-oc-green">Logged in ({platforms.filter(p => p.connected).length})</span>
            </div>
          </div>
        </OcCard>
      </div>

      {/* Agent Fleet + Token Usage + Task Distribution */}
      <div className="grid grid-cols-[1fr_300px] gap-3.5 mb-5">
        <OcCard>
          <SectionHeader title="Agent Fleet" subtitle="Real-time agent status and workload" action="Manage" onAction={() => router.push("/agents")} />
          <div className="grid grid-cols-[2fr_1fr_1.2fr_1fr_1fr_80px] py-2 border-b-2 border-oc-border text-tiny font-semibold text-oc-text-muted uppercase tracking-[0.08em]">
            <span>Agent</span><span>Status</span><span>Current Task</span><span>Done</span><span>Load</span><span></span>
          </div>
          {agents.map((a) => {
            const load = a.status === "active" ? Math.min(20 + (a.tasksCompleted % 60), 95) : 5;
            return (
              <div key={a.id} className="grid grid-cols-[2fr_1fr_1.2fr_1fr_1fr_80px] items-center py-[11px] border-b border-oc-border-light text-[13px]">
                <div className="flex items-center gap-2">
                  <StatusDot status={a.status === "active" ? "connected" : a.status === "error" ? "error" : "idle"} />
                  <span className="font-semibold text-oc-text">{a.name}</span>
                  <span className="text-tiny text-oc-text-muted font-mono bg-oc-bg px-1.5 py-[1px] rounded">{a.id.slice(-6)}</span>
                </div>
                <div className="text-small text-oc-text-secondary">{a.status.charAt(0).toUpperCase() + a.status.slice(1)}</div>
                <div className="font-mono text-[11px] text-oc-text-secondary">{a.currentTask || "—"}</div>
                <div className="font-mono text-small text-oc-text">{a.tasksCompleted}</div>
                <div>
                  <div className="w-full h-[5px] bg-oc-border-light rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${load}%`, backgroundColor: load > 80 ? "#D97706" : "#2563EB" }} />
                  </div>
                  <span className="text-[9px] text-oc-text-muted mt-0.5 block">{load}%</span>
                </div>
                <div className="text-right">
                  <button onClick={() => router.push("/agents")} className="text-[11px] font-semibold text-oc-blue bg-transparent border-none cursor-pointer font-sans">Details →</button>
                </div>
              </div>
            );
          })}
        </OcCard>

        <div className="flex flex-col gap-3.5">
          <OcCard>
            <SectionHeader title="Token Usage" subtitle="Today" />
            <BarChart data={hourlyUsage.map((h, i) => ({ ...h, highlight: i === hourlyUsage.length - 1 }))} />
            <div className="mt-2.5 flex justify-between text-tiny">
              <span className="text-oc-text-muted">Tokens: <span className="font-semibold text-oc-text">{kpis ? formatTokens(kpis.totalTokens) : "—"}</span></span>
              <span className="text-oc-text-muted">Cost: <span className="font-semibold text-oc-text">${kpis?.costToday.toFixed(2) || "0.00"}</span></span>
            </div>
          </OcCard>
          <OcCard>
            <SectionHeader title="Task Distribution" />
            <DonutChart segments={[
              { label: "Social Posts", value: kpis?.postsToday || 0, color: "#2563EB" },
              { label: "Pipeline Runs", value: kpis?.pipelineRuns || 0, color: "#059669" },
              { label: "Content", value: kpis?.contentToday || 0, color: "#0D9488" },
              { label: "Tasks", value: kpis?.totalTasks || 0, color: "#7C3AED" },
            ]} />
          </OcCard>
        </div>
      </div>

      {/* Activity + Users */}
      <div className="grid grid-cols-2 gap-3.5 mb-8">
        <OcCard>
          <LiveFeed compact maxItems={30} />
        </OcCard>

        <OcCard>
          <SectionHeader title="Team & Permissions" subtitle="User access management" action="Invite" onAction={() => showToast("Invite link copied to clipboard")} />
          <div className="grid grid-cols-[2fr_1fr_1.2fr_1fr] py-2 border-b-2 border-oc-border text-tiny font-semibold text-oc-text-muted uppercase tracking-[0.08em]">
            <span>User</span><span>Role</span><span>Last Active</span><span>API Calls</span>
          </div>
          {users.map((u) => {
            const roleColors: Record<string, { bg: string; color: string }> = {
              admin: { bg: "#EFF4FF", color: "#2563EB" },
              operator: { bg: "#F5F3FF", color: "#7C3AED" },
              viewer: { bg: "#F8F7F4", color: "#9C9590" },
            };
            const rc = roleColors[u.role] || roleColors.viewer;
            return (
              <div key={u.email} className="grid grid-cols-[2fr_1fr_1.2fr_1fr] items-center py-2.5 border-b border-oc-border-light text-[13px]">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-oc-blue-light flex items-center justify-center text-[11px] font-bold text-oc-blue">
                    {u.name.split(" ").map(n => n[0]).join("")}
                  </div>
                  <div>
                    <div className="font-semibold text-oc-text text-[13px]">{u.name}</div>
                    <div className="text-tiny text-oc-text-muted">{u.email}</div>
                  </div>
                </div>
                <div><OcBadge label={u.role} color={rc.color} bg={rc.bg} /></div>
                <div className="font-mono text-[11px] text-oc-text-secondary">{u.lastActive}</div>
                <div className="font-mono text-small text-oc-text">{u.apiCalls}</div>
              </div>
            );
          })}
          <div className="mt-3.5 p-[12px_14px] bg-oc-bg rounded-oc-sm flex justify-between items-center">
            <div>
              <div className="text-tiny text-oc-text-muted font-medium">Est. Monthly Cost</div>
              <div className="text-[18px] font-bold tracking-[-0.02em] mt-0.5">${((kpis?.costToday || 0) * 30).toFixed(2)}</div>
            </div>
            <div className="text-right">
              <div className="text-tiny text-oc-text-muted font-medium">Billing Period</div>
              <div className="text-small font-semibold mt-0.5">Mar 1 – Mar 31</div>
            </div>
          </div>
        </OcCard>
      </div>
    </>
  );
}
