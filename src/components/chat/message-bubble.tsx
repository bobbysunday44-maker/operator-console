"use client";

import type { ChatMessage } from "@/lib/chat/types";

export function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";
  const time = new Date(message.createdAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-3`}>
      <div
        className={`max-w-[75%] rounded-[14px] text-[13px] leading-[1.65] ${
          isUser
            ? "bg-oc-text text-white rounded-br-[4px]"
            : "bg-oc-card border border-oc-border rounded-bl-[4px]"
        }`}
        style={{ padding: "10px 14px" }}
      >
        <div className={`whitespace-pre-wrap ${isUser ? "" : "text-oc-text"}`}>
          {message.content}
        </div>
        <div className={`flex items-center gap-2 mt-1.5 text-[9px] ${isUser ? "text-white/50" : "text-oc-text-muted"}`}>
          <span>{time}</span>
          {message.tokensIn != null && message.tokensOut != null && (
            <span className="font-mono">{message.tokensIn}→{message.tokensOut} tok</span>
          )}
        </div>
      </div>
    </div>
  );
}
