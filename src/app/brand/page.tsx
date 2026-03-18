"use client";

import { useState, useEffect, useCallback } from "react";
import { OcBadge } from "@/components/shared";
import { Save } from "lucide-react";

interface BrandMemoryItem { id: string; niche: string; category: string; insight: string; confidence: number; source: string; isPositive: boolean; timesValidated: number; }
interface BrandVoiceData { id: string; niche: string; toneDescription: string; vocabulary: string[]; avoidWords: string[]; emojiStyle: string | null; sentenceStyle: string | null; audiencePersona: string | null; }

export default function BrandPage() {
  const [memories, setMemories] = useState<BrandMemoryItem[]>([]);
  const [voice, setVoice] = useState<BrandVoiceData | null>(null);
  const [niche, setNiche] = useState("AI");
  const [tab, setTab] = useState<"memory" | "voice">("memory");
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    const [memRes, voiceRes] = await Promise.all([
      fetch(`/api/brand/memory?niche=${niche}`).then((r) => r.json()).catch(() => ({ memories: [] })),
      fetch(`/api/brand/voice?niche=${niche}`).then((r) => r.json()).catch(() => ({ voice: null })),
    ]);
    setMemories(memRes.memories || []);
    setVoice(voiceRes.voice || null);
  }, [niche]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const saveVoice = async () => {
    if (!voice) return;
    setSaving(true);
    await fetch("/api/brand/voice", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(voice),
    });
    setSaving(false);
  };

  const positive = memories.filter((m) => m.isPositive);
  const negative = memories.filter((m) => !m.isPositive);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="text-page-title text-oc-text">Brand & Memory</span>
          <OcBadge label={`${memories.length} insights`} color="#8B5CF6" bg="#F5F3FF" />
        </div>
        <select value={niche} onChange={(e) => setNiche(e.target.value)} className="text-small px-3 py-1.5 border border-oc-border rounded-oc bg-oc-card text-oc-text">
          <option>AI</option><option>Fitness</option><option>Finance</option>
        </select>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-oc-border">
        {(["memory", "voice"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`pb-2 text-small font-semibold capitalize ${tab === t ? "text-oc-text border-b-2 border-oc-blue" : "text-oc-text-muted"}`}>{t === "memory" ? "Brand Memory" : "Brand Voice"}</button>
        ))}
      </div>

      {tab === "memory" && (
        <div className="grid grid-cols-2 gap-5">
          {/* DO MORE */}
          <div>
            <h3 className="text-small font-semibold text-oc-green mb-3">DO MORE OF ({positive.length})</h3>
            <div className="flex flex-col gap-2">
              {positive.length === 0 && <div className="text-tiny text-oc-text-muted p-4 bg-oc-card border border-oc-border rounded-oc">No positive insights yet. Run content and the system will learn.</div>}
              {positive.map((m) => (
                <div key={m.id} className="p-3 bg-oc-card border border-oc-border rounded-oc">
                  <div className="flex items-center gap-2 mb-1">
                    <OcBadge label={m.category} color="#3B82F6" bg="#EFF6FF" />
                    <span className="text-[9px] font-mono text-oc-text-muted">{Math.round(m.confidence)}% confidence</span>
                  </div>
                  <div className="text-tiny text-oc-text">{m.insight}</div>
                  <div className="text-[9px] text-oc-text-muted mt-1">Source: {m.source} · Validated {m.timesValidated}x</div>
                </div>
              ))}
            </div>
          </div>

          {/* AVOID */}
          <div>
            <h3 className="text-small font-semibold text-red-500 mb-3">AVOID ({negative.length})</h3>
            <div className="flex flex-col gap-2">
              {negative.length === 0 && <div className="text-tiny text-oc-text-muted p-4 bg-oc-card border border-oc-border rounded-oc">No negative insights yet.</div>}
              {negative.map((m) => (
                <div key={m.id} className="p-3 bg-oc-card border border-oc-border rounded-oc border-l-2 border-l-red-300">
                  <div className="flex items-center gap-2 mb-1">
                    <OcBadge label={m.category} color="#EF4444" bg="#FEF2F2" />
                    <span className="text-[9px] font-mono text-oc-text-muted">{Math.round(m.confidence)}% confidence</span>
                  </div>
                  <div className="text-tiny text-oc-text">{m.insight}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === "voice" && voice && (
        <div className="max-w-2xl flex flex-col gap-4">
          <div>
            <label className="text-tiny font-semibold text-oc-text-muted uppercase mb-1 block">Tone Description</label>
            <textarea value={voice.toneDescription} onChange={(e) => setVoice({ ...voice, toneDescription: e.target.value })} rows={3} className="w-full p-3 border border-oc-border rounded-oc text-small text-oc-text bg-oc-card resize-none" />
          </div>
          <div>
            <label className="text-tiny font-semibold text-oc-text-muted uppercase mb-1 block">Words We USE</label>
            <input value={voice.vocabulary.join(", ")} onChange={(e) => setVoice({ ...voice, vocabulary: e.target.value.split(",").map((w) => w.trim()).filter(Boolean) })} className="w-full p-2.5 border border-oc-border rounded-oc text-small text-oc-text bg-oc-card" placeholder="game-changer, lowkey, insane" />
          </div>
          <div>
            <label className="text-tiny font-semibold text-oc-text-muted uppercase mb-1 block">Words We AVOID</label>
            <input value={voice.avoidWords.join(", ")} onChange={(e) => setVoice({ ...voice, avoidWords: e.target.value.split(",").map((w) => w.trim()).filter(Boolean) })} className="w-full p-2.5 border border-oc-border rounded-oc text-small text-oc-text bg-oc-card" placeholder="synergy, leverage, utilize" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-tiny font-semibold text-oc-text-muted uppercase mb-1 block">Emoji Style</label>
              <select value={voice.emojiStyle || "strategic"} onChange={(e) => setVoice({ ...voice, emojiStyle: e.target.value })} className="w-full p-2.5 border border-oc-border rounded-oc text-small text-oc-text bg-oc-card">
                <option>heavy</option><option>strategic</option><option>minimal</option><option>none</option>
              </select>
            </div>
            <div>
              <label className="text-tiny font-semibold text-oc-text-muted uppercase mb-1 block">Sentence Style</label>
              <select value={voice.sentenceStyle || "short punchy"} onChange={(e) => setVoice({ ...voice, sentenceStyle: e.target.value })} className="w-full p-2.5 border border-oc-border rounded-oc text-small text-oc-text bg-oc-card">
                <option>short punchy</option><option>storytelling</option><option>conversational</option><option>professional</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-tiny font-semibold text-oc-text-muted uppercase mb-1 block">Audience Persona</label>
            <textarea value={voice.audiencePersona || ""} onChange={(e) => setVoice({ ...voice, audiencePersona: e.target.value })} rows={2} className="w-full p-3 border border-oc-border rounded-oc text-small text-oc-text bg-oc-card resize-none" placeholder="18-35 year old tech enthusiasts who want to build with AI..." />
          </div>
          <button onClick={saveVoice} disabled={saving} className="flex items-center gap-1.5 px-4 py-2 bg-oc-text text-white rounded-oc text-small font-semibold hover:opacity-90 w-fit">
            <Save className="w-3.5 h-3.5" />{saving ? "Saving..." : "Save Voice"}
          </button>
        </div>
      )}
    </div>
  );
}
