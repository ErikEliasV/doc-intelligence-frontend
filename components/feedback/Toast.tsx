import type { CSSProperties, ReactNode } from "react";
import { Icon, type IconName } from "../core/Icon";

/** Ported from the design system's `Toast.jsx`. Prop surface unchanged. */
const tones = {
  info: {
    background: "var(--surface-inverse)",
    color: "var(--text-on-inverse)",
    icon: "info",
  },
  success: { background: "var(--olive-600)", color: "var(--cream-50)", icon: "check" },
  error: { background: "var(--red-600)", color: "var(--cream-50)", icon: "alert-triangle" },
} satisfies Record<string, { background: string; color: string; icon: IconName }>;

export type ToastTone = keyof typeof tones;

export interface ToastProps {
  tone?: ToastTone;
  children?: ReactNode;
  onClose?: () => void;
  style?: CSSProperties;
}

export function Toast({ tone = "info", children, onClose, style }: ToastProps) {
  const { background, color, icon } = tones[tone];

  return (
    <div
      role="status"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "var(--space-3)",
        padding: "var(--space-3) var(--space-4)",
        background,
        color,
        border: "var(--border-width) solid var(--border-strong)",
        boxShadow: "var(--shadow-hard-sm)",
        font: "var(--type-body-sm)",
        ...style,
      }}
    >
      <Icon name={icon} size={15} light />
      <span>{children}</span>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar"
          style={{
            border: 0,
            background: "transparent",
            color: "inherit",
            cursor: "pointer",
            display: "grid",
            placeItems: "center",
            opacity: 0.7,
          }}
        >
          <Icon name="x" size={14} light />
        </button>
      )}
    </div>
  );
}
