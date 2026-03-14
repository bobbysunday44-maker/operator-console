import { cn } from "@/lib/utils";

interface OcBadgeProps {
  label: string;
  color: string;
  bg: string;
  className?: string;
}

export function OcBadge({ label, color, bg, className }: OcBadgeProps) {
  return (
    <span
      className={cn(
        "text-[10px] font-bold px-2 py-[2px] rounded-oc-pill uppercase tracking-[0.02em] whitespace-nowrap",
        className
      )}
      style={{ color, backgroundColor: bg }}
    >
      {label}
    </span>
  );
}

// Preset badge variants
export function StatusBadge({ status }: { status: "active" | "idle" | "error" | "offline" | "complete" | "running" | "queued" | "failed" }) {
  const map: Record<string, { label: string; color: string; bg: string }> = {
    active: { label: "Active", color: "#059669", bg: "#ECFDF5" },
    idle: { label: "Idle", color: "#D97706", bg: "#FFFBEB" },
    error: { label: "Error", color: "#DC2626", bg: "#FEF2F2" },
    offline: { label: "Offline", color: "#9C9590", bg: "#F0EDE6" },
    complete: { label: "Complete", color: "#059669", bg: "#ECFDF5" },
    running: { label: "Running", color: "#2563EB", bg: "#EFF4FF" },
    queued: { label: "Queued", color: "#9C9590", bg: "#F0EDE6" },
    failed: { label: "Failed", color: "#DC2626", bg: "#FEF2F2" },
  };
  const s = map[status] || map.offline;
  return <OcBadge label={s.label} color={s.color} bg={s.bg} />;
}

export function ModelBadge({ model }: { model: "claude" | "gemini" | "kling" | "edge-tts" | "ffmpeg" }) {
  const map: Record<string, { label: string; color: string; bg: string }> = {
    claude: { label: "Claude", color: "#7C3AED", bg: "#F5F3FF" },
    gemini: { label: "Gemini", color: "#2563EB", bg: "#EFF4FF" },
    kling: { label: "Kling", color: "#DB2777", bg: "#FDF2F8" },
    "edge-tts": { label: "edge-tts", color: "#D97706", bg: "#FFFBEB" },
    ffmpeg: { label: "FFmpeg", color: "#0D9488", bg: "#F0FDFA" },
  };
  const s = map[model] || { label: model, color: "#9C9590", bg: "#F0EDE6" };
  return <OcBadge label={s.label} color={s.color} bg={s.bg} />;
}
