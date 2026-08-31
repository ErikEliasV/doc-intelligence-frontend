import type { ReactNode } from "react";
import { cn } from "../cn";

/** Ported from the design system's `Badge.jsx`. */
const TONES = {
  neutral: "bg-cream-300 text-ink-700",
  accent: "bg-yellow-500 text-ink-900",
  alert: "bg-red-500 text-cream-50",
  good: "bg-olive-100 text-olive-700",
  inverse: "bg-ink-900 text-cream-100",
} as const;

export type BadgeTone = keyof typeof TONES;

export interface BadgeProps {
  tone?: BadgeTone;
  children?: ReactNode;
  className?: string;
}

export function Badge({ tone = "neutral", children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "type-eyebrow inline-flex h-5 items-center rounded-xs px-2",
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
