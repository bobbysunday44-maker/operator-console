interface ProgressBarProps {
  value: number;
  max?: number;
  color?: string;
  height?: number;
}

export function ProgressBar({
  value,
  max = 100,
  color = "#2563EB",
  height = 5,
}: ProgressBarProps) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div
      className="w-full bg-oc-border-light overflow-hidden"
      style={{ height, borderRadius: height }}
    >
      <div
        className="h-full transition-all duration-progress ease-out"
        style={{
          width: `${pct}%`,
          backgroundColor: color,
          borderRadius: height,
        }}
      />
    </div>
  );
}
