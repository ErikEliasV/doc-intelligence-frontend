import type { DocumentStatus } from "@/lib/api/types";
import { cn } from "../cn";
import { Icon } from "../core/Icon";
import { ConfidenceMeter } from "../feedback/ConfidenceMeter";
import { StatusPill } from "../feedback/StatusPill";

/**
 * Ported from the design system's `DocumentRow.jsx`.
 *
 * The source drives its hover state with `onMouseEnter`/`onMouseLeave`; here it
 * is the `group-hover:` variant — same reason as the press in ADR-0010: the
 * browser already tracks it, and CSS cannot get stuck out of sync.
 *
 * The row is a `<button>` only when `onOpen` is given. A div with a click
 * handler is not reachable by keyboard, and this row is the only way into the
 * review screen.
 */
export interface DocumentRowProps {
  name: string;
  type: string;
  receivedAt: string;
  status: DocumentStatus;
  /** 0..1. Omitted when the document has no extracted fields yet. */
  confidence?: number | null;
  onOpen?: () => void;
  selected?: boolean;
  className?: string;
}

/**
 * The row's column layout, exported so the list header uses the same track
 * sizes. It was duplicated as a literal in the screen, which meant a change
 * here silently misaligned the header.
 *
 * The status track is 176px because the widest pill — "Em conferência", 170px
 * with its glyph, padding and the design system's 0.16em eyebrow tracking — did
 * not fit the 150px the source design system specified. It overflowed by 20px,
 * ate the whole 16px gap and overlapped the confidence column. The five status
 * labels are a closed set, so this width is provably enough; adding a status
 * means re-measuring it.
 */
export const GRID_DOCUMENTO =
  "grid grid-cols-[1fr_150px_132px_176px_118px_28px] items-center gap-4";

export function DocumentRow({
  name,
  type,
  receivedAt,
  status,
  confidence,
  onOpen,
  selected,
  className,
}: DocumentRowProps) {
  const conteudo = (
    <>
      <span className="flex min-w-0 items-center gap-3">
        <Icon name="file-text" size={17} className="opacity-55" />
        <span title={name} className="type-body-strong truncate">
          {name}
        </span>
      </span>
      <span className="type-body-sm text-muted">{type}</span>
      <span className="type-mono text-[length:var(--size-caption)] text-muted">{receivedAt}</span>
      <span>
        <StatusPill status={status} />
      </span>
      <span>{confidence != null && <ConfidenceMeter value={confidence} />}</span>
      <span
        className={cn(
          "grid place-items-center transition-control",
          onOpen ? "opacity-40 group-hover:opacity-100" : "opacity-0",
        )}
      >
        <Icon name="arrow-right" size={16} />
      </span>
    </>
  );

  const base = cn(
    GRID_DOCUMENTO,
    "h-row w-full border-b border-line-subtle px-4 py-3 text-left transition-control",
    selected && "bg-yellow-100",
    className,
  );

  if (!onOpen) {
    return <div className={base}>{conteudo}</div>;
  }

  return (
    <button
      type="button"
      onClick={onOpen}
      className={cn(base, "group cursor-pointer hover:bg-sunken")}
    >
      {conteudo}
    </button>
  );
}
