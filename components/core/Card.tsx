import type { ReactNode } from "react";
import { cn } from "../cn";

/**
 * Ported from the design system's `Card.jsx`.
 *
 * One prop-surface change from the source: `padding` (which took a raw CSS
 * string) is gone — padding is a Tailwind class the caller passes, like every
 * other layout choice. See docs/adr/ADR-0010.md.
 */
const TONES = {
  paper: "bg-card text-body",
  sunken: "bg-sunken text-body",
  inverse: "bg-inverse text-on-inverse",
  accent: "bg-accent text-on-accent",
} as const;

export type CardTone = keyof typeof TONES;

export interface CardProps {
  tone?: CardTone;
  /** Nested cards drop the hard shadow. */
  raised?: boolean;
  /** `true` for the yellow rule, or a background utility class for another colour. */
  accentBar?: boolean | string;
  className?: string;
  children?: ReactNode;
}

export function Card({ tone = "paper", raised = true, accentBar, className, children }: CardProps) {
  return (
    <section
      className={cn(
        "relative rounded-none border border-line-strong",
        raised && "shadow-hard",
        TONES[tone],
        className,
      )}
    >
      {accentBar && (
        <span
          className={cn(
            "absolute inset-x-0 top-0 h-1.5",
            accentBar === true ? "bg-yellow-500" : accentBar,
          )}
        />
      )}
      {children}
    </section>
  );
}
