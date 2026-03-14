"use client";

import { useState, useRef, useEffect } from "react";

export function ChatInput({
  onSend,
  disabled,
}: {
  onSend: (message: string) => void;
  disabled?: boolean;
}) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 120) + "px";
  }, [value]);

  const handleSend = () => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border-t border-oc-border bg-oc-card" style={{ padding: "12px 16px" }}>
      <div className="flex items-end gap-2">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder='Message Claude... try "Create a TikTok about AI"'
          disabled={disabled}
          rows={1}
          className="flex-1 resize-none border border-oc-border rounded-[10px] bg-oc-bg text-[13px] text-oc-text placeholder:text-oc-text-muted focus:outline-none focus:border-oc-blue transition-colors font-sans"
          style={{ padding: "10px 14px", lineHeight: "1.5" }}
        />
        <button
          onClick={handleSend}
          disabled={!value.trim() || disabled}
          className={`shrink-0 w-9 h-9 rounded-[10px] flex items-center justify-center transition-all ${
            value.trim() && !disabled
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
          Claude Sonnet 4.6
        </span>
        <span className="text-[9px] text-oc-text-muted">
          Shift+Enter for new line
        </span>
      </div>
    </div>
  );
}
