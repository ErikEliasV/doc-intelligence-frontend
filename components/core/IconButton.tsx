import type { ButtonHTMLAttributes } from "react";
import { cn } from "../cn";
import { Icon, type IconName } from "./Icon";

/**
 * Ported from the design system's `IconButton.jsx`. Like `Button`, the press
 * is the `active:` variant rather than pointer-event state — see ADR-0010.
 *
 * `label` is required: an icon-only control with no accessible name is unusable
 * with a screen reader, and it doubles as the hover tooltip.
 */
const VARIANTS = {
  outline: "bg-card text-display border-line-strong shadow-hard-sm active:pressed",
  ghost: "bg-transparent text-muted border-transparent shadow-none",
  accent: "bg-accent text-on-accent border-line-strong shadow-hard-sm active:pressed",
} as const;

export type IconButtonVariant = keyof typeof VARIANTS;

export interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  icon: IconName;
  label: string;
  variant?: IconButtonVariant;
  /** Edge length in px. The glyph is sized at ~47% of it, as in the source. */
  size?: number;
}

export function IconButton({
  icon,
  label,
  variant = "outline",
  size = 34,
  className,
  ...rest
}: IconButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      style={{ width: size, height: size }}
      className={cn(
        "inline-grid place-items-center rounded-pill border transition-control",
        "disabled:opacity-45 disabled:cursor-not-allowed not-disabled:cursor-pointer",
        VARIANTS[variant],
        className,
      )}
      {...rest}
    >
      <Icon name={icon} size={Math.round(size * 0.47)} />
    </button>
  );
}
