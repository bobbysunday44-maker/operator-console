import { useState, useEffect } from "react";

// ─── DESIGN SYSTEM ───
const C = {
  bg: "#FAFAF8", card: "#FFFFFF", border: "#E6E3DC", borderLight: "#F0EDE6",
  text: "#18181B", sub: "#65635D", muted: "#A09B94",
  blue: "#2563EB", blueLight: "#EFF4FF", blueSoft: "#DBEAFE",
  green: "#059669", greenLight: "#ECFDF5",
  amber: "#D97706", amberLight: "#FFFBEB",
  red: "#DC2626", redLight: "#FEF2F2",
  purple: "#7C3AED", purpleLight: "#F5F3FF",
  teal: "#0D9488", tealLight: "#F0FDFA",
  pink: "#DB2777", pinkLight: "#FDF2F8",
};
const font = "'Geist', 'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif";
const mono = "'GeistMono', 'JetBrains Mono', 'SF Mono', monospace";

// ─── MOCK PIPELINE DATA ───
const PIPELINE_STAGES = [
  {
    id: "prompt",
    label: "Prompt Writer",
    icon: "✍️",
    agent: "Claude Sonnet",
    status: "complete",
    duration: "2.1s",
    cost: "$0.003",
    input: "Create a TikTok post about AI agents automating social media. Trendy, Gen-Z tone, hook in first 2 seconds.",
    output: 'Image prompt: "A sleek robot hand scrolling through a phone showing Instagram, TikTok, Twitter feeds. Neon glow, dark background, cinematic lighting, 8K detail."\n\nVideo prompt: "Camera slowly zooms into a phone screen where AI agents are posting content autonomously. Glitch effects, fast cuts, trending audio vibe."\n\nCaption: "POV: your AI agent just posted to 6 platforms while you were sleeping 🤖✨ #AIautomation #ContentCreator"',
    tokens: { in: 124, out: 287 },
  },
  {
    id: "image",
    label: "Image Generation",
    icon: "🎨",
    agent: "Gemini Nano Banana 2",
    status: "complete",
    duration: "4.8s",
    cost: "$0.002",
    input: "A sleek robot hand scrolling through a phone showing Instagram, TikTok, Twitter feeds. Neon glow, dark background, cinematic lighting, 8K detail.",
    output: "GENERATED_IMAGE",
    resolution: "1024 × 1024",
    model: "gemini-3.1-flash-image-preview",
  },
  {
    id: "video",
    label: "Video Generation",
    icon: "🎬",
    agent: "Gemini Veo 3.1",
    status: "running",
    duration: "~45s",
    cost: "~$0.05",
    input: "Camera slowly zooms into a phone screen where AI agents are posting content autonomously. Glitch effects, fast cuts, trending audio vibe.",
    output: null,
    progress: 67,
    resolution: "1080p · 8 seconds",
    model: "veo-3.1-generate-preview",
    refImages: 1,
  },
  {
    id: "voiceover",
    label: "Voiceover",
    icon: "🎙️",
    agent: "edge-tts",
    status: "queued",
    duration: "—",
    cost: "Free",
    input: "POV: your AI agent just posted to 6 platforms while you were sleeping. Imagine waking up to thousands of new followers...",
    output: null,
    voice: "en-US-GuyNeural",
  },
  {
    id: "assembly",
    label: "Final Assembly",
    icon: "🔧",
    agent: "FFmpeg",
    status: "queued",
    duration: "—",
    cost: "Free",
    input: "Combine: video clip + voiceover + background music (30% volume) → vertical 9:16 MP4",
    output: null,
  },
];

const CHARACTER_REFS = [
  { name: "Nova", desc: "Robot assistant with blue LED eyes", img: "🤖" },
  { name: "Alex", desc: "Young creator, streetwear style", img: "🧑" },
];

// ─── COMPONENTS ───

function Badge({ text, color, bg }) {
  return (
    <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20, backgroundColor: bg, color, letterSpacing: "0.03em", textTransform: "uppercase", whiteSpace: "nowrap" }}>{text}</span>
  );
}

function StatusBadge({ status }) {
  const map = {
    complete: { text: "Complete", color: C.green, bg: C.greenLight },
    running: { text: "Running", color: C.blue, bg: C.blueLight },
    queued: { text: "Queued", color: C.muted, bg: C.borderLight },
    failed: { text: "Failed", color: C.red, bg: C.redLight },
  };
  const s = map[status] || map.queued;
  return <Badge text={s.text} color={s.color} bg={s.bg} />;
}

