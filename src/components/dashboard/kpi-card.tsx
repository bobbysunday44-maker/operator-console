import { OcCard } from "@/components/shared/oc-card";
import { Sparkline } from "@/components/shared/sparkline";

interface KPICardProps {
  label: string;
  value: string;
  change: string;
  changeType: "up" | "down";
  sparkData?: number[];
  icon: string;
}

export function KPICard({ label, value, change, changeType, sparkData, icon }: KPICardProps) {
  const isUp = changeType === "up";
  return (
    <OcCard>
      <div className="flex items-center justify-between">
        <span className="text-card-label text-oc-text-muted uppercase tracking-[0.06em]">
          {label}
        </span>
        <span className="text-[15px] opacity-35">{icon}</span>
      </div>
      <div className="flex items-end justify-between mt-2.5">
        <div>
          <div className="text-kpi-value text-oc-text leading-none">
            {value}
          </div>
          <div className={`mt-[5px] text-[11px] font-medium ${isUp ? "text-oc-green" : "text-oc-red"}`}>
            {isUp ? "↑" : "↓"} {change}{" "}
            <span className="text-oc-text-muted ml-[3px]">vs 24h</span>
          </div>
        </div>
        {sparkData && (
          <Sparkline
            data={sparkData}
            color={isUp ? "#059669" : "#DC2626"}
          />
        )}
      </div>
    </OcCard>
  );
}
