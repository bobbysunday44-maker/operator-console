"use client";

import { X, MessageSquare, Zap, Brain, Clock } from "lucide-react";
import { AgentSpriteData, AGENT_COLORS } from "./agent-sprite";
import Link from "next/link";

interface AgentPopupProps {
  agent: AgentSpriteData;
  memories: string[];
  onClose: () => void;
}

const ACTIVITY_LABELS: Record<string, string> = {
  idle: "Standing by",
  working: "Working",
  talking: "In conversation",
  meeting: "In meeting",
  thinking: "Deep in thought",
  resting: "Taking a break",
};

const MOOD_EMOJI: Record<string, string> = {
  neutral: "Neutral",
  focused: "Focused",
  excited: "Excited",
  frustrated: "Frustrated",
  relaxed: "Relaxed",
};

export function AgentPopup({ agent, memories, onClose }: AgentPopupProps) {
  const agentColor = AGENT_COLORS[agent.type] || "#6B7280";

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/20 backdrop-blur-[2px]"
        onClick={onClose}
      />

      {/* Card */}
      <div
        className="relative bg-white rounded-oc w-[340px] overflow-hidden"
        style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.15)" }}
      >
        {/* Header bar */}
        <div
          className="h-2 w-full"
          style={{ backgroundColor: agentColor }}
        />

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-6 h-6 rounded-full bg-oc-bg flex items-center justify-center text-oc-text-muted hover:text-oc-text hover:bg-oc-border transition-colors"
        >
          <X size={12} />
        </button>

        <div className="p-5">
          {/* Avatar + Name */}
          <div className="flex items-center gap-3 mb-4">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center text-white text-lg font-bold"
              style={{ backgroundColor: agentColor }}
            >
              {agent.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 className="text-[15px] font-bold text-oc-text">
                {agent.name}
              </h3>
              <p className="text-[11px] text-oc-text-muted capitalize">
                {agent.type} Agent
              </p>
            </div>
          </div>

          {/* Status row */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            <div className="bg-oc-bg rounded-oc-sm px-3 py-2">
              <div className="flex items-center gap-1.5 mb-1">
                <Zap size={10} className="text-oc-text-muted" />
                <span className="text-[9px] uppercase tracking-wider text-oc-text-muted font-medium">
                  Activity
                </span>
              </div>
              <p className="text-[12px] font-semibold text-oc-text capitalize">
                {ACTIVITY_LABELS[agent.activity] || agent.activity}
              </p>
            </div>
            <div className="bg-oc-bg rounded-oc-sm px-3 py-2">
              <div className="flex items-center gap-1.5 mb-1">
                <Brain size={10} className="text-oc-text-muted" />
                <span className="text-[9px] uppercase tracking-wider text-oc-text-muted font-medium">
                  Mood
                </span>
              </div>
              <p className="text-[12px] font-semibold text-oc-text">
                {MOOD_EMOJI[agent.mood] || agent.mood}
              </p>
            </div>
          </div>

          {/* Energy bar */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] text-oc-text-muted font-medium uppercase tracking-wider">
                Energy
              </span>
              <span className="text-[11px] text-oc-text font-semibold">
                {Math.round(agent.energy * 100)}%
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-oc-bg overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${agent.energy * 100}%`,
                  backgroundColor:
                    agent.energy > 0.5
                      ? "#059669"
                      : agent.energy > 0.2
                      ? "#F59E0B"
                      : "#DC2626",
                }}
              />
            </div>
          </div>

          {/* Current thought */}
          {agent.currentThought && (
            <div className="mb-4 bg-oc-bg rounded-oc-sm px-3 py-2.5">
              <div className="flex items-center gap-1.5 mb-1">
                <Clock size={10} className="text-oc-text-muted" />
                <span className="text-[9px] uppercase tracking-wider text-oc-text-muted font-medium">
                  Current Thought
                </span>
              </div>
              <p className="text-[11px] text-oc-text leading-relaxed italic">
                &ldquo;{agent.currentThought}&rdquo;
              </p>
            </div>
          )}

          {/* Recent memories */}
          {memories.length > 0 && (
            <div className="mb-4">
              <span className="text-[9px] uppercase tracking-wider text-oc-text-muted font-medium">
                Recent Memory
              </span>
              <div className="mt-1.5 space-y-1">
                {memories.slice(0, 3).map((mem, i) => (
                  <p
                    key={i}
                    className="text-[10px] text-oc-text-secondary leading-snug pl-2 border-l-2 border-oc-border"
                  >
                    {mem.length > 80 ? mem.slice(0, 77) + "..." : mem}
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* Action button */}
          <Link
            href="/chat"
            className="flex items-center justify-center gap-1.5 w-full py-2 rounded-oc-sm text-[12px] font-semibold transition-colors"
            style={{
              backgroundColor: agentColor + "12",
              color: agentColor,
            }}
          >
            <MessageSquare size={12} />
            Open DM
          </Link>
        </div>
      </div>
    </div>
  );
}
