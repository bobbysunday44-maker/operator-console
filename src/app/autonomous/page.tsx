"use client";

import { useState, useEffect, useCallback } from "react";
import { OcBadge } from "@/components/shared";
import { Zap, Shield, AlertTriangle, CheckCircle, XCircle } from "lucide-react";

interface Rule { id: string; niche: string; name: string; minQualityScore: number; maxDailyCost: number; maxDailyPosts: number; autoApproveAfterMinutes: number; confidenceThreshold: number; allowedBuckets: string[]; blockedTopics: string[]; requireHumanReview: boolean; isActive: boolean; }
interface Decision { id: string; decision: string; reason: string; qualityScore: number | null; confidence: number | null; overriddenBy: string | null; createdAt: string; contentItem?: { title: string; niche: string }; rule?: { name: string }; }

export default function AutonomousPage() {
  const [rules, setRules] = useState<Rule[]>([]);
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [tab, setTab] = useState<"status" | "rules" | "decisions">("status");

  const fetchData = useCallback(async () => {
    const [rulesRes, decisionsRes] = await Promise.all([
      fetch("/api/autonomous/rules").then((r) => r.json()).catch(() => ({ rules: [] })),
      fetch("/api/autonomous/decisions").then((r) => r.json()).catch(() => ({ decisions: [] })),
    ]);
    setRules(rulesRes.rules || []);
    setDecisions(decisionsRes.decisions || []);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const toggleRule = async (ruleId: string, isActive: boolean) => {
    await fetch(`/api/autonomous/rules/${ruleId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !isActive }),
    });
    fetchData();
  };

  const activeRules = rules.filter((r) => r.isActive);
  const approved = decisions.filter((d) => d.decision === "approved").length;
  const escalated = decisions.filter((d) => d.decision === "escalated").length;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-2.5">
        <span className="text-page-title text-oc-text">Autonomous Mode</span>
        <OcBadge label={activeRules.length > 0 ? "ACTIVE" : "OFF"} color={activeRules.length > 0 ? "#059669" : "#9CA3AF"} bg={activeRules.length > 0 ? "#ECFDF5" : "#F3F4F6"} />
      </div>

      {/* Warning */}
      {activeRules.length > 0 && (
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-oc flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-yellow-600 shrink-0" />
          <span className="text-small text-yellow-800">Autonomous mode is ON for {activeRules.length} niche(s). Content will be auto-approved within configured thresholds.</span>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Active Rules", value: activeRules.length, color: "text-oc-green" },
          { label: "Auto-Approved", value: approved, color: "text-oc-blue" },
          { label: "Escalated to You", value: escalated, color: "text-oc-purple" },
          { label: "Total Decisions", value: decisions.length, color: "text-oc-teal" },
        ].map((kpi) => (
          <div key={kpi.label} className="p-[14px_16px] bg-oc-card border border-oc-border rounded-oc">
            <div className="text-[9px] font-semibold text-oc-text-muted uppercase tracking-[0.05em] mb-1">{kpi.label}</div>
            <div className={`text-[22px] font-bold font-mono ${kpi.color}`}>{kpi.value}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-oc-border">
        {(["status", "rules", "decisions"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`pb-2 text-small font-semibold capitalize ${tab === t ? "text-oc-text border-b-2 border-oc-blue" : "text-oc-text-muted"}`}>{t}</button>
        ))}
      </div>

      {tab === "status" && (
        <div className="p-6 bg-oc-card border border-oc-border rounded-oc">
          <div className="flex items-center gap-3 mb-4">
            <Zap className="w-5 h-5 text-oc-purple" />
            <span className="text-small font-semibold text-oc-text">How Autonomous Mode Works</span>
          </div>
          <div className="text-tiny text-oc-text-muted leading-relaxed space-y-2">
            <p>When enabled, Opus automatically approves content that meets ALL configured thresholds:</p>
            <ul className="list-disc pl-4 space-y-1">
              <li>Quality score above minimum (e.g., 7.5/10)</li>
              <li>Confidence above threshold (e.g., 80%)</li>
              <li>Daily cost within budget</li>
              <li>Daily post count within limits</li>
              <li>Content bucket is in allowed list</li>
              <li>Topic is NOT in blocked list</li>
            </ul>
            <p>If ANY check fails, content is escalated to you for manual review. You can override any autonomous decision.</p>
          </div>
        </div>
      )}

      {tab === "rules" && (
        <div className="flex flex-col gap-3">
          {rules.length === 0 ? (
            <div className="p-8 bg-oc-card border border-oc-border rounded-oc text-center">
              <Shield className="w-8 h-8 text-oc-text-muted mx-auto mb-3" />
              <div className="text-small text-oc-text-muted">No autonomous rules configured yet.</div>
            </div>
          ) : rules.map((rule) => (
            <div key={rule.id} className={`p-4 bg-oc-card border rounded-oc ${rule.isActive ? "border-oc-green" : "border-oc-border"}`}>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <span className="text-small font-semibold text-oc-text">{rule.name}</span>
                  <span className="text-tiny text-oc-text-muted ml-2">Niche: {rule.niche}</span>
                </div>
                <button onClick={() => toggleRule(rule.id, rule.isActive)} className={`px-3 py-1 rounded-oc text-tiny font-semibold ${rule.isActive ? "bg-oc-green text-white" : "bg-oc-border-light text-oc-text-muted"}`}>
                  {rule.isActive ? "Active" : "Inactive"}
                </button>
              </div>
              <div className="grid grid-cols-4 gap-3 text-tiny">
                <div><span className="text-oc-text-muted">Min Quality:</span> <span className="font-mono">{rule.minQualityScore}/10</span></div>
                <div><span className="text-oc-text-muted">Max Cost/Day:</span> <span className="font-mono">${rule.maxDailyCost}</span></div>
                <div><span className="text-oc-text-muted">Max Posts/Day:</span> <span className="font-mono">{rule.maxDailyPosts}</span></div>
                <div><span className="text-oc-text-muted">Confidence:</span> <span className="font-mono">{Math.round(rule.confidenceThreshold * 100)}%</span></div>
              </div>
              {rule.blockedTopics.length > 0 && (
                <div className="mt-2 flex items-center gap-1.5">
                  <span className="text-[9px] text-oc-text-muted">Blocked:</span>
                  {rule.blockedTopics.map((t) => <OcBadge key={t} label={t} color="#EF4444" bg="#FEF2F2" />)}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {tab === "decisions" && (
        <div className="flex flex-col gap-2">
          {decisions.length === 0 ? (
            <div className="p-6 bg-oc-card border border-oc-border rounded-oc text-center text-small text-oc-text-muted">No decisions yet.</div>
          ) : decisions.map((d) => (
            <div key={d.id} className="p-3 bg-oc-card border border-oc-border rounded-oc flex items-center justify-between">
              <div className="flex items-center gap-3">
                {d.decision === "approved" ? <CheckCircle className="w-4 h-4 text-oc-green" /> :
                 d.decision === "escalated" ? <AlertTriangle className="w-4 h-4 text-yellow-500" /> :
                 <XCircle className="w-4 h-4 text-red-500" />}
                <div>
                  <div className="text-small text-oc-text">{d.contentItem?.title || "Unknown"}</div>
                  <div className="text-tiny text-oc-text-muted">{d.reason}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {d.qualityScore && <span className="text-tiny font-mono">Score: {d.qualityScore}</span>}
                <OcBadge label={d.decision} color={d.decision === "approved" ? "#059669" : d.decision === "escalated" ? "#D97706" : "#EF4444"} bg={d.decision === "approved" ? "#ECFDF5" : d.decision === "escalated" ? "#FFFBEB" : "#FEF2F2"} />
                {d.overriddenBy && <OcBadge label="Overridden" color="#8B5CF6" bg="#F5F3FF" />}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
