"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MessageSquare } from "lucide-react";

interface StatusBarProps {
  counts: {
    active: number;
    chatting: number;
    meeting: number;
    idle: number;
    total: number;
  };
}

export function StatusBar({ counts }: StatusBarProps) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatted = time.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  return (
    <div className="flex items-center justify-between px-6 py-3 bg-white border-b border-oc-border">
      {/* Left: Title */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-oc-sm bg-[#1a1a2e] flex items-center justify-center">
          <span className="text-white text-[11px] font-bold">HQ</span>
        </div>
        <div>
          <h1 className="text-[16px] font-bold text-oc-text tracking-[-0.02em] leading-none">
            OpenClaw HQ
          </h1>
          <p className="text-[10px] text-oc-text-muted mt-0.5">
            Virtual Office
          </p>
        </div>
      </div>

      {/* Center: Status counts */}
      <div className="flex items-center gap-5">
        <StatusPill
          color="#059669"
          label="Active"
          count={counts.active}
          glowClass="status-glow-green"
        />
        <StatusPill
          color="#2563EB"
          label="Chatting"
          count={counts.chatting}
          glowClass="status-glow-blue"
        />
        <StatusPill
          color="#7C3AED"
          label="In Meeting"
          count={counts.meeting}
        />
        <StatusPill color="#9C9590" label="Idle" count={counts.idle} />
        <div className="h-5 w-px bg-oc-border" />
        <span className="text-[11px] text-oc-text-muted font-medium">
          {counts.total} agents
        </span>
      </div>

      {/* Right: Clock + Chat link */}
      <div className="flex items-center gap-4">
        <div className="font-mono text-[13px] text-oc-text tabular-nums tracking-wide">
          {formatted}
        </div>
        <Link
          href="/chat"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-oc-sm bg-oc-blue text-white text-[11px] font-semibold hover:bg-blue-700 transition-colors"
        >
          <MessageSquare size={12} />
          View Chat
        </Link>
      </div>
    </div>
  );
}

function StatusPill({
  color,
  label,
  count,
  glowClass,
}: {
  color: string;
  label: string;
  count: number;
  glowClass?: string;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span
        className={`inline-block w-[7px] h-[7px] rounded-full ${glowClass || ""}`}
        style={{ backgroundColor: color }}
      />
      <span className="text-[11px] text-oc-text-secondary font-medium">
        {label}:
      </span>
      <span className="text-[12px] text-oc-text font-semibold">{count}</span>
    </div>
  );
}
