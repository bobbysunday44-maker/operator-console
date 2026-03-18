"use client";

import { useState, useEffect, useRef, useCallback } from "react";

// ── Types ──

interface ChannelInfo {
  id: string;
  name: string;
  description: string | null;
  isDefault: boolean;
  messageCount: number;
  lastMessage: {
    content: string;
    senderName: string;
    createdAt: string;
  } | null;
}

interface AgentInfo {
  id: string;
  name: string;
  type: string;
  status: string;
}

interface ChannelMessage {
  id: string;
  channelId: string;
  senderId: string;
  senderName: string;
  senderType: string;
  content: string;
  mentions: string[];
  replyToId: string | null;
  messageType: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

interface MeetingInfo {
  id: string;
  title: string;
  type: string;
  status: string;
  attendees: string[];
  scheduledAt: string;
  startedAt: string | null;
}

// ── Agent Color Map ──

const AGENT_COLORS: Record<string, string> = {
  ideator: "#8B5CF6",   // violet
  writer: "#2563EB",    // blue
  designer: "#DB2777",  // pink
  filmmaker: "#D97706", // amber
  editor: "#059669",    // emerald
  social: "#0891B2",    // cyan
  engage: "#7C3AED",    // purple
  scanner: "#DC2626",   // red
  outreach: "#EA580C",  // orange
};

function getAgentColor(type: string): string {
  return AGENT_COLORS[type] || "#9C9590";
}

function getSenderInitial(name: string): string {
  return name.charAt(0).toUpperCase();
}

// ── Main Page ──

export default function ChatPage() {
  // State
  const [channels, setChannels] = useState<ChannelInfo[]>([]);
  const [agents, setAgents] = useState<AgentInfo[]>([]);
  const [activeChannel, setActiveChannel] = useState<string>("general");
  const [messages, setMessages] = useState<ChannelMessage[]>([]);
  const [meetings, setMeetings] = useState<MeetingInfo[]>([]);
  const [sending, setSending] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [mentionedAgents, setMentionedAgents] = useState<Set<string>>(new Set());
  const [showNewChannel, setShowNewChannel] = useState(false);
  const [newChannelName, setNewChannelName] = useState("");
  const [isDMView, setIsDMView] = useState(false);
  const [dmTarget, setDmTarget] = useState<AgentInfo | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // ── Data Fetching ──

  const fetchChannels = useCallback(async () => {
    try {
      const res = await fetch("/api/channels");
      const data = await res.json();
      setChannels(data.channels || []);
      setAgents(data.agents || []);
    } catch { /* silently fail */ }
  }, []);

  const fetchMessages = useCallback(async () => {
    if (!activeChannel) return;
    try {
      const res = await fetch(`/api/channels/${encodeURIComponent(activeChannel)}/messages?limit=50`);
      const data = await res.json();
      setMessages(data.messages || []);
    } catch {
      setMessages([]);
    }
  }, [activeChannel]);

  const fetchMeetings = useCallback(async () => {
    try {
      const res = await fetch("/api/meetings");
      const data = await res.json();
      const upcoming = (data.meetings || []).filter(
        (m: MeetingInfo) => m.status === "scheduled" || m.status === "in_progress"
      );
      setMeetings(upcoming);
    } catch { /* silently fail */ }
  }, []);

  // Initial load
  useEffect(() => {
    fetchChannels();
    fetchMeetings();
  }, [fetchChannels, fetchMeetings]);

  // Fetch messages when channel changes
  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Poll for new messages every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchMessages();
    }, 3000);
    return () => clearInterval(interval);
  }, [fetchMessages]);

  // Poll channels + meetings every 15 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchChannels();
      fetchMeetings();
    }, 15000);
    return () => clearInterval(interval);
  }, [fetchChannels, fetchMeetings]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── Actions ──

  const handleSend = async () => {
    const text = inputValue.trim();
    if (!text || sending) return;
    setSending(true);

    // Build content with @mentions from toggle buttons
    let finalContent = text;
    for (const agentId of Array.from(mentionedAgents)) {
      const agent = agents.find((a) => a.id === agentId);
      if (agent && !text.includes(`@${agent.name}`)) {
        finalContent = `@${agent.name} ${finalContent}`;
      }
    }

    try {
      await fetch(`/api/channels/${encodeURIComponent(activeChannel)}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: finalContent,
          senderId: "bobby",
          senderName: "Bobby",
          senderType: "user",
        }),
      });
      setInputValue("");
      setMentionedAgents(new Set());
      // Immediately fetch to show the new message
      await fetchMessages();
    } catch {
      /* silently fail */
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const toggleAgentMention = (agentId: string) => {
    setMentionedAgents((prev) => {
      const next = new Set(prev);
      if (next.has(agentId)) {
        next.delete(agentId);
      } else {
        next.add(agentId);
      }
      return next;
    });
  };

  const selectChannel = (name: string) => {
    setActiveChannel(name);
    setIsDMView(false);
    setDmTarget(null);
  };

  const selectDM = (agent: AgentInfo) => {
    // DM channels use the format dm-{sorted ids}
    const ids = ["bobby", agent.id].sort();
    const dmChannel = `dm-${ids[0]}-${ids[1]}`;
    setActiveChannel(dmChannel);
    setIsDMView(true);
    setDmTarget(agent);
  };

  const createChannel = async () => {
    const name = newChannelName.trim().toLowerCase().replace(/\s+/g, "-");
    if (!name) return;
    try {
      await fetch("/api/channels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      setNewChannelName("");
      setShowNewChannel(false);
      await fetchChannels();
      setActiveChannel(name);
    } catch { /* silently fail */ }
  };

  const startMeeting = async (type: string) => {
    try {
      await fetch("/api/meetings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: type === "adhoc" ? "Ad-hoc Team Meeting" : `${type.charAt(0).toUpperCase() + type.slice(1)}`,
          type,
          scheduledAt: new Date().toISOString(),
          channelName: activeChannel.startsWith("dm-") ? "general" : activeChannel,
        }),
      });
      // Wait a moment then start it
      setTimeout(async () => {
        await fetchMeetings();
        await fetchMessages();
      }, 2000);
    } catch { /* silently fail */ }
  };

  const startScheduledMeeting = async (meetingId: string) => {
    try {
      await fetch(`/api/meetings/${meetingId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "start" }),
      });
      setTimeout(async () => {
        await fetchMeetings();
        await fetchMessages();
      }, 2000);
    } catch { /* silently fail */ }
  };

  // ── Derived State ──

  const activeChannelInfo = channels.find((ch) => ch.name === activeChannel);
  const channelDescription = isDMView && dmTarget
    ? `Direct message with ${dmTarget.name}`
    : activeChannelInfo?.description || "";
  const channelDisplayName = isDMView && dmTarget
    ? dmTarget.name
    : `#${activeChannel}`;

  // Check if any meeting is in progress for this channel
  const activeMeeting = meetings.find(
    (m) => m.status === "in_progress"
  );

  // ── Render ──

  return (
    <div className="flex -my-[22px] -mx-[28px] h-[calc(100vh-44px)]">
      {/* ── LEFT SIDEBAR ── */}
      <div
        className="w-[250px] border-r border-oc-border shrink-0 flex flex-col overflow-hidden bg-oc-card"
      >
        {/* Channels */}
        <div className="flex-1 overflow-y-auto" style={{ padding: "16px 12px" }}>
          <div className="text-[10px] font-bold text-oc-text-muted uppercase tracking-[0.06em] mb-2 px-1">
            Channels
          </div>
          <div className="flex flex-col gap-0.5">
            {channels.map((ch) => (
              <button
                key={ch.id}
                onClick={() => selectChannel(ch.name)}
                className={`w-full text-left rounded-[6px] flex items-center gap-2 transition-all duration-100 ${
                  activeChannel === ch.name && !isDMView
                    ? "bg-oc-blue-light text-oc-blue"
                    : "text-oc-text-secondary hover:bg-oc-bg"
                }`}
                style={{ padding: "6px 8px" }}
              >
                <span className="text-[13px] font-mono opacity-60">#</span>
                <span className="text-[13px] font-medium flex-1 truncate">{ch.name}</span>
                {ch.messageCount > 0 && (
                  <span className="text-[9px] font-bold bg-oc-text-muted text-white rounded-full min-w-[16px] h-[16px] flex items-center justify-center px-1">
                    {ch.messageCount > 99 ? "99+" : ch.messageCount}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* New channel */}
          {showNewChannel ? (
            <div className="mt-2 flex gap-1 px-1">
              <input
                type="text"
                value={newChannelName}
                onChange={(e) => setNewChannelName(e.target.value)}
                placeholder="channel-name"
                className="flex-1 text-[11px] border border-oc-border rounded-[4px] bg-oc-bg text-oc-text px-2 py-1 focus:outline-none focus:border-oc-blue"
                onKeyDown={(e) => e.key === "Enter" && createChannel()}
                autoFocus
              />
              <button
                onClick={createChannel}
                className="text-[10px] font-bold text-oc-blue hover:opacity-80"
              >
                Add
              </button>
              <button
                onClick={() => { setShowNewChannel(false); setNewChannelName(""); }}
                className="text-[10px] text-oc-text-muted hover:opacity-80"
              >
                X
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowNewChannel(true)}
              className="mt-2 w-full text-left text-[11px] text-oc-text-muted hover:text-oc-blue px-2 py-1 transition-colors"
            >
              + New Channel
            </button>
          )}

          {/* Separator */}
          <div className="border-t border-oc-border-light my-3" />

          {/* Direct Messages */}
          <div className="text-[10px] font-bold text-oc-text-muted uppercase tracking-[0.06em] mb-2 px-1">
            Direct Messages
          </div>
          <div className="flex flex-col gap-0.5">
            {agents.map((agent) => (
              <button
                key={agent.id}
                onClick={() => selectDM(agent)}
                className={`w-full text-left rounded-[6px] flex items-center gap-2 transition-all duration-100 ${
                  isDMView && dmTarget?.id === agent.id
                    ? "bg-oc-blue-light text-oc-blue"
                    : "text-oc-text-secondary hover:bg-oc-bg"
                }`}
                style={{ padding: "5px 8px" }}
              >
                {/* Status dot */}
                <span
                  className={`w-[7px] h-[7px] rounded-full shrink-0 ${
                    agent.status === "active"
                      ? "bg-oc-green"
                      : agent.status === "idle"
                      ? "bg-oc-amber"
                      : "bg-oc-text-muted"
                  }`}
                />
                <span className="text-[12px] font-medium flex-1 truncate">{agent.name}</span>
                <span className="text-[9px] text-oc-text-muted capitalize">{agent.type}</span>
              </button>
            ))}
          </div>

          {/* Separator */}
          <div className="border-t border-oc-border-light my-3" />

          {/* Meetings */}
          <div className="text-[10px] font-bold text-oc-text-muted uppercase tracking-[0.06em] mb-2 px-1">
            Meetings
          </div>
          {meetings.length === 0 ? (
            <div className="text-[10px] text-oc-text-muted px-2 py-1">No upcoming meetings</div>
          ) : (
            <div className="flex flex-col gap-1">
              {meetings.map((m) => (
                <div
                  key={m.id}
                  className="bg-oc-bg rounded-[6px] border border-oc-border-light"
                  style={{ padding: "6px 8px" }}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <span
                      className={`w-[6px] h-[6px] rounded-full ${
                        m.status === "in_progress" ? "bg-oc-green status-glow-green" : "bg-oc-amber"
                      }`}
                    />
                    <span className="text-[11px] font-semibold text-oc-text truncate flex-1">
                      {m.title}
                    </span>
                  </div>
                  <div className="text-[9px] text-oc-text-muted mb-1">
                    {m.status === "in_progress"
                      ? "In progress"
                      : formatMeetingTime(m.scheduledAt)}
                  </div>
                  {m.status === "scheduled" && (
                    <button
                      onClick={() => startScheduledMeeting(m.id)}
                      className="text-[9px] font-bold text-oc-blue hover:opacity-80"
                    >
                      Start Now
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Quick meeting buttons */}
          <div className="mt-2 flex flex-wrap gap-1 px-1">
            <button
              onClick={() => startMeeting("standup")}
              className="text-[9px] font-semibold text-oc-text-secondary bg-oc-bg border border-oc-border-light rounded-[4px] px-2 py-1 hover:border-oc-blue hover:text-oc-blue transition-colors"
            >
              Standup
            </button>
            <button
              onClick={() => startMeeting("adhoc")}
              className="text-[9px] font-semibold text-oc-text-secondary bg-oc-bg border border-oc-border-light rounded-[4px] px-2 py-1 hover:border-oc-blue hover:text-oc-blue transition-colors"
            >
              Ad-hoc
            </button>
            <button
              onClick={() => startMeeting("debrief")}
              className="text-[9px] font-semibold text-oc-text-secondary bg-oc-bg border border-oc-border-light rounded-[4px] px-2 py-1 hover:border-oc-blue hover:text-oc-blue transition-colors"
            >
              Debrief
            </button>
          </div>
        </div>
      </div>

      {/* ── MAIN AREA ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* ── TOP BAR: Active Agents ── */}
        <div
          className="border-b border-oc-border bg-oc-card flex items-center gap-1 shrink-0 overflow-x-auto"
          style={{ padding: "8px 16px" }}
        >
          {agents.map((agent) => (
            <button
              key={agent.id}
              onClick={() => selectDM(agent)}
              className="shrink-0 relative group"
              title={`${agent.name} (${agent.status})`}
            >
              <div
                className="w-[28px] h-[28px] rounded-full flex items-center justify-center text-[11px] font-bold text-white transition-transform group-hover:scale-110"
                style={{ backgroundColor: getAgentColor(agent.type) }}
              >
                {getSenderInitial(agent.name)}
              </div>
              <span
                className={`absolute -bottom-0.5 -right-0.5 w-[8px] h-[8px] rounded-full border-2 border-oc-card ${
                  agent.status === "active"
                    ? "bg-oc-green"
                    : agent.status === "idle"
                    ? "bg-oc-amber"
                    : "bg-oc-text-muted"
                }`}
              />
            </button>
          ))}
          <div className="flex-1" />
          <div className="text-[10px] text-oc-text-muted font-mono">
            {agents.filter((a) => a.status === "active").length}/{agents.length} active
          </div>
        </div>

        {/* ── Channel Header ── */}
        <div
          className="border-b border-oc-border flex items-center gap-3 shrink-0"
          style={{ padding: "12px 20px" }}
        >
          <div className="flex-1 min-w-0">
            <div className="text-[15px] font-bold text-oc-text truncate">
              {channelDisplayName}
            </div>
            <div className="text-[11px] text-oc-text-muted truncate">
              {channelDescription}
            </div>
          </div>
          {activeMeeting && (
            <div className="flex items-center gap-1.5 bg-oc-green/10 border border-oc-green/20 rounded-[6px] px-2.5 py-1">
              <span className="w-[6px] h-[6px] rounded-full bg-oc-green status-glow-green" />
              <span className="text-[10px] font-bold text-oc-green">
                {activeMeeting.title}
              </span>
            </div>
          )}
        </div>

        {/* ── Message List ── */}
        <div className="flex-1 overflow-y-auto" style={{ padding: "16px 20px" }}>
          {messages.length === 0 ? (
            <ChannelEmptyState channelName={activeChannel} isDM={isDMView} agentName={dmTarget?.name} />
          ) : (
            <>
              {messages.map((msg) => (
                <MessageRow key={msg.id} message={msg} agents={agents} />
              ))}
              {sending && (
                <div className="flex items-start gap-2.5 mb-3">
                  <div className="w-[30px] h-[30px] rounded-full bg-oc-text flex items-center justify-center text-[12px] font-bold text-white shrink-0">
                    B
                  </div>
                  <div className="bg-oc-bg border border-oc-border rounded-[10px] px-3 py-2">
                    <div className="flex gap-1">
                      <span className="w-1.5 h-1.5 bg-oc-text-muted rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-1.5 h-1.5 bg-oc-text-muted rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-1.5 h-1.5 bg-oc-text-muted rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* ── Input Area ── */}
        <div className="border-t border-oc-border bg-oc-card" style={{ padding: "10px 16px" }}>
          {/* Agent mention toggle buttons */}
          <div className="flex flex-wrap gap-1 mb-2">
            {agents.map((agent) => (
              <button
                key={agent.id}
                onClick={() => toggleAgentMention(agent.id)}
                className={`text-[10px] font-semibold rounded-[4px] px-2 py-0.5 transition-all border ${
                  mentionedAgents.has(agent.id)
                    ? "border-oc-blue bg-oc-blue-light text-oc-blue"
                    : "border-oc-border-light bg-oc-bg text-oc-text-muted hover:border-oc-blue/40"
                }`}
              >
                @{agent.name}
              </button>
            ))}
          </div>

          {/* Text input */}
          <div className="flex items-end gap-2">
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Message ${channelDisplayName}... @agent to mention`}
              disabled={sending}
              rows={1}
              className="flex-1 resize-none border border-oc-border rounded-[10px] bg-oc-bg text-[13px] text-oc-text placeholder:text-oc-text-muted focus:outline-none focus:border-oc-blue transition-colors font-sans"
              style={{ padding: "10px 14px", lineHeight: "1.5", maxHeight: "120px" }}
              onInput={(e) => {
                const el = e.target as HTMLTextAreaElement;
                el.style.height = "auto";
                el.style.height = Math.min(el.scrollHeight, 120) + "px";
              }}
            />
            <button
              onClick={handleSend}
              disabled={!inputValue.trim() || sending}
              className={`shrink-0 w-9 h-9 rounded-[10px] flex items-center justify-center transition-all ${
                inputValue.trim() && !sending
                  ? "bg-oc-text text-white cursor-pointer hover:opacity-90"
                  : "bg-oc-border-light text-oc-text-muted cursor-not-allowed"
              }`}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
          </div>
          <div className="flex items-center gap-3 mt-1.5 pl-1">
            <span className="text-[9px] text-oc-text-muted">
              Shift+Enter for new line
            </span>
            {mentionedAgents.size > 0 && (
              <span className="text-[9px] text-oc-blue font-semibold">
                {mentionedAgents.size} agent{mentionedAgents.size !== 1 ? "s" : ""} mentioned
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Message Row Component ──

function MessageRow({
  message,
  agents,
}: {
  message: ChannelMessage;
  agents: AgentInfo[];
}) {
  const isSystem = message.senderType === "system" || message.messageType === "system";
  const isMeetingMessage =
    message.messageType === "meeting_start" || message.messageType === "meeting_end";
  const isUser = message.senderType === "user";

  const time = new Date(message.createdAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  // System / meeting messages
  if (isSystem || isMeetingMessage) {
    return (
      <div className="flex justify-center mb-3">
        <div
          className={`rounded-[8px] text-[11px] text-center max-w-[80%] ${
            isMeetingMessage
              ? "bg-oc-blue/5 border border-oc-blue/15 text-oc-blue"
              : "bg-oc-bg text-oc-text-muted"
          }`}
          style={{ padding: "8px 16px" }}
        >
          <div className="whitespace-pre-wrap">{renderContent(message.content)}</div>
          <div className="text-[9px] opacity-60 mt-1">{time}</div>
        </div>
      </div>
    );
  }

  // Decision card
  if (message.messageType === "decision_card" && message.metadata) {
    const meta = message.metadata as { choices?: string[]; chosen?: string };
    return (
      <div className="flex items-start gap-2.5 mb-3">
        <SenderAvatar message={message} agents={agents} />
        <div className="flex-1 min-w-0">
          <MessageHeader message={message} time={time} agents={agents} />
          <div className="bg-oc-card border border-oc-border rounded-[10px] mt-1" style={{ padding: "10px 14px" }}>
            <div className="text-[13px] text-oc-text whitespace-pre-wrap mb-2">
              {renderContent(message.content)}
            </div>
            {meta.choices && (
              <div className="flex flex-wrap gap-1.5">
                {meta.choices.map((choice) => (
                  <span
                    key={choice}
                    className={`text-[11px] font-semibold rounded-[6px] px-3 py-1 border ${
                      meta.chosen === choice
                        ? "bg-oc-blue text-white border-oc-blue"
                        : "bg-oc-bg text-oc-text-secondary border-oc-border"
                    }`}
                  >
                    {choice}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Agent color border
  const agentInfo = agents.find((a) => a.id === message.senderId);
  const borderColor = agentInfo ? getAgentColor(agentInfo.type) : undefined;

  return (
    <div className="flex items-start gap-2.5 mb-3">
      <SenderAvatar message={message} agents={agents} />
      <div className="flex-1 min-w-0">
        <MessageHeader message={message} time={time} agents={agents} />
        <div
          className={`rounded-[10px] mt-1 text-[13px] leading-[1.6] ${
            isUser
              ? "bg-oc-text text-white"
              : "bg-oc-card border text-oc-text"
          }`}
          style={{
            padding: "8px 14px",
            borderColor: !isUser ? (borderColor ? `${borderColor}30` : "var(--oc-border)") : undefined,
            borderWidth: !isUser ? "1px" : undefined,
            borderLeftWidth: !isUser && borderColor ? "3px" : undefined,
            borderLeftColor: !isUser && borderColor ? borderColor : undefined,
          }}
        >
          <div className="whitespace-pre-wrap">{renderContent(message.content)}</div>
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ──

function SenderAvatar({
  message,
  agents,
}: {
  message: ChannelMessage;
  agents: AgentInfo[];
}) {
  const agentInfo = agents.find((a) => a.id === message.senderId);
  const isUser = message.senderType === "user";

  const bgColor = isUser
    ? "#1a1a1a"
    : agentInfo
    ? getAgentColor(agentInfo.type)
    : "#9C9590";

  return (
    <div
      className="w-[30px] h-[30px] rounded-full flex items-center justify-center text-[12px] font-bold text-white shrink-0 mt-0.5"
      style={{ backgroundColor: bgColor }}
    >
      {getSenderInitial(message.senderName)}
    </div>
  );
}

function MessageHeader({
  message,
  time,
  agents,
}: {
  message: ChannelMessage;
  time: string;
  agents: AgentInfo[];
}) {
  const agentInfo = agents.find((a) => a.id === message.senderId);
  const isUser = message.senderType === "user";

  return (
    <div className="flex items-baseline gap-2">
      <span
        className="text-[12px] font-bold"
        style={{
          color: isUser
            ? "var(--oc-text)"
            : agentInfo
            ? getAgentColor(agentInfo.type)
            : "var(--oc-text)",
        }}
      >
        {message.senderName}
      </span>
      {agentInfo && (
        <span className="text-[9px] text-oc-text-muted capitalize font-medium">
          {agentInfo.type}
        </span>
      )}
      <span className="text-[9px] text-oc-text-muted">{time}</span>
    </div>
  );
}

/**
 * Render message content with @mention highlighting.
 */
function renderContent(content: string): React.ReactNode {
  // Split on @mentions
  const parts = content.split(/(@\w+(?:\s+\w+)?)/g);
  return parts.map((part, i) => {
    if (part.startsWith("@")) {
      return (
        <span key={i} className="text-oc-blue font-semibold">
          {part}
        </span>
      );
    }
    // Handle **bold** markdown
    const boldParts = part.split(/(\*\*[^*]+\*\*)/g);
    return boldParts.map((bp, j) => {
      if (bp.startsWith("**") && bp.endsWith("**")) {
        return (
          <strong key={`${i}-${j}`} className="font-bold">
            {bp.slice(2, -2)}
          </strong>
        );
      }
      return <span key={`${i}-${j}`}>{bp}</span>;
    });
  });
}

// ── Empty State ──

function ChannelEmptyState({
  channelName,
  isDM,
  agentName,
}: {
  channelName: string;
  isDM: boolean;
  agentName?: string;
}) {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center">
      <div className="text-[40px] mb-3">{isDM ? "💬" : "#"}</div>
      <div className="text-[16px] font-bold text-oc-text mb-1">
        {isDM ? `Start a conversation with ${agentName}` : `Welcome to #${channelName}`}
      </div>
      <div className="text-[12px] text-oc-text-secondary max-w-[360px] leading-[1.6]">
        {isDM
          ? `Send a message to ${agentName}. They'll respond using their personality and expertise.`
          : "This is the start of the channel. Send a message, @mention an agent to get their input, or start a meeting."}
      </div>
      <div className="flex flex-wrap justify-center gap-2 mt-4">
        {isDM
          ? [
              `Hey ${agentName}, what's your status?`,
              `What are you working on?`,
              `Got any updates?`,
            ].map((cmd) => (
              <span
                key={cmd}
                className="text-[11px] font-mono text-oc-text-secondary bg-oc-bg border border-oc-border-light rounded-[8px] px-3 py-1.5 cursor-default"
              >
                {cmd}
              </span>
            ))
          : [
              "@Ideator what's trending?",
              "@Writer draft a script",
              "@Scanner status report",
              "/continue",
            ].map((cmd) => (
              <span
                key={cmd}
                className="text-[11px] font-mono text-oc-text-secondary bg-oc-bg border border-oc-border-light rounded-[8px] px-3 py-1.5 cursor-default"
              >
                {cmd}
              </span>
            ))}
      </div>
    </div>
  );
}

// ── Helpers ──

function formatMeetingTime(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  const time = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  if (isToday) return `Today ${time}`;

  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const isTomorrow =
    date.getDate() === tomorrow.getDate() &&
    date.getMonth() === tomorrow.getMonth() &&
    date.getFullYear() === tomorrow.getFullYear();

  if (isTomorrow) return `Tomorrow ${time}`;

  return `${date.toLocaleDateString([], { weekday: "short" })} ${time}`;
}