function ProgressBar({ value, color = C.blue }) {
  return (
    <div style={{ width: "100%", height: 4, backgroundColor: C.borderLight, borderRadius: 4, overflow: "hidden" }}>
      <div style={{ width: `${value}%`, height: "100%", backgroundColor: color, borderRadius: 4, transition: "width 1s ease" }} />
    </div>
  );
}

function ImagePlaceholder({ size = 200 }) {
  return (
    <div style={{
      width: "100%", maxWidth: size, aspectRatio: "1", borderRadius: 10,
      background: `linear-gradient(135deg, #1a1a2e 0%, #16213e 30%, #0f3460 60%, #533483 100%)`,
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      position: "relative", overflow: "hidden",
    }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, background: "radial-gradient(circle at 30% 40%, rgba(37,99,235,0.3) 0%, transparent 60%)" }} />
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, background: "radial-gradient(circle at 70% 70%, rgba(124,58,237,0.2) 0%, transparent 50%)" }} />
      <span style={{ fontSize: 40, position: "relative", zIndex: 1 }}>🤖📱</span>
      <span style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", marginTop: 8, fontFamily: mono, position: "relative", zIndex: 1 }}>1024 × 1024</span>
      <span style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", marginTop: 2, fontFamily: mono, position: "relative", zIndex: 1 }}>Nano Banana 2</span>
    </div>
  );
}

function VideoPlaceholder({ progress = 67 }) {
  return (
    <div style={{
      width: "100%", maxWidth: 280, aspectRatio: "16/9", borderRadius: 10,
      background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      position: "relative", overflow: "hidden",
    }}>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{
          width: 48, height: 48, borderRadius: "50%",
          border: "3px solid rgba(255,255,255,0.15)",
          borderTopColor: C.blue,
          animation: "spin 1s linear infinite",
        }} />
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <span style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", fontFamily: mono, position: "relative", zIndex: 1, marginTop: 36 }}>{progress}% · Generating...</span>
      <span style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", marginTop: 4, fontFamily: mono, position: "relative", zIndex: 1 }}>1080p · 8s · Veo 3.1</span>
    </div>
  );
}

function StageCard({ stage, isActive, onClick }) {
  const isComplete = stage.status === "complete";
  const isRunning = stage.status === "running";
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center", gap: 12, padding: "14px 16px",
        backgroundColor: isActive ? C.blueLight : C.card,
        border: `1.5px solid ${isActive ? C.blue : C.border}`,
        borderRadius: 12, cursor: "pointer", fontFamily: font, textAlign: "left",
        width: "100%", transition: "all 0.15s ease", position: "relative",
        boxShadow: isActive ? "0 2px 8px rgba(37,99,235,0.08)" : "none",
      }}
    >
      {/* Connector line */}
      <div style={{
        position: "absolute", left: 28, top: -16, width: 2, height: 16,
        backgroundColor: isComplete ? C.green : C.borderLight,
        display: stage.id === "prompt" ? "none" : "block",
      }} />

      {/* Status circle */}
      <div style={{
        width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
        backgroundColor: isComplete ? C.greenLight : isRunning ? C.blueLight : C.borderLight,
        border: `2px solid ${isComplete ? C.green : isRunning ? C.blue : C.border}`,
        display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16,
      }}>
        {isComplete ? "✓" : stage.icon}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{stage.label}</span>
          <StatusBadge status={stage.status} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 3 }}>
          <span style={{ fontSize: 11, color: C.sub, fontFamily: font }}>{stage.agent}</span>
          <span style={{ fontSize: 10, color: C.muted, fontFamily: mono }}>{stage.duration}</span>
          {stage.cost && <span style={{ fontSize: 10, color: C.muted, fontFamily: mono }}>{stage.cost}</span>}
        </div>
        {isRunning && stage.progress && (
          <div style={{ marginTop: 6 }}>
            <ProgressBar value={stage.progress} />
          </div>
        )}
      </div>

      <span style={{ fontSize: 14, color: C.muted }}>→</span>
    </button>
  );
}

