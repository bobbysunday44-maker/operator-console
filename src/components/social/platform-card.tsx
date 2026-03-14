"use client";

import { OcBadge } from "@/components/shared";
import type { PlatformConfig } from "@/lib/social/types";

export function PlatformCard({ platform }: { platform: PlatformConfig }) {
  return (
    <div className="flex items-center gap-3 p-[12px_14px] bg-oc-card border border-oc-border rounded-[10px]">
      <span className="text-[20px]">{platform.icon}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-small font-semibold text-oc-text">{platform.name}</span>
          <OcBadge
            label={platform.connected ? "Connected" : "Not Connected"}
            color={platform.connected ? "#059669" : "#9C9590"}
            bg={platform.connected ? "#ECFDF5" : "#F0EDE6"}
          />
        </div>
        <div className="text-tiny font-mono text-oc-text-muted">{platform.handle}</div>
      </div>
      <div className="text-right shrink-0">
        <div className="text-small font-mono font-semibold text-oc-text">
          {platform.postsToday}/{platform.dailyLimit}
        </div>
        <div className="text-[9px] text-oc-text-muted">posts today</div>
      </div>
    </div>
  );
}
