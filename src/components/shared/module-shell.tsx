import { OcCard } from "./oc-card";
import { SectionHeader } from "./section-header";

interface ModuleShellProps {
  title: string;
  subtitle: string;
  phase: number;
  description: string;
}

export function ModuleShell({ title, subtitle, phase, description }: ModuleShellProps) {
  return (
    <>
      <SectionHeader title={title} subtitle={subtitle} />
      <OcCard>
        <div className="text-center py-16">
          <div className="text-[40px] mb-3 opacity-20">🔧</div>
          <div className="text-section-title text-oc-text mb-2">{title}</div>
          <p className="text-small text-oc-text-secondary max-w-md mx-auto mb-4">
            {description}
          </p>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-oc-blue-light rounded-oc-pill">
            <span className="text-tiny font-bold text-oc-blue uppercase tracking-[0.03em]">
              Coming in Phase {phase}
            </span>
          </div>
        </div>
      </OcCard>
    </>
  );
}
