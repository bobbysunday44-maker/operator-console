import { useState, useEffect } from "react";

const COLORS = {
  bg: "#F8F7F4",
  card: "#FFFFFF",
  border: "#E8E5DE",
  borderLight: "#F0EDE6",
  text: "#1A1A1A",
  textSecondary: "#6B6560",
  textMuted: "#9C9590",
  accent: "#2563EB",
  accentLight: "#EFF4FF",
  success: "#059669",
  successLight: "#ECFDF5",
  warning: "#D97706",
  warningLight: "#FFFBEB",
  danger: "#DC2626",
  dangerLight: "#FEF2F2",
  purple: "#7C3AED",
  purpleLight: "#F5F3FF",
  pink: "#DB2777",
  pinkLight: "#FDF2F8",
  teal: "#0D9488",
  tealLight: "#F0FDFA",
  orange: "#EA580C",
  orangeLight: "#FFF7ED",
};

const font = "'DM Sans', 'Satoshi', -apple-system, BlinkMacSystemFont, sans-serif";
const fontMono = "'JetBrains Mono', 'SF Mono', 'Fira Code', monospace";

// ─── REUSABLE COMPONENTS ───

function Sparkline({ data, color = COLORS.accent, width = 80, height = 28 }) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const points = data
    .map((v, i) => `${(i / (data.length - 1)) * width},${height - ((v - min) / range) * (height - 4) - 2}`)
    .join(" ");
  return (
    <svg width={width} height={height} style={{ display: "block" }}>
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function StatusDot({ status }) {
  const c = { active: COLORS.success, idle: COLORS.warning, error: COLORS.danger, offline: COLORS.textMuted, connected: COLORS.success, disconnected: COLORS.textMuted, posting: COLORS.accent, monitoring: COLORS.teal };
  return (
    <span style={{ display: "inline-block", width: 7, height: 7, borderRadius: "50%", backgroundColor: c[status] || COLORS.textMuted, marginRight: 6, boxShadow: ["active", "connected", "posting"].includes(status) ? `0 0 0 3px ${COLORS.successLight}` : "none" }} />
  );
}

function ProgressBar({ value, max = 100, color = COLORS.accent, height = 5 }) {
  return (
    <div style={{ width: "100%", height, backgroundColor: COLORS.borderLight, borderRadius: height, overflow: "hidden" }}>
      <div style={{ width: `${Math.min((value / max) * 100, 100)}%`, height: "100%", backgroundColor: color, borderRadius: height, transition: "width 0.6s ease" }} />
    </div>
  );
}

function SectionHeader({ title, subtitle, action, onAction }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
      <div>
        <h2 style={{ fontSize: 15, fontWeight: 700, color: COLORS.text, fontFamily: font, margin: 0, letterSpacing: "-0.01em" }}>{title}</h2>
        {subtitle && <p style={{ fontSize: 12, color: COLORS.textMuted, fontFamily: font, margin: "2px 0 0" }}>{subtitle}</p>}
      </div>
      {action && (
        <button onClick={onAction} style={{ fontSize: 12, fontWeight: 600, color: COLORS.accent, background: "none", border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: "6px 14px", cursor: "pointer", fontFamily: font }}>{action}</button>
      )}
    </div>
  );
}

function Badge({ label, bg, color }) {
  return <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20, backgroundColor: bg, color, letterSpacing: "0.02em", textTransform: "uppercase" }}>{label}</span>;
}

function Card({ children, style: s }) {
  return <div style={{ backgroundColor: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: "20px 22px", ...s }}>{children}</div>;
}

// ─── KPI CARD ───

function KPICard({ label, value, change, changeType, sparkData, icon }) {
  const up = changeType === "up";
  return (
    <Card>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 11, fontWeight: 500, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", fontFamily: font }}>{label}</span>
        <span style={{ fontSize: 15, opacity: 0.35 }}>{icon}</span>
      </div>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginTop: 10 }}>
        <div>
          <div style={{ fontSize: 26, fontWeight: 700, color: COLORS.text, fontFamily: font, letterSpacing: "-0.02em", lineHeight: 1 }}>{value}</div>
          <div style={{ marginTop: 5, fontSize: 11, fontWeight: 500, color: up ? COLORS.success : COLORS.danger, fontFamily: font }}>
            {up ? "↑" : "↓"} {change} <span style={{ color: COLORS.textMuted, marginLeft: 3 }}>vs 24h</span>
          </div>
        </div>
        {sparkData && <Sparkline data={sparkData} color={up ? COLORS.success : COLORS.danger} />}
      </div>
    </Card>
  );
}

