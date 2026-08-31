import type { CSSProperties, ReactNode } from "react";

/** Ported from the design system's `Card.jsx`. Prop surface unchanged. */
const tones = {
  paper: { background: "var(--surface-card)", color: "var(--text-body)" },
  sunken: { background: "var(--surface-sunken)", color: "var(--text-body)" },
  inverse: { background: "var(--surface-inverse)", color: "var(--text-on-inverse)" },
  accent: { background: "var(--surface-accent)", color: "var(--text-on-accent)" },
} satisfies Record<string, CSSProperties>;

export type CardTone = keyof typeof tones;

export interface CardProps {
  tone?: CardTone;
  /** Nested cards drop the hard shadow. */
  raised?: boolean;
  padding?: string;
  /** `true` for the yellow rule, or any CSS colour. */
  accentBar?: boolean | string;
  style?: CSSProperties;
  children?: ReactNode;
}

export function Card({
  tone = "paper",
  raised = true,
  padding = "var(--space-6)",
  accentBar,
  style,
  children,
}: CardProps) {
  return (
    <section
      style={{
        border: "var(--border-width) solid var(--border-strong)",
        borderRadius: "var(--radius-none)",
        boxShadow: raised ? "var(--shadow-hard)" : "none",
        padding,
        position: "relative",
        ...tones[tone],
        ...style,
      }}
    >
      {accentBar && (
        <span
          style={{
            position: "absolute",
            inset: "0 0 auto 0",
            height: 6,
            background: accentBar === true ? "var(--yellow-500)" : accentBar,
          }}
        />
      )}
      {children}
    </section>
  );
}
