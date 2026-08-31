import { cn } from "../cn";

/**
 * Ported from the design system's `ProgressBar.jsx`.
 *
 * Two deviations from the source. The `ds-indeterminate` keyframes moved to
 * `styles/design-system/keyframes.css` — the source declares them in a `<style>`
 * tag inside the component, which React renders once per mounted instance. And
 * the determinate width is the one inline style left in the component set: it
 * is a continuous value, not a class.
 */
export interface ProgressBarProps {
  /** 0..100. Ignored when `indeterminate` is set. */
  value?: number;
  indeterminate?: boolean;
  /** Height is the caller's — the track sets none, so there is nothing to override. */
  className?: string;
}

export function ProgressBar({ value = 0, indeterminate, className }: ProgressBarProps) {
  return (
    <span className={cn("block overflow-hidden border border-line-strong bg-cream-300", className)}>
      <span
        className={cn(
          "block h-full bg-accent transition-[width] duration-(--duration-slow) ease-(--ease-out)",
          indeterminate && "w-[38%] animate-[ds-indeterminate_1.4s_var(--ease-in-out)_infinite]",
        )}
        style={indeterminate ? undefined : { width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </span>
  );
}
