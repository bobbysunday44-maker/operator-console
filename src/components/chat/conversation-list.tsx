"use client";

interface ConversationSummary {
  id: string;
  title: string | null;
  source: string;
  messageCount: number;
  lastMessage: string | null;
  updatedAt: string;
}

function timeAgo(ts: string): string {
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

export function ConversationList({
  conversations,
  activeId,
  onSelect,
  onNew,
}: {
  conversations: ConversationSummary[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
}) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-3" style={{ padding: "0 2px" }}>
        <span className="text-small font-bold text-oc-text">Conversations</span>
        <button onClick={onNew} className="text-tiny font-semibold text-oc-blue bg-oc-blue-light border-none rounded-[6px] px-2.5 py-1 cursor-pointer hover:opacity-80 transition-opacity">
          + New
        </button>
      </div>
      <div className="flex-1 overflow-y-auto flex flex-col gap-1">
        {conversations.length === 0 ? (
          <div className="text-tiny text-oc-text-muted text-center py-8">No conversations yet</div>
        ) : (
          conversations.map((c) => (
            <button
              key={c.id}
              onClick={() => onSelect(c.id)}
              className={`w-full text-left rounded-oc-sm transition-all duration-150 border ${
                activeId === c.id ? "bg-oc-blue-light border-oc-blue/20" : "bg-transparent border-transparent hover:bg-oc-bg"
              }`}
              style={{ padding: "10px 12px" }}
            >
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="text-[10px]">{c.source === "telegram" ? "📱" : "💬"}</span>
                <span className="text-small font-semibold text-oc-text truncate flex-1">{c.title || "Untitled"}</span>
                <span className="text-[9px] text-oc-text-muted font-mono shrink-0">{timeAgo(c.updatedAt)}</span>
              </div>
              {c.lastMessage && (
                <div className="text-tiny text-oc-text-secondary truncate pl-[18px]">{c.lastMessage}</div>
              )}
            </button>
          ))
        )}
      </div>
    </div>
  );
}
