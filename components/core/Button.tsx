"use client";

import { useState, type ButtonHTMLAttributes, type CSSProperties, type ReactNode } from "react";

/**
 * Ported from the design system's `Button.jsx`. Prop surface unchanged.
 *
 * The press behaviour is the brand's signature interaction: the hard shadow
 * collapses and the control shifts down-right, as if pressed into paper.
 */
const base: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "var(--space-2)",
  font: "var(--type-button)",
  letterSpacing: "var(--tracking-button)",
  textTransform: "uppercase",
  border: "var(--border-width) solid var(--border-strong)",
  borderRadius: "var(--radius-pill)",
  cursor: "pointer",
  transition: "var(--transition-control)",
  textDecoration: "none",
  whiteSpace: "nowrap",
  boxShadow: "var(--shadow-hard-sm)",
};

// Annotated rather than `satisfies`: the values must widen to CSSProperties so
// `variants[variant].boxShadow` type-checks on the entries that omit it.
const sizes: Record<"sm" | "md" | "lg", CSSProperties> = {
  sm: {
    height: "var(--control-height-sm)",
    padding: "0 var(--space-4)",
    fontSize: "var(--size-eyebrow)",
  },
  md: { height: "var(--control-height)", padding: "0 var(--space-5)" },
  lg: { height: "46px", padding: "0 var(--space-6)", fontSize: "var(--size-body-sm)" },
};

const variants: Record<"primary" | "inverse" | "danger" | "outline" | "ghost", CSSProperties> = {
  primary: { background: "var(--surface-accent)", color: "var(--text-on-accent)" },
  inverse: { background: "var(--surface-inverse)", color: "var(--text-on-inverse)" },
  danger: { background: "var(--surface-alert)", color: "var(--text-on-alert)" },
  outline: { background: "transparent", color: "var(--text-display)" },
  ghost: {
    background: "transparent",
    color: "var(--text-muted)",
    border: "var(--border-width) solid transparent",
    boxShadow: "none",
  },
};

export type ButtonVariant = keyof typeof variants;
export type ButtonSize = keyof typeof sizes;

export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "style"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
  full?: boolean;
  style?: CSSProperties;
  children?: ReactNode;
}

export function Button({
  variant = "primary",
  size = "md",
  iconLeft,
  iconRight,
  disabled,
  full,
  style,
  children,
  ...rest
}: ButtonProps) {
  const [down, setDown] = useState(false);

  return (
    <button
      disabled={disabled}
      onPointerDown={() => !disabled && setDown(true)}
      onPointerUp={() => setDown(false)}
      onPointerLeave={() => setDown(false)}
      style={{
        ...base,
        ...sizes[size],
        ...variants[variant],
        width: full ? "100%" : undefined,
        opacity: disabled ? 0.45 : 1,
        cursor: disabled ? "not-allowed" : "pointer",
        boxShadow: down ? "none" : (variants[variant].boxShadow ?? base.boxShadow),
        transform: down ? "translate(var(--press-offset),var(--press-offset))" : "none",
        ...style,
      }}
      {...rest}
    >
      {iconLeft}
      {children}
      {iconRight}
    </button>
  );
}
