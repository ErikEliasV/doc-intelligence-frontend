import { cn } from "../cn";
import { IconButton } from "../core/IconButton";

/**
 * Ported from the design system's `Pagination.jsx`.
 *
 * Shows the current page and its two neighbours, with ellipses for the rest —
 * at 33 pages (812 documents, the documented peak) a full page list would be
 * unusable.
 */
export interface PaginationProps {
  page: number;
  pageCount: number;
  total?: number;
  pageSize?: number;
  onChange?: (page: number) => void;
  className?: string;
}

export function Pagination({
  page,
  pageCount,
  total,
  pageSize = 25,
  onChange,
  className,
}: PaginationProps) {
  const go = (p: number) => onChange?.(Math.max(1, Math.min(pageCount, p)));

  const de = (page - 1) * pageSize + 1;
  const ate = Math.min(total ?? page * pageSize, page * pageSize);

  const numeros: number[] = [];
  for (let p = Math.max(1, page - 1); p <= Math.min(pageCount, page + 1); p++) numeros.push(p);

  return (
    <nav
      aria-label="Paginação"
      className={cn("flex items-center justify-between gap-4", className)}
    >
      <span className="type-body-sm text-muted">
        {total != null ? `${de}–${ate} de ${total}` : `Página ${page} de ${pageCount}`}
      </span>

      <span className="flex items-center gap-2">
        <IconButton
          icon="chevron-left"
          label="Anterior"
          size={30}
          disabled={page <= 1}
          onClick={() => go(page - 1)}
        />
        {page > 2 && <span className="type-body-sm text-faint">…</span>}
        {numeros.map((p) => (
          <button
            key={p}
            type="button"
            aria-current={p === page ? "page" : undefined}
            onClick={() => go(p)}
            className={cn(
              "type-button h-[30px] min-w-[30px] cursor-pointer rounded-pill border border-line-strong px-2",
              p === page ? "bg-inverse text-on-inverse" : "bg-card text-display",
            )}
          >
            {p}
          </button>
        ))}
        {page < pageCount - 1 && <span className="type-body-sm text-faint">…</span>}
        <IconButton
          icon="chevron-right"
          label="Próxima"
          size={30}
          disabled={page >= pageCount}
          onClick={() => go(page + 1)}
        />
      </span>
    </nav>
  );
}