// ─── AGENT ROW ───

function AgentRow({ agent }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1.2fr 1fr 1fr 80px", alignItems: "center", padding: "11px 0", borderBottom: `1px solid ${COLORS.borderLight}`, fontSize: 13, fontFamily: font }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <StatusDot status={agent.status} />
        <span style={{ fontWeight: 600, color: COLORS.text }}>{agent.name}</span>
        <span style={{ fontSize: 10, color: COLORS.textMuted, fontFamily: fontMono, backgroundColor: COLORS.bg, padding: "1px 6px", borderRadius: 4 }}>{agent.id}</span>
      </div>
      <div style={{ color: COLORS.textSecondary, fontSize: 12 }}>{agent.status.charAt(0).toUpperCase() + agent.status.slice(1)}</div>
      <div style={{ fontFamily: fontMono, fontSize: 11, color: COLORS.textSecondary }}>{agent.currentTask || "—"}</div>
      <div style={{ fontFamily: fontMono, fontSize: 12, color: COLORS.text }}>{agent.tasksCompleted}</div>
      <div>
        <ProgressBar value={agent.cpu} color={agent.cpu > 80 ? COLORS.warning : COLORS.accent} />
        <span style={{ fontSize: 9, color: COLORS.textMuted, marginTop: 2, display: "block" }}>{agent.cpu}%</span>
      </div>
      <div style={{ textAlign: "right" }}>
        <button style={{ fontSize: 11, fontWeight: 600, color: COLORS.accent, background: "none", border: "none", cursor: "pointer", fontFamily: font }}>Details →</button>
      </div>
    </div>
  );
}

// ─── ACTIVITY ITEM ───

function ActivityItem({ time, message, type }) {
  const c = { info: COLORS.accent, success: COLORS.success, warning: COLORS.warning, error: COLORS.danger };
  return (
    <div style={{ display: "flex", gap: 10, padding: "7px 0", borderBottom: `1px solid ${COLORS.borderLight}` }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: c[type] || COLORS.accent, marginTop: 6, flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12.5, color: COLORS.text, fontFamily: font, lineHeight: 1.4 }}>{message}</div>
        <div style={{ fontSize: 10, color: COLORS.textMuted, fontFamily: fontMono, marginTop: 1 }}>{time}</div>
      </div>
    </div>
  );
}

// ─── USER ROW ───

function UserRow({ user }) {
  const rb = { admin: { bg: COLORS.accentLight, color: COLORS.accent }, operator: { bg: COLORS.purpleLight, color: COLORS.purple }, viewer: { bg: COLORS.bg, color: COLORS.textMuted } };
  const b = rb[user.role] || rb.viewer;
  return (
    <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1.2fr 1fr", alignItems: "center", padding: "10px 0", borderBottom: `1px solid ${COLORS.borderLight}`, fontSize: 13, fontFamily: font }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 28, height: 28, borderRadius: "50%", backgroundColor: COLORS.accentLight, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: COLORS.accent }}>{user.name.split(" ").map(n => n[0]).join("")}</div>
        <div>
          <div style={{ fontWeight: 600, color: COLORS.text, fontSize: 13 }}>{user.name}</div>
          <div style={{ fontSize: 10, color: COLORS.textMuted }}>{user.email}</div>
        </div>
      </div>
      <div><Badge label={user.role} bg={b.bg} color={b.color} /></div>
      <div style={{ fontFamily: fontMono, fontSize: 11, color: COLORS.textSecondary }}>{user.lastActive}</div>
      <div style={{ fontFamily: fontMono, fontSize: 12, color: COLORS.text }}>{user.apiCalls}</div>
    </div>
  );
}

// ─── BAR CHART ───

function BarChart({ data, maxVal }) {
  const max = maxVal || Math.max(...data.map(d => d.value));
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 5, height: 90 }}>
      {data.map((d, i) => (
        <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1, gap: 3 }}>
          <div style={{ width: "100%", maxWidth: 24, height: `${Math.max((d.value / max) * 72, 2)}px`, backgroundColor: d.highlight ? COLORS.accent : COLORS.borderLight, borderRadius: 3, transition: "height 0.4s ease" }} />
          <span style={{ fontSize: 8, color: COLORS.textMuted, fontFamily: fontMono }}>{d.label}</span>
        </div>
      ))}
    </div>
  );
}