function DetailPanel({ stage }) {
  if (!stage) return null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 24 }}>{stage.icon}</span>
        <div>
          <div style={{ fontSize: 17, fontWeight: 700, color: C.text, fontFamily: font }}>{stage.label}</div>
          <div style={{ fontSize: 12, color: C.sub }}>{stage.agent}</div>
        </div>
        <div style={{ marginLeft: "auto" }}><StatusBadge status={stage.status} /></div>
      </div>

      {/* Stats row */}
      <div style={{ display: "flex", gap: 8 }}>
        {[
          { label: "Duration", value: stage.duration },
          { label: "Cost", value: stage.cost || "Free" },
          stage.resolution && { label: "Output", value: stage.resolution },
          stage.model && { label: "Model", value: stage.model },
          stage.voice && { label: "Voice", value: stage.voice },
          stage.tokens && { label: "Tokens", value: `${stage.tokens.in} → ${stage.tokens.out}` },
          stage.refImages && { label: "Ref Images", value: stage.refImages },
        ].filter(Boolean).map((s, i) => (
          <div key={i} style={{ padding: "8px 12px", backgroundColor: C.bg, borderRadius: 8, flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 9, color: C.muted, textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600, marginBottom: 2 }}>{s.label}</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: C.text, fontFamily: mono, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Input */}
      <div>
        <div style={{ fontSize: 11, fontWeight: 600, color: C.muted, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Input Prompt</div>
        <div style={{
          padding: "12px 14px", backgroundColor: C.bg, borderRadius: 10, border: `1px solid ${C.borderLight}`,
          fontSize: 12.5, color: C.text, fontFamily: font, lineHeight: 1.6, whiteSpace: "pre-wrap",
        }}>
          {stage.input}
        </div>
      </div>

      {/* Output */}
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: C.muted, textTransform: "uppercase", letterSpacing: "0.05em" }}>Output</div>
          {stage.status === "complete" && (
            <div style={{ display: "flex", gap: 6 }}>
              <button style={{ fontSize: 10, fontWeight: 600, color: C.blue, backgroundColor: C.blueLight, border: "none", borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontFamily: font }}>Regenerate</button>
              <button style={{ fontSize: 10, fontWeight: 600, color: C.sub, backgroundColor: C.bg, border: `1px solid ${C.border}`, borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontFamily: font }}>Edit Prompt</button>
              <button style={{ fontSize: 10, fontWeight: 600, color: C.sub, backgroundColor: C.bg, border: `1px solid ${C.border}`, borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontFamily: font }}>Download</button>
            </div>
          )}
        </div>

        {stage.output === "GENERATED_IMAGE" ? (
          <ImagePlaceholder size={320} />
        ) : stage.id === "video" && stage.status === "running" ? (
          <VideoPlaceholder progress={stage.progress} />
        ) : stage.output ? (
          <div style={{
            padding: "12px 14px", backgroundColor: "#1a1a2e", borderRadius: 10,
            fontSize: 12.5, color: "#e2e8f0", fontFamily: mono, lineHeight: 1.6, whiteSpace: "pre-wrap",
          }}>
            {stage.output}
          </div>
        ) : (
          <div style={{ padding: "20px", backgroundColor: C.bg, borderRadius: 10, textAlign: "center" }}>
            <span style={{ fontSize: 12, color: C.muted }}>Waiting for previous step to complete...</span>
          </div>
        )}
      </div>

      {/* Actions for running stage */}
      {stage.status === "running" && (
        <div style={{ display: "flex", gap: 8 }}>
          <button style={{ flex: 1, fontSize: 12, fontWeight: 600, color: C.amber, backgroundColor: C.amberLight, border: "none", borderRadius: 8, padding: "10px", cursor: "pointer", fontFamily: font }}>⏸ Pause</button>
          <button style={{ flex: 1, fontSize: 12, fontWeight: 600, color: C.red, backgroundColor: C.redLight, border: "none", borderRadius: 8, padding: "10px", cursor: "pointer", fontFamily: font }}>✕ Cancel</button>
        </div>
      )}
    </div>
  );
}

