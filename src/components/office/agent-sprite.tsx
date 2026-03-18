"use client";

import { useState, useEffect, useRef } from "react";

// ── Agent color map ──
export const AGENT_COLORS: Record<string, string> = {
  opus: "#1a1a2e",
  ideator: "#8B5CF6",
  writer: "#3B82F6",
  designer: "#F43F5E",
  filmmaker: "#10B981",
  editor: "#F59E0B",
  social: "#06B6D4",
  engage: "#EC4899",
  scanner: "#6366F1",
  outreach: "#EF4444",
};

// ── Status ring colors ──
const STATUS_RING: Record<string, string> = {
  working: "#059669",
  talking: "#2563EB",
  meeting: "#7C3AED",
  idle: "#9C9590",
  thinking: "#F59E0B",
  resting: "#9C9590",
  error: "#DC2626",
};

export interface AgentSpriteData {
  id: string;
  name: string;
  type: string;
  status: string;
  position: string;
  activity: string;
  mood: string;
  energy: number;
  currentThought: string | null;
  talkingTo: string | null;
  lastAction: string | null;
  x: number;
  y: number;
}

interface AgentSpriteProps {
  agent: AgentSpriteData;
  onClick: (agent: AgentSpriteData) => void;
  recentMessage?: string | null;
}

export function AgentSprite({ agent, onClick, recentMessage }: AgentSpriteProps) {
  const [showBubble, setShowBubble] = useState(false);
  const [bubbleText, setBubbleText] = useState<string | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const bubbleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevThoughtRef = useRef<string | null>(null);

  const agentColor = AGENT_COLORS[agent.type] || "#6B7280";
  const ringColor = STATUS_RING[agent.activity] || STATUS_RING.idle;
  const initial = agent.name.charAt(0).toUpperCase();
  const isActive = agent.activity === "working" || agent.activity === "talking" || agent.activity === "meeting";

  // Show speech bubble when thought changes
  useEffect(() => {
    const text = agent.currentThought || recentMessage;
    if (text && text !== prevThoughtRef.current) {
      prevThoughtRef.current = text;
      setBubbleText(text);
      setShowBubble(true);

      if (bubbleTimer.current) clearTimeout(bubbleTimer.current);
      bubbleTimer.current = setTimeout(() => {
        setShowBubble(false);
      }, 5000);
    }

    return () => {
      if (bubbleTimer.current) clearTimeout(bubbleTimer.current);
    };
  }, [agent.currentThought, recentMessage]);

  return (
    <div
      className="absolute cursor-pointer select-none"
      style={{
        left: agent.x,
        top: agent.y,
        transition: "left 1s ease, top 1s ease",
        zIndex: isHovered ? 100 : 10,
        transform: "translate(-50%, -50%)",
      }}
      onClick={() => onClick(agent)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Speech bubble */}
      {(showBubble || isHovered) && bubbleText && (
        <div
          className="absolute left-1/2 bottom-full mb-2 pointer-events-none"
          style={{
            transform: "translateX(-50%) rotateZ(45deg) rotateX(-55deg)",
            zIndex: 200,
          }}
        >
          <div
            className="bg-white rounded-lg px-2.5 py-1.5 text-[10px] text-oc-text leading-tight whitespace-nowrap max-w-[180px] overflow-hidden text-ellipsis"
            style={{
              boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
              animation: showBubble && !isHovered ? "fadeInOut 5s ease forwards" : "none",
              opacity: isHovered ? 1 : undefined,
            }}
          >
            {bubbleText.length > 60 ? bubbleText.slice(0, 57) + "..." : bubbleText}
            {/* Tail */}
            <div
              className="absolute left-1/2 -bottom-1 w-2 h-2 bg-white"
              style={{
                transform: "translateX(-50%) rotate(45deg)",
                boxShadow: "2px 2px 2px rgba(0,0,0,0.05)",
              }}
            />
          </div>
        </div>
      )}

      {/* Status ring */}
      <div
        className="rounded-full flex items-center justify-center"
        style={{
          width: 42,
          height: 42,
          border: `3px solid ${ringColor}`,
          boxShadow: isActive
            ? `0 0 8px ${ringColor}40`
            : "0 1px 3px rgba(0,0,0,0.1)",
          animation: isActive ? "pulse-ring 2s ease-in-out infinite" : undefined,
        }}
      >
        {/* Agent circle */}
        <div
          className="rounded-full flex items-center justify-center text-white font-bold"
          style={{
            width: 34,
            height: 34,
            backgroundColor: agentColor,
            fontSize: 14,
            animation: "breathe 3s ease-in-out infinite",
          }}
        >
          {initial}
        </div>
      </div>

      {/* Name label */}
      <div
        className="absolute left-1/2 mt-1 text-center pointer-events-none"
        style={{
          transform: "translateX(-50%) rotateZ(45deg) rotateX(-55deg)",
          whiteSpace: "nowrap",
        }}
      >
        <span
          className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-white/90"
          style={{
            color: agentColor,
            boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
          }}
        >
          {agent.name}
        </span>
      </div>

      {/* Energy indicator (small bar below name) */}
      <div
        className="absolute left-1/2 pointer-events-none"
        style={{
          transform: "translateX(-50%) rotateZ(45deg) rotateX(-55deg)",
          top: 64,
          width: 28,
        }}
      >
        <div className="w-full h-[3px] rounded-full bg-gray-200 overflow-hidden">
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
    </div>
  );
}
