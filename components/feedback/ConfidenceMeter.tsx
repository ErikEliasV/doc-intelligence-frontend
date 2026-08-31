import { cn } from "../cn";

/**
 * Ported from the design system's `ConfidenceMeter.jsx`.
 *
 * Four bars rather than a continuous bar: the design system's rule is that a
 * model's self-reported confidence is an estimate, and four steps say that more
 * honestly than a smooth fill would.
 */
const BARS = 4;

export interface ConfidenceMeterProps {
  /** 0..1. */
  value: number;
  showValue?: boolean;
  className?: string;
}

export function ConfidenceMeter({ value, showValue = true, className }: ConfidenceMeterProps) {
  const pct = Math.max(0, Math.min(100, Math.round(value * 100)));
  const cor =
    pct >= 90
      ? "bg-confidence-high border-confidence-high"
      : pct >= 70
        ? "bg-confidence-medium border-confidence-medium"
        : "bg-confidence-low border-confidence-low";
  const preenchidas = Math.ceil((pct / 100) * BARS);

  return (
    <span
      title={`${pct}% de confiança`}
      className={cn("inline-flex items-center gap-2", className)}
    >
      <span className="flex h-2.5 w-11 gap-0.5">
        {Array.from({ length: BARS }, (_, i) => (
          <span
            key={i}
            className={cn(
              "flex-1 border",
              i < preenchidas ? cor : "bg-cream-300 border-line-subtle",
            )}
          />
        ))}
      </span>
      {showValue && (
        <span className="type-mono text-[length:var(--size-caption)] text-muted">{pct}%</span>
      )}
    </span>
  );
}
