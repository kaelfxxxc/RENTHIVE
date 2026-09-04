import { ReactNode } from "react";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      {icon && <div className="w-16 h-16 rounded-2xl bg-[var(--muted)] flex items-center justify-center mb-4 text-[var(--muted-foreground)]">{icon}</div>}
      <h3 className="text-base font-semibold text-[var(--foreground)] mb-1">{title}</h3>
      {description && <p className="text-sm text-[var(--muted-foreground)] max-w-xs mb-4">{description}</p>}
      {action}
    </div>
  );
}
