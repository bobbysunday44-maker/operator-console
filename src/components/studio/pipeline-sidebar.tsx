"use client";

import type { ContentMeta } from "@/lib/pipeline/types";

interface CostItem {
  label: string;
  cost: string;
}

interface ModelInfo {
  name: string;
  type: string;
  colorClass: string;
  bgClass: string;
}

export function PipelineSidebar({
  models,
  costs,
  content,
}: {
  models: ModelInfo[];
  costs: CostItem[];
  content: ContentMeta;
}) {
  return (
    <div className="w-studio-right border-l border-oc-border flex flex-col gap-4 shrink-0 overflow-y-auto h-[calc(100vh-44px)]" style={{ padding: "20px 16px" }}>
      <div className="text-small font-bold text-oc-text">Pipeline Info</div>

      {/* Models */}
      <div>
        <div className="text-tiny font-semibold text-oc-text-muted uppercase tracking-[0.05em] mb-2">
          Models
        </div>
        {models.map((m) => (
          <div
            key={m.name}
            className="flex items-center gap-2 py-1.5 border-b border-oc-border-light"
          >
            <div className={`w-1.5 h-1.5 rounded-full ${m.colorClass} shrink-0`} />
            <div className="flex-1 min-w-0">
              <div className="text-tiny font-semibold text-oc-text truncate">{m.name}</div>
              <div className="text-[9px] text-oc-text-muted">{m.type}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Cost Breakdown */}
      <div>
        <div className="text-tiny font-semibold text-oc-text-muted uppercase tracking-[0.05em] mb-2">
          Cost Breakdown
        </div>
        <div className="p-[10px_12px] bg-oc-bg rounded-oc-sm">
          {costs.map((c) => (
            <div key={c.label} className="flex justify-between py-0.5 text-tiny">
              <span className="text-oc-text-secondary">{c.label}</span>
              <span className="font-mono font-semibold text-oc-text">{c.cost}</span>
            </div>
          ))}
          <div className="border-t border-oc-border mt-1.5 pt-1.5 flex justify-between text-small">
            <span className="font-bold text-oc-text">Total</span>
            <span className="font-mono font-bold text-oc-blue">~$0.055</span>
          </div>
        </div>
      </div>

      {/* Content Archive */}
      <div>
        <div className="text-tiny font-semibold text-oc-text-muted uppercase tracking-[0.05em] mb-2">
          Content Archive
        </div>
        <div className="p-[10px_12px] bg-oc-bg rounded-oc-sm text-tiny">
          <div className="flex justify-between mb-1">
            <span className="text-oc-text-secondary">Content ID</span>
            <span className="font-mono text-oc-text">{content.id}</span>
          </div>
          <div className="flex justify-between mb-1">
            <span className="text-oc-text-secondary">Files saved</span>
            <span className="font-mono text-oc-text">3 / 5</span>
          </div>
          <div className="flex justify-between">
            <span className="text-oc-text-secondary">Archive path</span>
            <span className="font-mono text-oc-text-muted text-[9px]">
              /archive/{content.id}/
            </span>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-auto">
        <button className="w-full py-2.5 text-small font-semibold text-white bg-oc-text border-none rounded-oc-sm cursor-pointer mb-2">
          Run Full Pipeline
        </button>
        <button className="w-full py-2.5 text-small font-semibold text-oc-text-secondary bg-oc-card border border-oc-border rounded-oc-sm cursor-pointer">
          Save as Template
        </button>
      </div>
    </div>
  );
}