// ─── MAIN ───
export default function CreationStudio() {
  const [activeStage, setActiveStage] = useState("image");
  const [progress, setProgress] = useState(67);

  useEffect(() => {
    const t = setInterval(() => {
      setProgress(p => p >= 95 ? 67 : p + 1);
    }, 800);
    return () => clearInterval(t);
  }, []);

  const stages = PIPELINE_STAGES.map(s =>
    s.id === "video" ? { ...s, progress } : s
  );
  const activeData = stages.find(s => s.id === activeStage);

  return (
    <div style={{ fontFamily: font, backgroundColor: C.bg, minHeight: "100vh", color: C.text, display: "flex" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet" />

      {/* ─── LEFT: Pipeline Steps ─── */}
      <div style={{ width: 340, borderRight: `1px solid ${C.border}`, padding: "20px 16px", display: "flex", flexDirection: "column", gap: 0, overflowY: "auto", height: "100vh", flexShrink: 0 }}>
        {/* Header */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: C.text, letterSpacing: "-0.02em" }}>Creation Studio</span>
            <Badge text="Live" color={C.green} bg={C.greenLight} />
          </div>
          <div style={{ fontSize: 11, color: C.muted }}>TikTok · AI Agents Post · Mar 11, 2026</div>
        </div>

        {/* Content item info */}
        <div style={{
          padding: "12px 14px", backgroundColor: C.card, border: `1px solid ${C.border}`,
          borderRadius: 10, marginBottom: 20,
        }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 4 }}>AI Agents Automate Your Social Media</div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {["TikTok", "AI", "automation", "trending"].map(tag => (
              <span key={tag} style={{ fontSize: 9, fontWeight: 600, padding: "2px 7px", borderRadius: 4, backgroundColor: C.bg, color: C.sub, border: `1px solid ${C.borderLight}` }}>{tag}</span>
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 8 }}>
            <span style={{ fontSize: 10, color: C.muted }}>Target:</span>
            <Badge text="TikTok" color={C.text} bg={C.borderLight} />
            <Badge text="Instagram" color={C.text} bg={C.borderLight} />
            <Badge text="Twitter" color={C.text} bg={C.borderLight} />
          </div>
        </div>

        {/* Pipeline steps */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {stages.map(stage => (
            <StageCard
              key={stage.id}
              stage={stage}
              isActive={activeStage === stage.id}
              onClick={() => setActiveStage(stage.id)}
            />
          ))}
        </div>

        {/* Pipeline summary */}
        <div style={{
          marginTop: "auto", paddingTop: 16, borderTop: `1px solid ${C.border}`,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ fontSize: 11, color: C.muted }}>Total Progress</span>
            <span style={{ fontSize: 11, fontWeight: 600, color: C.text }}>2 of 5 complete</span>
          </div>
          <ProgressBar value={40} color={C.green} />
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
            <span style={{ fontSize: 10, color: C.muted, fontFamily: mono }}>Est. total: ~55s</span>
            <span style={{ fontSize: 10, color: C.muted, fontFamily: mono }}>Est. cost: ~$0.06</span>
          </div>
        </div>
      </div>

      {/* ─── CENTER: Detail Panel ─── */}
      <div style={{ flex: 1, padding: "20px 28px", overflowY: "auto", height: "100vh" }}>
        <DetailPanel stage={activeData} />

        {/* Character References */}
        {activeData?.id === "video" && (
          <div style={{ marginTop: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: C.muted, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>Character Reference Images</div>
            <div style={{ display: "flex", gap: 10 }}>
              {CHARACTER_REFS.map(ch => (
                <div key={ch.name} style={{
                  padding: "10px 14px", backgroundColor: C.card, border: `1px solid ${C.border}`,
                  borderRadius: 10, display: "flex", alignItems: "center", gap: 10, flex: 1,
                }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 8, backgroundColor: C.purpleLight,
                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20,
                  }}>{ch.img}</div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{ch.name}</div>
                    <div style={{ fontSize: 10, color: C.muted }}>{ch.desc}</div>
                  </div>
                  <Badge text="Active" color={C.purple} bg={C.purpleLight} />
                </div>
              ))}
              <button style={{
                padding: "10px 14px", backgroundColor: C.bg, border: `1px dashed ${C.border}`,
                borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", minWidth: 80, fontFamily: font, fontSize: 12, color: C.muted,
              }}>+ Add</button>
            </div>
          </div>
        )}

        {/* Publish targets */}
        {activeData?.id === "assembly" && (
          <div style={{ marginTop: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: C.muted, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>Publish After Assembly</div>
            <div style={{ display: "flex", gap: 8 }}>
              {[
                { name: "TikTok", handle: "@openclaw_ai", time: "3:00 PM", color: "#000" },
                { name: "Instagram", handle: "@openclaw.ai", time: "3:15 PM", color: "#E4405F" },
                { name: "Twitter/X", handle: "@openclaw_ai", time: "3:30 PM", color: "#000" },
              ].map(p => (
                <div key={p.name} style={{
                  padding: "10px 14px", backgroundColor: C.card, border: `1px solid ${C.border}`,
                  borderRadius: 10, flex: 1,
                }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{p.name}</div>
                  <div style={{ fontSize: 10, color: C.muted, fontFamily: mono }}>{p.handle}</div>
                  <div style={{ fontSize: 10, color: C.blue, fontWeight: 600, marginTop: 4 }}>Scheduled: {p.time}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ─── RIGHT: Sidebar ─── */}
      <div style={{ width: 240, borderLeft: `1px solid ${C.border}`, padding: "20px 16px", display: "flex", flexDirection: "column", gap: 16, overflowY: "auto", height: "100vh", flexShrink: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>Pipeline Info</div>

        {/* Models used */}
        <div>
          <div style={{ fontSize: 10, fontWeight: 600, color: C.muted, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>Models</div>
          {[
            { name: "Claude Sonnet 4.6", type: "Language", color: C.purple, bg: C.purpleLight },
            { name: "Nano Banana 2", type: "Image", color: C.blue, bg: C.blueLight },
            { name: "Veo 3.1", type: "Video", color: C.teal, bg: C.tealLight },
            { name: "edge-tts", type: "Audio", color: C.amber, bg: C.amberLight },
          ].map(m => (
            <div key={m.name} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderBottom: `1px solid ${C.borderLight}` }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: m.color, flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.name}</div>
                <div style={{ fontSize: 9, color: C.muted }}>{m.type}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Cost breakdown */}
        <div>
          <div style={{ fontSize: 10, fontWeight: 600, color: C.muted, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>Cost Breakdown</div>
          <div style={{ padding: "10px 12px", backgroundColor: C.bg, borderRadius: 8 }}>
            {[
              { label: "Prompt Writer", cost: "$0.003" },
              { label: "Image Gen", cost: "$0.002" },
              { label: "Video Gen", cost: "~$0.05" },
              { label: "Voiceover", cost: "Free" },
              { label: "Assembly", cost: "Free" },
            ].map(c => (
              <div key={c.label} style={{ display: "flex", justifyContent: "space-between", padding: "3px 0", fontSize: 11 }}>
                <span style={{ color: C.sub }}>{c.label}</span>
                <span style={{ fontFamily: mono, fontWeight: 600, color: C.text }}>{c.cost}</span>
              </div>
            ))}
            <div style={{ borderTop: `1px solid ${C.border}`, marginTop: 6, paddingTop: 6, display: "flex", justifyContent: "space-between", fontSize: 12 }}>
              <span style={{ fontWeight: 700, color: C.text }}>Total</span>
              <span style={{ fontFamily: mono, fontWeight: 700, color: C.blue }}>~$0.055</span>
            </div>
          </div>
        </div>

        {/* Archive info */}
        <div>
          <div style={{ fontSize: 10, fontWeight: 600, color: C.muted, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>Content Archive</div>
          <div style={{ padding: "10px 12px", backgroundColor: C.bg, borderRadius: 8, fontSize: 11 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ color: C.sub }}>Content ID</span>
              <span style={{ fontFamily: mono, color: C.text }}>CNT-0047</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ color: C.sub }}>Files saved</span>
              <span style={{ fontFamily: mono, color: C.text }}>3 / 5</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: C.sub }}>Archive path</span>
              <span style={{ fontFamily: mono, color: C.muted, fontSize: 9 }}>/archive/CNT-0047/</span>
            </div>
          </div>
        </div>

        {/* Quick actions */}
        <div style={{ marginTop: "auto" }}>
          <button style={{
            width: "100%", padding: "10px", fontSize: 12, fontWeight: 600,
            color: "#fff", backgroundColor: C.text, border: "none", borderRadius: 8,
            cursor: "pointer", fontFamily: font, marginBottom: 8,
          }}>Run Full Pipeline</button>
          <button style={{
            width: "100%", padding: "10px", fontSize: 12, fontWeight: 600,
            color: C.sub, backgroundColor: C.card, border: `1px solid ${C.border}`, borderRadius: 8,
            cursor: "pointer", fontFamily: font,
          }}>Save as Template</button>
        </div>
      </div>
    </div>
  );
}
