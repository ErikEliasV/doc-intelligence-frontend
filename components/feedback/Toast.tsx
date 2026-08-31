import type { ReactNode } from "react";
import { cn } from "../cn";
import { Icon, type IconName } from "../core/Icon";

/** Ported from the design system's `Toast.jsx`. */
const TONES = {
  info: { surface: "bg-inverse text-on-inverse", icon: "info" },
  success: { surface: "bg-olive-600 text-cream-50", icon: "check" },
  error: { surface: "bg-red-600 text-cream-50", icon: "alert-triangle" },
} as const satisfies Record<string, { surface: string; icon: IconName }>;

export type ToastTone = keyof typeof TONES;

export interface ToastProps {
  tone?: ToastTone;
  children?: ReactNode;
  onClose?: () => void;
  className?: string;
}

export function Toast({ tone = "info", children, onClose, className }: ToastProps) {
  const { surface, icon } = TONES[tone];

  return (
    <div
      role="status"
      className={cn(
        "inline-flex items-center gap-3 border border-line-strong px-4 py-3",
        "type-body-sm shadow-hard-sm",
        surface,
        className,
      )}
    >
      <Icon name={icon} size={15} />
      <span>{children}</span>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar"
          className="grid cursor-pointer place-items-center border-0 bg-transparent text-inherit opacity-70 hover:opacity-100"
        >
          <Icon name="x" size={14} />
        </button>
      )}
    </div>
  );
}