// ─── DONUT CHART ───

function DonutChart({ segments, size = 100 }) {
  const total = segments.reduce((s, seg) => s + seg.value, 0);
  let cum = 0;
  const r = 36, circ = 2 * Math.PI * r;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
      <svg width={size} height={size} viewBox="0 0 100 100">
        {segments.map((seg, i) => { const pct = seg.value / total; const da = `${pct * circ} ${circ}`; const rot = cum * 360 - 90; cum += pct; return <circle key={i} cx="50" cy="50" r={r} fill="none" stroke={seg.color} strokeWidth="11" strokeDasharray={da} transform={`rotate(${rot} 50 50)`} strokeLinecap="round" />; })}
        <text x="50" y="48" textAnchor="middle" style={{ fontSize: 15, fontWeight: 700, fill: COLORS.text, fontFamily: font }}>{total}</text>
        <text x="50" y="59" textAnchor="middle" style={{ fontSize: 7, fill: COLORS.textMuted, fontFamily: font }}>total</text>
      </svg>
      <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
        {segments.map((seg, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontFamily: font }}>
            <span style={{ width: 7, height: 7, borderRadius: 2, backgroundColor: seg.color, flexShrink: 0 }} />
            <span style={{ color: COLORS.textSecondary }}>{seg.label}</span>
            <span style={{ fontWeight: 600, color: COLORS.text, marginLeft: "auto", fontFamily: fontMono }}>{seg.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── SOCIAL MEDIA PLATFORM CARD ───

function PlatformCard({ platform }) {
  const icons = {
    "Twitter/X": "𝕏",
    "Instagram": "📷",
    "Facebook": "f",
    "LinkedIn": "in",
    "TikTok": "♪",
    "YouTube": "▶",
    "Reddit": "◉",
    "Threads": "@",
  };
  const brandColors = {
    "Twitter/X": "#000000",
    "Instagram": "#E4405F",
    "Facebook": "#1877F2",
    "LinkedIn": "#0A66C2",
    "TikTok": "#000000",
    "YouTube": "#FF0000",
    "Reddit": "#FF4500",
    "Threads": "#000000",
  };
  const bc = brandColors[platform.name] || COLORS.text;
  return (
    <div style={{ padding: "14px", borderRadius: 10, border: `1px solid ${platform.connected ? COLORS.border : COLORS.borderLight}`, backgroundColor: platform.connected ? COLORS.card : COLORS.bg, display: "flex", flexDirection: "column", gap: 10, opacity: platform.connected ? 1 : 0.55, transition: "all 0.2s ease" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, backgroundColor: `${bc}10`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800, color: bc, fontFamily: font }}>
            {icons[platform.name] || "?"}
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.text, fontFamily: font }}>{platform.name}</div>
            <div style={{ fontSize: 10, color: COLORS.textMuted, fontFamily: fontMono }}>@{platform.handle}</div>
          </div>
        </div>
        <StatusDot status={platform.connected ? "connected" : "disconnected"} />
      </div>
      {platform.connected && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
          <div style={{ textAlign: "center", padding: "6px 0", backgroundColor: COLORS.bg, borderRadius: 6 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.text, fontFamily: font }}>{platform.followers}</div>
            <div style={{ fontSize: 9, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: "0.05em" }}>Followers</div>
          </div>
          <div style={{ textAlign: "center", padding: "6px 0", backgroundColor: COLORS.bg, borderRadius: 6 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.text, fontFamily: font }}>{platform.postsToday}</div>
            <div style={{ fontSize: 9, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: "0.05em" }}>Posted</div>
          </div>
          <div style={{ textAlign: "center", padding: "6px 0", backgroundColor: COLORS.bg, borderRadius: 6 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.success, fontFamily: font }}>{platform.engagement}</div>
            <div style={{ fontSize: 9, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: "0.05em" }}>Engage%</div>
          </div>
        </div>
      )}
      {platform.connected && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Badge label={platform.model} bg={platform.model === "Claude" ? COLORS.accentLight : COLORS.tealLight} color={platform.model === "Claude" ? COLORS.accent : COLORS.teal} />
          <Badge label={platform.method} bg={COLORS.bg} color={COLORS.textSecondary} />
        </div>
      )}
      {!platform.connected && (
        <button style={{ fontSize: 11, fontWeight: 600, color: COLORS.accent, background: COLORS.accentLight, border: "none", borderRadius: 6, padding: "7px 0", cursor: "pointer", fontFamily: font, width: "100%" }}>Connect Account</button>
      )}
    </div>
  );
}

