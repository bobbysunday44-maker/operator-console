"use client";

import { useState, useEffect, useCallback } from "react";
import { OcBadge } from "@/components/shared";
import { FlaskConical, Trophy } from "lucide-react";

interface Variant { id: string; variantLabel: string; hookText: string | null; caption: string | null; views: number; engagementRate: number; ctr: number; saves: number; isWinner: boolean; }
interface ABTest { id: string; name: string; status: string; winnerVariant: string | null; winMetric: string; startedAt: string; endedAt: string | null; variants: Variant[]; contentItem?: { title: string; niche: string }; }

export default function ABTestingPage() {
  const [tests, setTests] = useState<ABTest[]>([]);
  const [evaluating, setEvaluating] = useState<string | null>(null);

  const fetchTests = useCallback(async () => {
    const res = await fetch("/api/testing").then((r) => r.json()).catch(() => ({ tests: [] }));
    setTests(res.tests || []);
  }, []);

  useEffect(() => { fetchTests(); }, [fetchTests]);

  const evaluate = async (testId: string) => {
    setEvaluating(testId);
    await fetch(`/api/testing/${testId}`, { method: "POST" });
    await fetchTests();
    setEvaluating(null);
  };

  const running = tests.filter((t) => t.status === "running").length;
  const completed = tests.filter((t) => t.status === "completed").length;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-2.5">
        <span className="text-page-title text-oc-text">A/B Testing</span>
        <OcBadge label={`${running} running`} color="#3B82F6" bg="#EFF6FF" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Total Tests", value: tests.length, color: "text-oc-purple" },
          { label: "Running", value: running, color: "text-oc-blue" },
          { label: "Completed", value: completed, color: "text-oc-green" },
          { label: "Win Rate Avg", value: completed > 0 ? `${Math.round(tests.filter((t) => t.winnerVariant).length / Math.max(1, completed) * 100)}%` : "—", color: "text-oc-teal" },
        ].map((kpi) => (
          <div key={kpi.label} className="p-[14px_16px] bg-oc-card border border-oc-border rounded-oc">
            <div className="text-[9px] font-semibold text-oc-text-muted uppercase tracking-[0.05em] mb-1">{kpi.label}</div>
            <div className={`text-[22px] font-bold font-mono ${kpi.color}`}>{kpi.value}</div>
          </div>
        ))}
      </div>

      {/* Tests List */}
      {tests.length === 0 ? (
        <div className="p-8 bg-oc-card border border-oc-border rounded-oc text-center">
          <FlaskConical className="w-8 h-8 text-oc-text-muted mx-auto mb-3" />
          <div className="text-small text-oc-text-muted">No A/B tests yet. Create one from the Creation Studio.</div>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {tests.map((test) => (
            <div key={test.id} className="p-4 bg-oc-card border border-oc-border rounded-oc">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="text-small font-semibold text-oc-text">{test.name}</div>
                  <div className="text-tiny text-oc-text-muted">{test.contentItem?.title} · Win metric: {test.winMetric}</div>
                </div>
                <div className="flex items-center gap-2">
                  <OcBadge label={test.status} color={test.status === "running" ? "#3B82F6" : test.status === "completed" ? "#059669" : "#9CA3AF"} bg={test.status === "running" ? "#EFF6FF" : test.status === "completed" ? "#ECFDF5" : "#F3F4F6"} />
                  {test.status === "running" && (
                    <button onClick={() => evaluate(test.id)} disabled={evaluating === test.id} className="text-tiny px-2 py-1 bg-oc-blue text-white rounded-oc-sm font-semibold">
                      {evaluating === test.id ? "Checking..." : "Evaluate"}
                    </button>
                  )}
                </div>
              </div>

              {/* Variants */}
              <div className="grid grid-cols-5 gap-2">
                {test.variants.map((v) => (
                  <div key={v.id} className={`p-2.5 rounded-oc border ${v.isWinner ? "border-oc-green bg-green-50" : "border-oc-border bg-oc-bg"}`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-small font-bold text-oc-text">Variant {v.variantLabel}</span>
                      {v.isWinner && <Trophy className="w-3.5 h-3.5 text-oc-green" />}
                    </div>
                    {v.hookText && <div className="text-[9px] text-oc-text-muted italic mb-1 line-clamp-2">&ldquo;{v.hookText}&rdquo;</div>}
                    <div className="grid grid-cols-2 gap-1 text-[9px]">
                      <div><span className="text-oc-text-muted">Views:</span> <span className="font-mono">{v.views}</span></div>
                      <div><span className="text-oc-text-muted">Eng:</span> <span className="font-mono">{v.engagementRate.toFixed(1)}%</span></div>
                      <div><span className="text-oc-text-muted">CTR:</span> <span className="font-mono">{v.ctr.toFixed(1)}%</span></div>
                      <div><span className="text-oc-text-muted">Saves:</span> <span className="font-mono">{v.saves}</span></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
