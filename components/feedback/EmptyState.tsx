import type { ReactNode } from "react";
import { cn } from "../cn";
import { Icon, type IconName } from "../core/Icon";

/**
 * Ported from the design system's `EmptyState.jsx`.
 *
 * The design system's rule for empty copy: two lines, the fact then the one
 * thing to do — "Fila vazia · Nenhum documento aguardando conferência."
 */
export interface EmptyStateProps {
  icon?: IconName;
  title: string;
  body?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ icon = "inbox", title, body, action, className }: EmptyStateProps) {
  return (
    <div className={cn("grid justify-items-center gap-3 px-6 py-12 text-center", className)}>
      <span className="grid h-13 w-13 place-items-center rounded-pill border border-line-strong bg-accent">
        <Icon name={icon} size={24} strokeWidth={1.75} />
      </span>
      <h3 className="type-display-3">{title}</h3>
      {body && <p className="type-body max-w-[42ch] text-muted">{body}</p>}
      {action}
    </div>
  );
}
