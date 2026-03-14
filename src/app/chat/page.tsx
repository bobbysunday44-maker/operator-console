"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { ConversationList } from "@/components/chat/conversation-list";
import { MessageBubble } from "@/components/chat/message-bubble";
import { ChatInput } from "@/components/chat/chat-input";
import { OcBadge } from "@/components/shared";
import type { ChatMessage } from "@/lib/chat/types";

interface ConversationSummary {
  id: string;
  title: string;
  source: "dashboard" | "telegram";
  messageCount: number;
  lastMessage: string | null;
  updatedAt: number;
}

export default function ChatPage() {
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch conversation list
  const fetchConversations = useCallback(async () => {
    try {
      const res = await fetch("/api/chat/conversations");
      const data = await res.json();
      setConversations(data.conversations || []);
    } catch {
      // silently fail
    }
  }, []);

  // Fetch messages for active conversation
  const fetchMessages = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/chat/conversations/${id}`);
      const data = await res.json();
      setMessages(data.conversation?.messages || []);
    } catch {
      setMessages([]);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // When conversations load, select the first one
  useEffect(() => {
    if (conversations.length > 0 && !activeId) {
      setActiveId(conversations[0].id);
    }
  }, [conversations, activeId]);

  // Fetch messages when active conversation changes
  useEffect(() => {
    if (activeId) {
      fetchMessages(activeId);
    }
  }, [activeId, fetchMessages]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Select conversation
  const handleSelect = (id: string) => {
    setActiveId(id);
  };

  // Create new conversation
  const handleNew = async () => {
    try {
      const res = await fetch("/api/chat/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "New conversation" }),
      });
      const data = await res.json();
      setActiveId(data.conversation.id);
      setMessages([]);
      await fetchConversations();
    } catch {
      // silently fail
    }
  };

  // Send message
  const handleSend = async (text: string) => {
    if (sending) return;
    setSending(true);

    try {
      const res = await fetch("/api/chat/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: activeId,
          message: text,
        }),
      });

      if (!res.ok) {
        console.error("[Chat] Send failed:", res.status);
        setSending(false);
        return;
      }

      const data = await res.json();

      if (!activeId && data.conversationId) {
        setActiveId(data.conversationId);
      }

      // Add both messages to state
      if (data.userMessage && data.assistantMessage) {
        setMessages((prev) => [
          ...prev,
          data.userMessage,
          data.assistantMessage,
        ]);
      }

      // Refresh conversation list to update last message
      await fetchConversations();
    } catch (err) {
      console.error("[Chat] Send error:", err);
      // silently fail
    } finally {
      setSending(false);
    }
  };

  // Active conversation title
  const activeConv = conversations.find((c) => c.id === activeId);

  return (
    <div className="flex -my-[22px] -mx-[28px] h-[calc(100vh-44px)]">
      {/* Left: Conversation List */}
      <div
        className="w-[280px] border-r border-oc-border shrink-0 overflow-y-auto"
        style={{ padding: "20px 14px" }}
      >
        <ConversationList
          conversations={conversations}
          activeId={activeId}
          onSelect={handleSelect}
          onNew={handleNew}
        />

        {/* Telegram Status */}
        <div className="mt-auto pt-4 border-t border-oc-border">
          <div className="text-tiny font-semibold text-oc-text-muted uppercase tracking-[0.05em] mb-2">
            Telegram Bot
          </div>
          <div className="flex items-center gap-2 p-[8px_10px] bg-oc-bg rounded-oc-sm">
            <span className="text-[14px]">📱</span>
            <div className="flex-1 min-w-0">
              <div className="text-tiny font-semibold text-oc-text">@openclaw_bot</div>
              <div className="text-[9px] text-oc-text-muted">Webhook active</div>
            </div>
            <OcBadge label="Live" color="#059669" bg="#ECFDF5" />
          </div>
        </div>
      </div>

      {/* Right: Chat Thread */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Chat Header */}
        <div
          className="border-b border-oc-border flex items-center gap-3 shrink-0"
          style={{ padding: "14px 20px" }}
        >
          <div className="flex-1 min-w-0">
            <div className="text-[15px] font-bold text-oc-text truncate">
              {activeConv?.title || "Chat & Commands"}
            </div>
            <div className="text-tiny text-oc-text-muted">
              Claude Sonnet 4.6 · Natural language commands
            </div>
          </div>
          <OcBadge label="Claude Sonnet" color="#7C3AED" bg="#F5F3FF" />
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto" style={{ padding: "20px 24px" }}>
          {messages.length === 0 ? (
            <EmptyState />
          ) : (
            <>
              {messages.map((msg) => (
                <MessageBubble key={msg.id} message={msg} />
              ))}
              {sending && (
                <div className="flex justify-start mb-3">
                  <div className="bg-oc-card border border-oc-border rounded-[14px] rounded-bl-[4px] px-4 py-3">
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

        {/* Input */}
        <ChatInput onSend={handleSend} disabled={sending} />
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center">
      <div className="text-[48px] mb-3">🤖</div>
      <div className="text-[17px] font-bold text-oc-text mb-1">
        Chat with Claude
      </div>
      <div className="text-small text-oc-text-secondary max-w-[340px] leading-[1.6]">
        Ask questions, create content, or manage your pipeline with natural language commands.
      </div>
      <div className="flex flex-wrap justify-center gap-2 mt-5">
        {[
          "Create a TikTok about AI",
          "How are my agents?",
          "What's the status?",
          "Help",
        ].map((cmd) => (
          <span
            key={cmd}
            className="text-tiny font-mono text-oc-text-secondary bg-oc-bg border border-oc-border-light rounded-[8px] px-3 py-1.5"
          >
            {cmd}
          </span>
        ))}
      </div>
    </div>
  );
}
