import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "../cn";

/**
 * Ported from the design system's `Button.jsx`.
 *
 * The press is the brand's signature interaction: the hard shadow collapses and
 * the control shifts down-right, as if pressed into paper. The source drives it
 * with `onPointerDown`/`onPointerUp` state; here it is the `active:` variant,
 * which is both less code and more correct — the browser already knows not to
 * apply `:active` to a disabled button, and it survives a pointer that leaves
 * the button mid-press.
 *
 * No state means no `"use client"`: this renders wherever its parent does.
 */
const BASE =
  "inline-flex items-center justify-center gap-2 type-button border border-line-strong " +
  "rounded-pill no-underline whitespace-nowrap transition-control " +
  "disabled:opacity-45 disabled:cursor-not-allowed not-disabled:cursor-pointer";

const SIZES = {
  sm: "h-control-sm px-4 text-[length:var(--size-eyebrow)]",
  md: "h-control px-5",
  // 46px is the design system's own literal — it is not on the 4px scale and
  // has no token.
  lg: "h-[46px] px-6 text-[length:var(--size-body-sm)]",
} as const;

const VARIANTS = {
  primary: "bg-accent text-on-accent shadow-hard-sm active:pressed",
  inverse: "bg-inverse text-on-inverse shadow-hard-sm active:pressed",
  danger: "bg-alert text-on-alert shadow-hard-sm active:pressed",
  outline: "bg-transparent text-display shadow-hard-sm active:pressed",
  // Ghost carries no shadow, so it has nothing to collapse.
  ghost: "bg-transparent text-muted border-transparent shadow-none",
} as const;

export type ButtonVariant = keyof typeof VARIANTS;
export type ButtonSize = keyof typeof SIZES;

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
  full?: boolean;
  children?: ReactNode;
}

export function Button({
  variant = "primary",
  size = "md",
  iconLeft,
  iconRight,
  full,
  className,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={cn(BASE, SIZES[size], VARIANTS[variant], full && "w-full", className)}
      {...rest}
    >
      {iconLeft}
      {children}
      {iconRight}
    </button>
  );
}