// ─── SCHEDULED POST ROW ───

function PostQueueItem({ post }) {
  const platformColors = { "Twitter/X": "#000", "Instagram": "#E4405F", "LinkedIn": "#0A66C2", "Facebook": "#1877F2", "TikTok": "#000", "YouTube": "#FF0000", "Reddit": "#FF4500" };
  return (
    <div style={{ display: "flex", gap: 12, padding: "10px 0", borderBottom: `1px solid ${COLORS.borderLight}`, alignItems: "flex-start" }}>
      <div style={{ width: 4, height: 36, borderRadius: 2, backgroundColor: platformColors[post.platform] || COLORS.accent, marginTop: 2, flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: COLORS.text, fontFamily: font }}>{post.platform}</span>
          <Badge label={post.status} bg={post.status === "scheduled" ? COLORS.accentLight : post.status === "posted" ? COLORS.successLight : COLORS.warningLight} color={post.status === "scheduled" ? COLORS.accent : post.status === "posted" ? COLORS.success : COLORS.warning} />
          <Badge label={post.model} bg={post.model === "Claude" ? COLORS.purpleLight : COLORS.tealLight} color={post.model === "Claude" ? COLORS.purple : COLORS.teal} />
        </div>
        <div style={{ fontSize: 12, color: COLORS.textSecondary, fontFamily: font, lineHeight: 1.4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{post.content}</div>
        <div style={{ fontSize: 10, color: COLORS.textMuted, fontFamily: fontMono, marginTop: 3 }}>{post.time}</div>
      </div>
    </div>
  );
}

// ─── MODEL ROUTING ROW ───

function ModelRouteRow({ route }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 0", borderBottom: `1px solid ${COLORS.borderLight}` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: route.active ? COLORS.success : COLORS.textMuted }} />
        <span style={{ fontSize: 12, fontWeight: 500, color: COLORS.text, fontFamily: font }}>{route.task}</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <Badge label={route.model} bg={route.model === "Claude Opus" ? COLORS.purpleLight : route.model === "Claude Sonnet" ? COLORS.accentLight : COLORS.tealLight} color={route.model === "Claude Opus" ? COLORS.purple : route.model === "Claude Sonnet" ? COLORS.accent : COLORS.teal} />
        <span style={{ fontSize: 10, color: COLORS.textMuted, fontFamily: fontMono }}>{route.calls}/hr</span>
      </div>
    </div>
  );
}

// ─── BROWSER SESSION CARD ───

function BrowserSessionCard({ session }) {
  return (
    <div style={{ padding: "10px 12px", borderRadius: 8, backgroundColor: COLORS.bg, display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{ width: 32, height: 32, borderRadius: 6, backgroundColor: COLORS.card, border: `1px solid ${COLORS.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>
        🌐
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.text, fontFamily: font }}>{session.site}</div>
        <div style={{ fontSize: 10, color: COLORS.textMuted, fontFamily: fontMono, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{session.action}</div>
      </div>
      <StatusDot status={session.status} />
    </div>
  );
}

// ─── MOCK DATA ───

const agents = [
  { id: "ag-001", name: "Crawler Alpha", status: "active", currentTask: "scrape:linkedin/jobs", tasksCompleted: 1247, cpu: 42 },
  { id: "ag-002", name: "Parser Beta", status: "active", currentTask: "parse:pdf-batch-09", tasksCompleted: 893, cpu: 67 },
  { id: "ag-003", name: "Indexer Gamma", status: "idle", currentTask: null, tasksCompleted: 2104, cpu: 8 },
  { id: "ag-004", name: "Social Bot Delta", status: "active", currentTask: "post:twitter/scheduled", tasksCompleted: 456, cpu: 34 },
  { id: "ag-005", name: "Engage Epsilon", status: "active", currentTask: "reply:ig/mentions", tasksCompleted: 312, cpu: 28 },
  { id: "ag-006", name: "Router Zeta", status: "active", currentTask: "route:queue-dispatch", tasksCompleted: 3891, cpu: 23 },
];

const users = [
  { name: "Bobby Chen", email: "bobby@openclaw.io", role: "admin", lastActive: "2 min ago", apiCalls: "14,203" },
  { name: "Sarah Kim", email: "sarah@openclaw.io", role: "operator", lastActive: "12 min ago", apiCalls: "8,421" },
  { name: "Marcus Lee", email: "marcus@openclaw.io", role: "operator", lastActive: "1 hr ago", apiCalls: "3,109" },
  { name: "Anika Patel", email: "anika@openclaw.io", role: "viewer", lastActive: "3 hr ago", apiCalls: "284" },
];

const activityLog = [
  { time: "14:32:01", message: "Chrome session opened: twitter.com — posting scheduled content via browser automation.", type: "info" },
  { time: "14:28:45", message: "Claude generated 3 Instagram captions for scheduled batch. Qwen routing confirmed.", type: "success" },
  { time: "14:22:18", message: "LinkedIn post failed: CAPTCHA detected. Browser paused — manual intervention needed.", type: "error" },
  { time: "14:15:00", message: "Daily token quota refreshed. Claude: 1.8M, Qwen: 2.4M tokens allocated.", type: "success" },
  { time: "14:08:33", message: "TikTok account @openclaw_ai reached 1,200 followers. Growth rate: +8.3%/week.", type: "success" },
  { time: "13:55:12", message: "Qwen processed 847 mention scans across 4 platforms. 12 flagged for Claude reply.", type: "info" },
  { time: "13:42:07", message: "Rate limit warning: Twitter posting frequency approaching platform limit.", type: "warning" },
];

const platforms = [
  { name: "Twitter/X", handle: "openclaw_ai", connected: true, followers: "2.4K", postsToday: 6, engagement: "4.2%", model: "Claude", method: "Chrome" },
  { name: "Instagram", handle: "openclaw.ai", connected: true, followers: "1.1K", postsToday: 3, engagement: "6.8%", model: "Claude", method: "Chrome" },
  { name: "LinkedIn", handle: "openclaw", connected: true, followers: "890", postsToday: 2, engagement: "3.1%", model: "Claude", method: "Chrome" },
  { name: "TikTok", handle: "openclaw_ai", connected: true, followers: "1.2K", postsToday: 4, engagement: "8.9%", model: "Qwen", method: "Chrome" },
  { name: "YouTube", handle: "OpenClawAI", connected: true, followers: "340", postsToday: 1, engagement: "2.4%", model: "Claude", method: "Chrome" },
  { name: "Reddit", handle: "openclaw_bot", connected: true, followers: "580", postsToday: 5, engagement: "5.7%", model: "Qwen", method: "Chrome" },
  { name: "Facebook", handle: "openclaw", connected: false, followers: "—", postsToday: 0, engagement: "—", model: "—", method: "—" },
  { name: "Threads", handle: "openclaw", connected: false, followers: "—", postsToday: 0, engagement: "—", model: "—", method: "—" },
];

const postQueue = [
  { platform: "Twitter/X", content: "AI agents are reshaping how we think about automation. Here's what we learned building OpenClaw...", time: "Scheduled: 3:00 PM", status: "scheduled", model: "Claude" },
  { platform: "Instagram", content: "Behind the scenes of our multi-agent architecture. Swipe to see the full pipeline →", time: "Scheduled: 4:30 PM", status: "scheduled", model: "Claude" },
  { platform: "LinkedIn", content: "We just shipped browser-native automation for our agent fleet. No APIs needed. Thread on architecture decisions:", time: "Scheduled: 5:00 PM", status: "scheduled", model: "Claude" },
  { platform: "TikTok", content: "Watch our AI agent post to 6 platforms simultaneously in under 30 seconds #aiagents #automation", time: "Posted: 1:45 PM", status: "posted", model: "Qwen" },
  { platform: "Reddit", content: "r/artificial — We open-sourced our multi-model routing system. Claude for creative, Qwen for monitoring.", time: "Posted: 12:30 PM", status: "posted", model: "Qwen" },
  { platform: "Twitter/X", content: "Replying to @user: Great question! Our agent swarm handles that by...", time: "Pending review", status: "review", model: "Claude" },
];

const modelRoutes = [
  { task: "Content generation (posts, captions)", model: "Claude Opus", active: true, calls: "120" },
  { task: "Reply drafting (DMs, comments)", model: "Claude Sonnet", active: true, calls: "340" },
  { task: "Mention scanning & triage", model: "Qwen 2.5", active: true, calls: "890" },
  { task: "Sentiment analysis", model: "Qwen 2.5", active: true, calls: "450" },
  { task: "Content scheduling & routing", model: "Qwen 2.5", active: true, calls: "220" },
  { task: "Image caption generation", model: "Claude Sonnet", active: true, calls: "85" },
  { task: "Hashtag research & trending", model: "Qwen 2.5", active: false, calls: "0" },
  { task: "Engagement analytics summary", model: "Claude Sonnet", active: true, calls: "60" },
];

const browserSessions = [
  { site: "twitter.com", action: "Posting scheduled content — tab 1", status: "active" },
  { site: "instagram.com", action: "Monitoring story mentions — tab 2", status: "active" },
  { site: "linkedin.com", action: "CAPTCHA detected — awaiting manual input", status: "error" },
  { site: "tiktok.com", action: "Uploading video clip — 78% complete", status: "active" },
  { site: "reddit.com", action: "Replying to comments in r/artificial", status: "active" },
];

const hourlyUsage = [
  { label: "6a", value: 120 }, { label: "7a", value: 340 }, { label: "8a", value: 580 }, { label: "9a", value: 890 },
  { label: "10a", value: 1200 }, { label: "11a", value: 980 }, { label: "12p", value: 760 }, { label: "1p", value: 1100 },
  { label: "2p", value: 1340, highlight: true }, { label: "3p", value: 0 }, { label: "4p", value: 0 }, { label: "5p", value: 0 },
];

// ─── MAIN DASHBOARD ───

export default function OpenClawDashboard() {
  const [now, setNow] = useState(new Date());
  const [activeNav, setActiveNav] = useState("overview");

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const navItems = [
    { key: "overview", label: "Overview", icon: "◉" },
    { key: "social", label: "Social Media", icon: "◈" },
    { key: "agents", label: "Agents", icon: "⬡" },
    { key: "models", label: "Model Routing", icon: "⟡" },
    { key: "browser", label: "Browser Sessions", icon: "🌐" },
    { key: "users", label: "Users", icon: "◎" },
    { key: "logs", label: "Logs", icon: "☰" },
    { key: "settings", label: "Settings", icon: "⚙" },
  ];

  return (
    <div style={{ fontFamily: font, backgroundColor: COLORS.bg, minHeight: "100vh", color: COLORS.text, display: "flex" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet" />

      {/* ─── SIDEBAR ─── */}
      <aside style={{ width: 210, backgroundColor: COLORS.card, borderRight: `1px solid ${COLORS.border}`, padding: "24px 0", display: "flex", flexDirection: "column", flexShrink: 0, height: "100vh", position: "sticky", top: 0 }}>
        <div style={{ padding: "0 18px", marginBottom: 28 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: COLORS.text, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 13, fontWeight: 700 }}>OC</div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: "-0.02em" }}>OpenClaw</div>
              <div style={{ fontSize: 9, color: COLORS.textMuted, fontWeight: 500, letterSpacing: "0.02em" }}>OPERATOR CONSOLE</div>
            </div>
          </div>
        </div>

        <nav style={{ flex: 1 }}>
          {navItems.map(item => (
            <button key={item.key} onClick={() => setActiveNav(item.key)} style={{ display: "flex", alignItems: "center", gap: 9, width: "100%", padding: "9px 18px", border: "none", background: activeNav === item.key ? COLORS.bg : "transparent", color: activeNav === item.key ? COLORS.text : COLORS.textSecondary, fontWeight: activeNav === item.key ? 600 : 400, fontSize: 13, fontFamily: font, cursor: "pointer", textAlign: "left", borderRight: activeNav === item.key ? `2px solid ${COLORS.accent}` : "2px solid transparent", transition: "all 0.15s ease" }}>
              <span style={{ fontSize: 13, opacity: 0.5, width: 18, textAlign: "center" }}>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        {/* Browser status */}
        <div style={{ padding: "12px 18px", borderTop: `1px solid ${COLORS.border}`, marginBottom: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
            <span style={{ fontSize: 12 }}>🌐</span>
            <span style={{ fontSize: 11, fontWeight: 600, color: COLORS.text }}>Chrome Sessions</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <StatusDot status="active" />
            <span style={{ fontSize: 11, color: COLORS.success, fontWeight: 500 }}>5 tabs active</span>
          </div>
          <div style={{ fontSize: 10, color: COLORS.textMuted, marginTop: 3, fontFamily: fontMono }}>Claude Code v2.0.73</div>
        </div>

        <div style={{ padding: "12px 18px", borderTop: `1px solid ${COLORS.border}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 26, height: 26, borderRadius: "50%", backgroundColor: COLORS.accentLight, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: COLORS.accent }}>BC</div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600 }}>Bobby C.</div>
              <div style={{ fontSize: 9, color: COLORS.textMuted }}>Admin</div>
            </div>
          </div>
        </div>
      </aside>

      {/* ─── MAIN CONTENT ─── */}
      <main style={{ flex: 1, padding: "22px 28px", overflow: "auto", maxHeight: "100vh" }}>
        {/* Top bar */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 21, fontWeight: 700, margin: 0, letterSpacing: "-0.03em" }}>Operator Dashboard</h1>
            <p style={{ fontSize: 12, color: COLORS.textMuted, margin: "3px 0 0" }}>
              {now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })} · <span style={{ fontFamily: fontMono }}>{now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</span>
            </p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button style={{ fontSize: 11, fontWeight: 600, color: COLORS.textSecondary, background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: "7px 14px", cursor: "pointer", fontFamily: font }}>Export Report</button>
            <button style={{ fontSize: 11, fontWeight: 600, color: "#fff", background: COLORS.text, border: "none", borderRadius: 8, padding: "7px 16px", cursor: "pointer", fontFamily: font }}>+ New Agent</button>
          </div>
        </div>

        {/* KPI Row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 20 }}>
          <KPICard label="Active Agents" value="5 / 6" change="2 more" changeType="up" sparkData={[2, 3, 3, 4, 3, 4, 5, 5, 5]} icon="⬡" />
          <KPICard label="Posts Today" value="21" change="38%" changeType="up" sparkData={[4, 6, 8, 10, 12, 15, 17, 19, 21]} icon="◈" />
          <KPICard label="Tokens Used" value="1.82M" change="8.1%" changeType="up" sparkData={[800, 920, 1100, 1050, 1200, 1400, 1600, 1750, 1820]} icon="⟡" />
          <KPICard label="Avg Engagement" value="5.2%" change="1.1%" changeType="up" sparkData={[3.1, 3.4, 3.8, 4.0, 4.2, 4.5, 4.8, 5.0, 5.2]} icon="♡" />
        </div>

        {/* ─── SOCIAL MEDIA COMMAND CENTER ─── */}
        <Card style={{ marginBottom: 20 }}>
          <SectionHeader title="Social Media Command Center" subtitle="All platforms managed via Claude Code Chrome automation" action="+ Connect Platform" />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
            {platforms.map(p => <PlatformCard key={p.name} platform={p} />)}
          </div>
        </Card>

        {/* Post Queue + Model Routing + Browser Sessions */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 300px", gap: 14, marginBottom: 20 }}>
          {/* Post Queue */}
          <Card>
            <SectionHeader title="Content Queue" subtitle="Scheduled, posted & pending review" action="Schedule" />
            <div style={{ maxHeight: 310, overflowY: "auto" }}>
              {postQueue.map((post, i) => <PostQueueItem key={i} post={post} />)}
            </div>
          </Card>

          {/* Model Routing */}
          <Card>
            <SectionHeader title="Model Routing" subtitle="Claude + Qwen task allocation" />
            <div style={{ marginBottom: 12, display: "flex", gap: 8 }}>
              <div style={{ flex: 1, padding: "10px", backgroundColor: COLORS.purpleLight, borderRadius: 8, textAlign: "center" }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: COLORS.purple }}>{modelRoutes.filter(r => r.model.includes("Claude")).reduce((s, r) => s + parseInt(r.calls), 0)}</div>
                <div style={{ fontSize: 10, color: COLORS.purple, fontWeight: 500 }}>Claude calls/hr</div>
              </div>
              <div style={{ flex: 1, padding: "10px", backgroundColor: COLORS.tealLight, borderRadius: 8, textAlign: "center" }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: COLORS.teal }}>{modelRoutes.filter(r => r.model.includes("Qwen")).reduce((s, r) => s + parseInt(r.calls), 0)}</div>
                <div style={{ fontSize: 10, color: COLORS.teal, fontWeight: 500 }}>Qwen calls/hr</div>
              </div>
            </div>
            {modelRoutes.map((route, i) => <ModelRouteRow key={i} route={route} />)}
          </Card>

          {/* Browser Sessions */}
          <Card>
            <SectionHeader title="Chrome Sessions" subtitle="Live browser automation" />
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {browserSessions.map((s, i) => <BrowserSessionCard key={i} session={s} />)}
            </div>
            <div style={{ marginTop: 14, padding: "10px 12px", backgroundColor: COLORS.bg, borderRadius: 8, fontSize: 11, fontFamily: font }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ color: COLORS.textMuted }}>Connection</span>
                <span style={{ fontWeight: 600, color: COLORS.success }}>Stable</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ color: COLORS.textMuted }}>Extension</span>
                <span style={{ fontFamily: fontMono, fontSize: 10, color: COLORS.text }}>v1.0.36</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: COLORS.textMuted }}>Auth state</span>
                <span style={{ fontWeight: 600, color: COLORS.success }}>Logged in (5)</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Agent Fleet + Token Usage + Task Distribution */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 14, marginBottom: 20 }}>
          <Card>
            <SectionHeader title="Agent Fleet" subtitle="Real-time agent status and workload" action="Manage" />
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1.2fr 1fr 1fr 80px", padding: "8px 0", borderBottom: `2px solid ${COLORS.border}`, fontSize: 10, fontWeight: 600, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: font }}>
              <span>Agent</span><span>Status</span><span>Current Task</span><span>Done</span><span>Load</span><span></span>
            </div>
            {agents.map(a => <AgentRow key={a.id} agent={a} />)}
          </Card>

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <Card>
              <SectionHeader title="Token Usage" subtitle="Today" />
              <BarChart data={hourlyUsage} />
              <div style={{ marginTop: 10, display: "flex", justifyContent: "space-between", fontSize: 10 }}>
                <span style={{ color: COLORS.textMuted }}>Quota: <span style={{ fontWeight: 600, color: COLORS.text }}>1.82M / 2.4M</span></span>
                <span style={{ color: COLORS.warning, fontWeight: 600 }}>75.8%</span>
              </div>
              <div style={{ marginTop: 4 }}><ProgressBar value={75.8} color={COLORS.warning} /></div>
            </Card>
            <Card>
              <SectionHeader title="Task Distribution" />
              <DonutChart segments={[
                { label: "Social Posts", value: 35, color: COLORS.accent },
                { label: "Engagement", value: 28, color: COLORS.success },
                { label: "Monitoring", value: 22, color: COLORS.teal },
                { label: "Content Gen", value: 15, color: COLORS.purple },
              ]} />
            </Card>
          </div>
        </div>

        {/* Activity + Users */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 32 }}>
          <Card>
            <SectionHeader title="Activity Log" subtitle="Latest system events" action="View All" />
            <div style={{ maxHeight: 260, overflowY: "auto" }}>
              {activityLog.map((item, i) => <ActivityItem key={i} {...item} />)}
            </div>
          </Card>

          <Card>
            <SectionHeader title="Team & Permissions" subtitle="User access management" action="Invite" />
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1.2fr 1fr", padding: "8px 0", borderBottom: `2px solid ${COLORS.border}`, fontSize: 10, fontWeight: 600, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: font }}>
              <span>User</span><span>Role</span><span>Last Active</span><span>API Calls</span>
            </div>
            {users.map(u => <UserRow key={u.email} user={u} />)}
            <div style={{ marginTop: 14, padding: "12px 14px", backgroundColor: COLORS.bg, borderRadius: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 10, color: COLORS.textMuted, fontWeight: 500 }}>Est. Monthly Cost</div>
                <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: "-0.02em", marginTop: 2 }}>$247.80</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 10, color: COLORS.textMuted, fontWeight: 500 }}>Billing Period</div>
                <div style={{ fontSize: 12, fontWeight: 600, marginTop: 2 }}>Mar 1 – Mar 31</div>
              </div>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}
