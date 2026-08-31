import type { CSSProperties } from "react";

/**
 * Ported from the design system's `ProgressBar.jsx`. Prop surface unchanged.
 *
 * The indeterminate sweep is the one looping animation the design system
 * allows. One deviation from the source: it declares the `ds-indeterminate`
 * keyframes in a `<style>` tag inside the component, which React then renders
 * once per instance. Here they live in `styles/design-system/keyframes.css`,
 * declared once for the whole app.
 */
export interface ProgressBarProps {
  /** 0..100. Ignored when `indeterminate` is set. */
  value?: number;
  indeterminate?: boolean;
  height?: number;
  style?: CSSProperties;
}

export function ProgressBar({ value = 0, indeterminate, height = 6, style }: ProgressBarProps) {
  return (
    <span
      style={{
        display: "block",
        height,
        background: "var(--cream-300)",
        border: "var(--border-width) solid var(--border-strong)",
        overflow: "hidden",
        ...style,
      }}
    >
      <span
        style={{
          display: "block",
          height: "100%",
          background: "var(--surface-accent)",
          width: indeterminate ? "38%" : `${Math.max(0, Math.min(100, value))}%`,
          transition: "width var(--duration-slow) var(--ease-out)",
          animation: indeterminate
            ? "ds-indeterminate 1.4s var(--ease-in-out) infinite"
            : undefined,
        }}
      />
    </span>
  );
}
