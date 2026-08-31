import { cn } from "../cn";

/**
 * Ported from the design system's `ReviewerChip.jsx`.
 *
 * Used here to say that somebody else has the same document open. There is no
 * authentication in this project, so `name` is whatever the caller can offer —
 * for a concurrent reviewer that is a session id, not a person. The design
 * system's initials treatment degrades to something neutral in that case, which
 * is honest: the system genuinely does not know who it is.
 */
export interface ReviewerChipProps {
  name: string;
  note?: string;
  className?: string;
}

export function ReviewerChip({ name, note = "revisando", className }: ReviewerChipProps) {
  const iniciais =
    name
      .split(" ")
      .map((parte) => parte[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "?";

  return (
    <span
      title={`${name} está ${note}`}
      className={cn("inline-flex items-center gap-2", className)}
    >
      <span className="grid h-6 w-6 place-items-center rounded-pill bg-red-500 text-[10px]/none font-bold tracking-[0.02em] text-cream-50">
        {iniciais}
      </span>
      <span className="type-body-sm whitespace-nowrap text-muted">{note}</span>
    </span>
  );
}
