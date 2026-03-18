"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { StatusBar } from "@/components/office/status-bar";
import { OfficeFloor, resolveAgentPosition } from "@/components/office/office-floor";
import { AgentSpriteData } from "@/components/office/agent-sprite";
import { AgentPopup } from "@/components/office/agent-popup";

// ── Types matching the API response ──

interface AgentStateResponse {
  id: string;
  agentId: string;
  position: string;
  activity: string;
  mood: string;
  energy: number;
  currentThought: string | null;
  talkingTo: string | null;
  lastAction: string | null;
  lastActionAt: string | null;
  agent: {
    id: string;
    name: string;
    type: string;
    status: string;
  };
}

interface ChannelMessage {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  createdAt: string;
}

// ── Stable position cache to prevent jitter on re-renders ──
const positionCache = new Map<string, { x: number; y: number }>();

function getStablePosition(agentId: string, agentType: string, position: string): { x: number; y: number } {
  const cacheKey = `${agentId}:${position}`;
  const cached = positionCache.get(cacheKey);
  if (cached) return cached;

  const resolved = resolveAgentPosition(agentType, position);
  positionCache.set(cacheKey, resolved);
  return resolved;
}

export default function OfficePage() {
  const [agents, setAgents] = useState<AgentSpriteData[]>([]);
  const [recentMessages, setRecentMessages] = useState<Record<string, string>>({});
  const [selectedAgent, setSelectedAgent] = useState<AgentSpriteData | null>(null);
  const [agentMemories, setAgentMemories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const chatPollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Fetch agent states ──
  const fetchAgentStates = useCallback(async () => {
    try {
      const res = await fetch("/api/agent-state");
      if (!res.ok) return;
      const data = await res.json();
      const states: AgentStateResponse[] = data.states || [];

      const mapped: AgentSpriteData[] = states.map((s) => {
        const pos = getStablePosition(s.agentId, s.agent.type, s.position);
        return {
          id: s.agentId,
          name: s.agent.name,
          type: s.agent.type,
          status: s.agent.status,
          position: s.position,
          activity: s.activity,
          mood: s.mood,
          energy: s.energy,
          currentThought: s.currentThought,
          talkingTo: s.talkingTo,
          lastAction: s.lastAction,
          x: pos.x,
          y: pos.y,
        };
      });

      setAgents(mapped);
      setIsLoading(false);
    } catch {
      // If API is down, show empty office — no fake agents
      if (isLoading) {
        setAgents([]);
        setIsLoading(false);
      }
    }
  }, [isLoading]);

  // ── Fetch recent chat messages ──
  const fetchRecentChat = useCallback(async () => {
    try {
      const res = await fetch("/api/channels/agent-talk/messages?limit=10");
      if (!res.ok) return;
      const data = await res.json();
      const messages: ChannelMessage[] = data.messages || [];

      // Map last message per sender name
      const msgMap: Record<string, string> = {};
      for (const msg of messages.slice(0, 5)) {
        if (!msgMap[msg.senderName]) {
          msgMap[msg.senderName] = msg.content;
        }
      }
      setRecentMessages(msgMap);
    } catch {
      // Silent fail — chat messages are supplementary
    }
  }, []);

  // ── Fetch memories for selected agent ──
  const fetchAgentMemories = useCallback(async (agentId: string) => {
    try {
      const res = await fetch(`/api/agent-memory?agentId=${agentId}&limit=5`);
      if (!res.ok) return;
      const data = await res.json();
      const memories = (data.memories || []).map(
        (m: { content: string }) => m.content
      );
      setAgentMemories(memories);
    } catch {
      setAgentMemories([]);
    }
  }, []);

  // ── Polling setup ──
  useEffect(() => {
    fetchAgentStates();
    fetchRecentChat();

    pollRef.current = setInterval(fetchAgentStates, 5000);
    chatPollRef.current = setInterval(fetchRecentChat, 10000);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      if (chatPollRef.current) clearInterval(chatPollRef.current);
    };
  }, [fetchAgentStates, fetchRecentChat]);

  // ── Agent click handler ──
  const handleAgentClick = useCallback(
    (agent: AgentSpriteData) => {
      setSelectedAgent(agent);
      fetchAgentMemories(agent.id);
    },
    [fetchAgentMemories]
  );

  // ── Compute status counts ──
  const counts = {
    active: agents.filter(
      (a) => a.activity === "working" || a.activity === "thinking"
    ).length,
    chatting: agents.filter((a) => a.activity === "talking").length,
    meeting: agents.filter((a) => a.activity === "meeting").length,
    idle: agents.filter(
      (a) =>
        a.activity === "idle" || a.activity === "resting"
    ).length,
    total: agents.length,
  };

  return (
    <div className="fixed inset-0 left-[210px] flex flex-col bg-[#F5F3EE]">
      {/* Status bar */}
      <StatusBar counts={counts} />

      {/* Office floor */}
      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div
              className="w-10 h-10 rounded-full border-3 border-oc-border border-t-oc-blue"
              style={{ animation: "spin 1s linear infinite" }}
            />
            <span className="text-[12px] text-oc-text-muted">
              Loading office...
            </span>
          </div>
        </div>
      ) : (
        <OfficeFloor
          agents={agents}
          onAgentClick={handleAgentClick}
          recentMessages={recentMessages}
        />
      )}

      {/* Agent popup */}
      {selectedAgent && (
        <AgentPopup
          agent={selectedAgent}
          memories={agentMemories}
          onClose={() => {
            setSelectedAgent(null);
            setAgentMemories([]);
          }}
        />
      )}

      {/* Ambient floating chat messages (bottom-left overlay) */}
      <RecentChatOverlay messages={recentMessages} />
    </div>
  );
}

// ── Floating chat messages overlay ──

function RecentChatOverlay({
  messages,
}: {
  messages: Record<string, string>;
}) {
  const entries = Object.entries(messages).slice(0, 3);
  if (entries.length === 0) return null;

  return (
    <div className="absolute bottom-4 left-4 z-50 space-y-2 max-w-[280px]">
      {entries.map(([name, content]) => (
        <div
          key={name}
          className="bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 border border-oc-border"
          style={{
            boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
            animation: "slideUp 0.3s ease-out",
          }}
        >
          <span className="text-[10px] font-semibold text-oc-text">
            {name}:
          </span>{" "}
          <span className="text-[10px] text-oc-text-secondary">
            {content.length > 80 ? content.slice(0, 77) + "..." : content}
          </span>
        </div>
      ))}
    </div>
  );
}

// No demo/fake agents — office shows real state only
