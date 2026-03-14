"use client";

import { useState, useEffect, useCallback } from "react";
import { OcBadge } from "@/components/shared";
import type { BrowserSession } from "@/lib/routing/types";

const STATUS_STYLES: Record<string, { label: string; color: string; bg: string }> = {
  active: { label: "Active", color: "#059669", bg: "#ECFDF5" },
  idle: { label: "Idle", color: "#D97706", bg: "#FFFBEB" },
  disconnected: { label: "Disconnected", color: "#DC2626", bg: "#FEF2F2" },
  error: { label: "Error", color: "#DC2626", bg: "#FEF2F2" },
};

const PLATFORM_ICONS: Record<string, string> = {
  "Twitter/X": "🐦",
  Instagram: "📸",
  TikTok: "🎵",
  LinkedIn: "💼",
  YouTube: "▶️",
  Reddit: "🔴",
};

function timeAgo(ts: number): string {
  const mins = Math.floor((Date.now() - ts) / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function BrowserPage() {
  const [sessions, setSessions] = useState<BrowserSession[]>([]);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/browser");
      const data = await res.json();
      setSessions(data.sessions || []);
    } catch {
      console.error("[Browser] Fetch failed");
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const activeCount = sessions.filter((s) => s.status === "active").length;
  const authCount = sessions.filter((s) => s.authenticated).length;

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center gap-2.5">
        <span className="text-page-title text-oc-text">Browser Sessions</span>
        <OcBadge label={`${activeCount} active`} color="#059669" bg="#ECFDF5" />
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Total Sessions", value: sessions.length, color: "text-oc-text" },
          { label: "Active", value: activeCount, color: "text-oc-green" },
          { label: "Authenticated", value: authCount, color: "text-oc-blue" },
          { label: "Disconnected", value: sessions.filter((s) => s.status === "disconnected").length, color: "text-oc-red" },
        ].map((s) => (
          <div key={s.label} className="p-[14px_16px] bg-oc-card border border-oc-border rounded-oc">
            <div className="text-[9px] font-semibold text-oc-text-muted uppercase tracking-[0.05em] mb-1">
              {s.label}
            </div>
            <div className={`text-[22px] font-bold font-mono ${s.color}`}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Session list */}
      <div className="flex flex-col gap-3">
        {sessions.length === 0 ? (
          <div className="text-center py-8 text-tiny text-oc-text-muted">
            No browser sessions. Connect the Chrome extension to start.
          </div>
        ) : (
          sessions.map((session) => {
            const statusStyle = STATUS_STYLES[session.status] || STATUS_STYLES.disconnected;
            const icon = PLATFORM_ICONS[session.platform] || "🌐";
            return (
              <div
                key={session.id}
                className={`p-[16px_18px] bg-oc-card border rounded-[10px] transition-opacity ${
                  session.status === "disconnected" ? "border-oc-border-light opacity-60" : "border-oc-border"
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Platform icon */}
                  <div className="w-10 h-10 rounded-oc-sm bg-oc-bg flex items-center justify-center text-[20px] shrink-0">
                    {icon}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-small font-semibold text-oc-text">{session.platform}</span>
                      <OcBadge label={statusStyle.label} color={statusStyle.color} bg={statusStyle.bg} />
                      <OcBadge
                        label={session.authenticated ? "Logged In" : "Not Logged In"}
                        color={session.authenticated ? "#059669" : "#9C9590"}
                        bg={session.authenticated ? "#ECFDF5" : "#F0EDE6"}
                      />
                    </div>

                    <div className="text-tiny text-oc-text-secondary mb-1">{session.tabTitle}</div>

                    <div className="flex items-center gap-3 text-[9px]">
                      <span className="font-mono text-oc-text-muted truncate max-w-[300px]">
                        {session.url}
                      </span>
                      {session.currentAction && (
                        <span className="font-semibold text-oc-blue">
                          {session.currentAction}
                        </span>
                      )}
                      <span className="text-oc-text-muted ml-auto">
                        {timeAgo(session.lastActivityAt)}
                      </span>
                    </div>
                  </div>

                  {/* Quick actions */}
                  <div className="flex gap-1.5 shrink-0">
                    {session.status === "disconnected" ? (
                      <button
                        onClick={() => fetchData()}
                        className="text-tiny font-semibold text-oc-blue bg-oc-blue-light border-none rounded-[6px] px-3 py-1.5 cursor-pointer"
                      >
                        Reconnect
                      </button>
                    ) : (
                      <button
                        onClick={() => window.open(session.url, "_blank", "noopener")}
                        className="text-tiny font-semibold text-oc-text-secondary bg-oc-bg border border-oc-border rounded-[6px] px-3 py-1.5 cursor-pointer"
                      >
                        View
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Chrome extension info */}
      <div className="p-[14px_16px] bg-oc-bg border border-oc-border-light rounded-[10px]">
        <div className="text-tiny font-semibold text-oc-text-muted uppercase tracking-[0.05em] mb-1">
          Chrome Extension
        </div>
        <div className="text-small text-oc-text-secondary">
          Browser sessions are managed by the Claude Code Chrome extension. Sessions auto-reconnect and maintain authentication state across restarts.
        </div>
      </div>
    </div>
  );
}
