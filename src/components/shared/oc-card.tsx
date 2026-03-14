import { cn } from "@/lib/utils";

interface OcCardProps {
  children: React.ReactNode;
  className?: string;
}

export function OcCard({ children, className }: OcCardProps) {
  return (
    <div
      className={cn(
        "bg-oc-card border border-oc-border rounded-oc p-[20px_22px]",
        className
      )}
    >
      {children}
    </div>
  );
}
