interface SparklineProps {
  data: number[];
  color?: string;
  width?: number;
  height?: number;
}

export function Sparkline({
  data,
  color = "#2563EB",
  width = 80,
  height = 28,
}: SparklineProps) {
  if (!data.length) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const xScale = data.length > 1 ? data.length - 1 : 1;
  const points = data
    .map(
      (v, i) =>
        `${(i / xScale) * width},${
          height - ((v - min) / range) * (height - 4) - 2
        }`
    )
    .join(" ");

  return (
    <svg width={width} height={height} className="block">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
