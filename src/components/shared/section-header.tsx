interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  action?: string;
  onAction?: () => void;
}

export function SectionHeader({ title, subtitle, action, onAction }: SectionHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div>
        <h2 className="text-section-title text-oc-text font-bold tracking-[-0.01em] m-0">
          {title}
        </h2>
        {subtitle && (
          <p className="text-small text-oc-text-muted mt-0.5">{subtitle}</p>
        )}
      </div>
      {action && (
        <button
          onClick={onAction}
          className="text-small font-semibold text-oc-blue bg-transparent border border-oc-border rounded-oc-sm px-3.5 py-1.5 cursor-pointer hover:bg-oc-blue-light transition-colors duration-hover"
        >
          {action}
        </button>
      )}
    </div>
  );
}
