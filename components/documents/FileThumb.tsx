import type { CSSProperties } from "react";
import { Icon, type IconName } from "../core/Icon";
import { ProgressBar } from "../feedback/ProgressBar";

/**
 * Ported from the design system's `FileThumb.jsx`. Prop surface unchanged.
 *
 * `state` is about the **upload**, not the extraction that follows it. A file
 * that reads `sent` here has reached the server; whether the model can read it
 * is the tracking screen's business.
 */
const marks = {
  pending: { icon: "clock", color: "var(--text-muted)", text: "Aguardando" },
  uploading: { icon: "loader", color: "var(--yellow-700)", text: "Enviando" },
  sent: { icon: "check", color: "var(--olive-600)", text: "Enviado" },
  error: { icon: "alert-triangle", color: "var(--red-600)", text: "Falhou" },
} satisfies Record<string, { icon: IconName; color: string; text: string }>;

export type FileThumbState = keyof typeof marks;

export interface FileThumbProps {
  name: string;
  /** Already formatted for display, e.g. "1.2 MB". */
  size?: string;
  /** Preview URL. Absent for formats that cannot be shown, such as PDF. */
  src?: string | null;
  state?: FileThumbState;
  progress?: number;
  onRemove?: () => void;
  style?: CSSProperties;
}

export function FileThumb({
  name,
  size,
  src,
  state = "pending",
  progress = 0,
  onRemove,
  style,
}: FileThumbProps) {
  const mark = marks[state];

  return (
    <figure
      style={{
        margin: 0,
        width: 150,
        background: "var(--surface-card)",
        border: "var(--border-width) solid var(--border-strong)",
        boxShadow: "var(--shadow-hard-sm)",
        ...style,
      }}
    >
      <div
        style={{
          position: "relative",
          height: 104,
          background: "var(--surface-sunken)",
          borderBottom: "var(--border-width) solid var(--border-strong)",
          display: "grid",
          placeItems: "center",
          overflow: "hidden",
        }}
      >
        {src ? (
          // next/image is deliberately not used: the source is a blob: URL from
          // URL.createObjectURL, which the image optimizer cannot fetch or cache.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <Icon
            name="file-text"
            size={26}
            strokeWidth={1.5}
            style={{ color: "var(--text-faint)" }}
          />
        )}

        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            aria-label={`Remover ${name}`}
            style={{
              position: "absolute",
              top: 4,
              right: 4,
              width: 22,
              height: 22,
              display: "grid",
              placeItems: "center",
              border: "var(--border-width) solid var(--border-strong)",
              borderRadius: "var(--radius-pill)",
              background: "var(--surface-card)",
              cursor: "pointer",
            }}
          >
            <Icon name="x" size={12} />
          </button>
        )}

        {state === "sent" && (
          <span
            style={{
              position: "absolute",
              bottom: 4,
              left: 4,
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              padding: "2px 6px",
              background: "var(--olive-600)",
              color: "var(--cream-50)",
              font: "var(--type-eyebrow)",
              letterSpacing: "var(--tracking-eyebrow)",
              textTransform: "uppercase",
            }}
          >
            <Icon name="check" size={10} light />
            Enviado
          </span>
        )}
      </div>

      <figcaption
        style={{ padding: "var(--space-2) var(--space-3) var(--space-3)", display: "grid", gap: 6 }}
      >
        <span
          title={name}
          style={{
            font: "var(--type-body-sm)",
            fontWeight: "var(--weight-semibold)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {name}
        </span>
        <span
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 6,
            font: "var(--type-eyebrow)",
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            color: mark.color,
          }}
        >
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
            <Icon name={mark.icon} size={11} strokeWidth={2.5} />
            {mark.text}
          </span>
          {size && <span style={{ color: "var(--text-faint)" }}>{size}</span>}
        </span>
        {state === "uploading" && <ProgressBar value={progress} indeterminate height={4} />}
      </figcaption>
    </figure>
  );
}
