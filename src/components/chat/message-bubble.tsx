"use client";

import { OcBadge } from "@/components/shared";
import type { ChatMessage } from "@/lib/chat/types";

export function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";
  const time = new Date(message.timestamp).toLocaleTimeString([], {
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
        {/* Command badge */}
        {message.command?.dispatched && (
          <div className="mb-1.5">
            <OcBadge
              label={`Command: ${message.command.type.replace(/_/g, " ")}`}
              color="#7C3AED"
              bg="#F5F3FF"
            />
          </div>
        )}

        {/* Message content — render markdown-like formatting */}
        <div className={`whitespace-pre-wrap ${isUser ? "" : "text-oc-text"}`}>
          {message.content}
        </div>

        {/* Footer: time + tokens */}
        <div
          className={`flex items-center gap-2 mt-1.5 text-[9px] ${
            isUser ? "text-white/50" : "text-oc-text-muted"
          }`}
        >
          <span>{time}</span>
          {message.model && (
            <span className="font-mono">{message.model}</span>
          )}
          {message.tokens && (
            <span className="font-mono">
              {message.tokens.input}→{message.tokens.output} tok
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
