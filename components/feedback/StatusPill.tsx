import { DocumentStatus, type DocumentStatus as Status } from "@/lib/api/types";
import { cn } from "../cn";
import { Icon, type IconName } from "../core/Icon";

/**
 * Ported from the design system's `StatusPill.jsx`, with one deliberate change:
 * it is keyed by **our** `DocumentStatus` (`recebido`, `processando`, …) rather
 * than the design system's English keys (`received`, `processing`, …).
 *
 * The alternative was a translation layer at every call site, which is a class
 * of bug — a status added to the contract would silently fall through to a
 * default pill. Keying off the contract's own union means TypeScript fails the
 * build instead. The type import is type-only: no runtime coupling to `lib/`.
 */
const STATUS = {
  [DocumentStatus.RECEBIDO]: {
    label: "Recebido",
    icon: "inbox",
    className: "text-status-received-fg bg-status-received-bg",
  },
  [DocumentStatus.PROCESSANDO]: {
    label: "Processando",
    icon: "loader",
    className: "text-status-processing-fg bg-status-processing-bg",
  },
  [DocumentStatus.PRONTO]: {
    label: "Pronto",
    icon: "check",
    className: "text-status-ready-fg bg-status-ready-bg",
  },
  [DocumentStatus.EM_CONFERENCIA]: {
    label: "Em conferência",
    icon: "eye",
    className: "text-status-review-fg bg-status-review-bg",
  },
  [DocumentStatus.ERRO]: {
    label: "Erro",
    icon: "alert-triangle",
    className: "text-status-error-fg bg-status-error-bg",
  },
} as const satisfies Record<Status, { label: string; icon: IconName; className: string }>;

export interface StatusPillProps {
  status: Status;
  /** Overrides the default label. The icon and colours stay tied to `status`. */
  label?: string;
  showIcon?: boolean;
  className?: string;
}

export function StatusPill({ status, label, showIcon = true, className }: StatusPillProps) {
  const s = STATUS[status];

  return (
    <span
      className={cn(
        "type-eyebrow inline-flex h-6 items-center gap-2 rounded-pill px-3 whitespace-nowrap",
        s.className,
        className,
      )}
    >
      {showIcon && <Icon name={s.icon} size={12} />}
      {label ?? s.label}
    </span>
  );
}

/** The pill's label for a status, for use outside the pill (tabs, headings). */
export function rotuloDoStatus(status: Status): string {
  return STATUS[status].label;
}
