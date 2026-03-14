import { cn } from "@/lib/utils";

type StatusType = "active" | "idle" | "error" | "offline" | "connected" | "disconnected" | "posting" | "monitoring";

const statusColors: Record<StatusType, string> = {
  active: "bg-oc-green",
  idle: "bg-oc-amber",
  error: "bg-oc-red",
  offline: "bg-oc-text-muted",
  connected: "bg-oc-green",
  disconnected: "bg-oc-text-muted",
  posting: "bg-oc-blue",
  monitoring: "bg-oc-teal",
};

const glowStatuses: StatusType[] = ["active", "connected", "posting"];

export function StatusDot({ status }: { status: StatusType }) {
  return (
    <span
      className={cn(
        "inline-block w-[7px] h-[7px] rounded-full mr-1.5 shrink-0",
        statusColors[status] || "bg-oc-text-muted",
        glowStatuses.includes(status) && "status-glow-green"
      )}
    />
  );
}
