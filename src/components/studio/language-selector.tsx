"use client";

import { useState, useEffect, useCallback } from "react";

interface SupportedLanguage {
  code: string;
  name: string;
  voiceLang: string;
  speakers: string[];
}

interface TranslationResult {
  id: string;
  title: string;
  lang: string;
}

interface ExistingTranslation {
  id: string;
  title: string;
  langCode: string;
  langName: string;
  status: string;
}

type TranslateStatus = "idle" | "translating" | "done" | "error";

/**
 * LanguageSelector — Translate content into multiple languages.
 *
 * Shows a "Translate" button. When clicked, opens a panel with language
 * checkboxes and a "Translate to Selected" action button.
 *
 * Props:
 *   contentId — the ContentItem ID to translate
 *   onTranslated — optional callback after translations are created
 */
export function LanguageSelector({
  contentId,
  onTranslated,
}: {
  contentId: string;
  onTranslated?: (translations: TranslationResult[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [languages, setLanguages] = useState<SupportedLanguage[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [status, setStatus] = useState<TranslateStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<TranslationResult[]>([]);
  const [existing, setExisting] = useState<ExistingTranslation[]>([]);

  // Fetch supported languages
  const fetchLanguages = useCallback(async () => {
    try {
      const res = await fetch("/api/i18n");
      const data = await res.json();
      setLanguages(data.languages || []);
    } catch {
      console.error("[LanguageSelector] Failed to fetch languages");
    }
  }, []);

  // Fetch existing translations for this content
  const fetchExisting = useCallback(async () => {
    if (!contentId) return;
    try {
      const res = await fetch(`/api/i18n/translate?contentItemId=${contentId}`);
      const data = await res.json();
      setExisting(data.translations || []);
    } catch {
      // silent
    }
  }, [contentId]);

  useEffect(() => {
    if (open) {
      fetchLanguages();
      fetchExisting();
    }
  }, [open, fetchLanguages, fetchExisting]);

  function toggleLang(code: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  }

  function selectAll() {
    // Select all non-English languages (English is typically the source)
    const allCodes = languages.filter((l) => l.code !== "en").map((l) => l.code);
    setSelected(new Set(allCodes));
  }

  function clearAll() {
    setSelected(new Set());
  }

  async function handleTranslate() {
    if (selected.size === 0 || !contentId) return;
    setStatus("translating");
    setError(null);
    setResults([]);

    try {
      const res = await fetch("/api/i18n/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contentItemId: contentId,
          targetLanguages: Array.from(selected),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Translation failed");
      }

      setResults(data.translations || []);
      setStatus("done");
      setSelected(new Set());
      fetchExisting();
      onTranslated?.(data.translations || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Translation failed");
      setStatus("error");
    }
  }

  // Already-translated language codes
  const existingCodes = new Set(existing.map((t) => t.langCode));

  return (
    <div className="relative">
      {/* Trigger Button */}
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-3 py-1.5 text-tiny font-semibold rounded-oc-pill border border-oc-border bg-oc-card text-oc-text-secondary hover:bg-oc-bg hover:text-oc-text transition-colors"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="2" y1="12" x2="22" y2="12" />
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
        Translate
        {existing.length > 0 && (
          <span className="ml-1 px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-oc-purple text-white">
            {existing.length}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-oc-card border border-oc-border rounded-oc-lg shadow-xl z-50">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-oc-border">
            <span className="text-sm font-semibold text-oc-text">Translate Content</span>
            <button
              onClick={() => setOpen(false)}
              className="text-oc-text-muted hover:text-oc-text text-lg leading-none"
            >
              x
            </button>
          </div>

          {/* Language List */}
          <div className="px-4 py-2 max-h-64 overflow-y-auto">
            {/* Select/Clear controls */}
            <div className="flex items-center gap-2 mb-2">
              <button
                onClick={selectAll}
                className="text-[11px] font-medium text-oc-purple hover:underline"
              >
                Select all
              </button>
              <span className="text-oc-text-muted text-[11px]">|</span>
              <button
                onClick={clearAll}
                className="text-[11px] font-medium text-oc-text-muted hover:underline"
              >
                Clear
              </button>
            </div>

            {languages.map((lang) => {
              const alreadyTranslated = existingCodes.has(lang.code);
              return (
                <label
                  key={lang.code}
                  className={`flex items-center gap-3 py-1.5 px-2 rounded cursor-pointer hover:bg-oc-bg/50 ${
                    alreadyTranslated ? "opacity-60" : ""
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selected.has(lang.code)}
                    onChange={() => toggleLang(lang.code)}
                    className="w-3.5 h-3.5 rounded accent-oc-purple"
                  />
                  <div className="flex-1 flex items-center justify-between">
                    <span className="text-sm text-oc-text">
                      {lang.name}
                      <span className="text-oc-text-muted ml-1.5 text-xs">({lang.code})</span>
                    </span>
                    <span className="text-[10px] text-oc-text-muted">
                      {alreadyTranslated ? "translated" : lang.speakers[0]}
                    </span>
                  </div>
                </label>
              );
            })}

            {languages.length === 0 && (
              <p className="text-sm text-oc-text-muted py-4 text-center">Loading languages...</p>
            )}
          </div>

          {/* Existing Translations */}
          {existing.length > 0 && (
            <div className="px-4 py-2 border-t border-oc-border">
              <p className="text-[11px] font-semibold text-oc-text-muted uppercase tracking-wide mb-1.5">
                Existing translations
              </p>
              <div className="flex flex-wrap gap-1">
                {existing.map((t) => (
                  <span
                    key={t.id}
                    className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-oc-bg border border-oc-border text-oc-text-secondary"
                    title={t.title}
                  >
                    {t.langName}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Status messages */}
          {status === "translating" && (
            <div className="px-4 py-2 border-t border-oc-border">
              <p className="text-sm text-oc-purple font-medium flex items-center gap-2">
                <span className="inline-block w-3 h-3 border-2 border-oc-purple border-t-transparent rounded-full animate-spin" />
                Translating into {selected.size} language{selected.size > 1 ? "s" : ""}...
              </p>
            </div>
          )}

          {status === "done" && results.length > 0 && (
            <div className="px-4 py-2 border-t border-oc-border">
              <p className="text-sm text-green-500 font-medium mb-1">
                {results.length} translation{results.length > 1 ? "s" : ""} created
              </p>
              <div className="flex flex-wrap gap-1">
                {results.map((r) => (
                  <span key={r.id} className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/10 text-green-500 border border-green-500/20">
                    {r.lang}
                  </span>
                ))}
              </div>
            </div>
          )}

          {status === "error" && error && (
            <div className="px-4 py-2 border-t border-oc-border">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {/* Action Button */}
          <div className="px-4 py-3 border-t border-oc-border">
            <button
              onClick={handleTranslate}
              disabled={selected.size === 0 || status === "translating"}
              className="w-full py-2 text-sm font-semibold rounded-oc-md transition-colors disabled:opacity-40 disabled:cursor-not-allowed bg-oc-purple text-white hover:bg-oc-purple/90"
            >
              {status === "translating"
                ? "Translating..."
                : selected.size > 0
                  ? `Translate to ${selected.size} language${selected.size > 1 ? "s" : ""}`
                  : "Select languages"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
