import { cn } from "../cn";
import { Icon, type IconName } from "../core/Icon";
import { ProgressBar } from "../feedback/ProgressBar";

/**
 * Ported from the design system's `FileThumb.jsx`.
 *
 * `state` is about the **upload**, not the extraction that follows it. A file
 * that reads `sent` here has reached the server; whether the model can read it
 * is the tracking screen's business.
 */
const MARKS = {
  pending: { icon: "clock", color: "text-muted", text: "Aguardando" },
  uploading: { icon: "loader", color: "text-yellow-700", text: "Enviando" },
  sent: { icon: "check", color: "text-olive-600", text: "Enviado" },
  error: { icon: "alert-triangle", color: "text-red-600", text: "Falhou" },
} as const satisfies Record<string, { icon: IconName; color: string; text: string }>;

export type FileThumbState = keyof typeof MARKS;

export interface FileThumbProps {
  name: string;
  /** Already formatted for display, e.g. "1,2 MB". */
  size?: string;
  /** Preview URL. Absent for formats that cannot be shown, such as PDF. */
  src?: string | null;
  state?: FileThumbState;
  progress?: number;
  onRemove?: () => void;
  className?: string;
}

export function FileThumb({
  name,
  size,
  src,
  state = "pending",
  progress = 0,
  onRemove,
  className,
}: FileThumbProps) {
  const mark = MARKS[state];

  return (
    <figure className={cn("m-0 w-44 border border-line-strong bg-card shadow-hard-sm", className)}>
      <div className="relative grid h-26 place-items-center overflow-hidden border-b border-line-strong bg-sunken">
        {src ? (
          // next/image is deliberately not used: the source is a blob: URL from
          // URL.createObjectURL, which the image optimizer cannot fetch or cache.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt="" className="h-full w-full object-cover" />
        ) : (
          <Icon name="file-text" size={26} strokeWidth={1.5} className="text-faint" />
        )}

        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            aria-label={`Remover ${name}`}
            className="absolute top-1 right-1 grid h-[22px] w-[22px] cursor-pointer place-items-center rounded-pill border border-line-strong bg-card"
          >
            <Icon name="x" size={12} />
          </button>
        )}

        {state === "sent" && (
          <span className="type-eyebrow absolute bottom-1 left-1 inline-flex items-center gap-1 bg-olive-600 px-1.5 py-0.5 text-cream-50">
            <Icon name="check" size={10} />
            Enviado
          </span>
        )}
      </div>

      {/* The source design system puts the status label and the size on one
          line, sharing it via `justify-between`. They do not fit: "Aguardando"
          alone costs 103px of the 152px available, so the size wrapped and then
          spilled past the card border.

          Size therefore sits with the filename — both are facts about the file,
          while status is a changing state that earns its own line. Nothing
          competes now: the status line has ~49px to spare, which is what keeps
          it safe while the webfont is still loading and fallback metrics are
          wider. The guards below (name yields, size never wraps) hold the
          invariant regardless. */}
      <figcaption className="grid gap-1.5 px-3 pt-2 pb-3">
        {/* `min-w-0` on the row itself, not just on the name: a grid item
            defaults to `min-width: auto`, so without it the flex row grows past
            the figcaption instead of making the name yield. */}
        <span className="flex min-w-0 items-baseline justify-between gap-2">
          <span title={name} className="type-body-strong min-w-0 truncate">
            {name}
          </span>
          {size && (
            <span className="type-eyebrow shrink-0 whitespace-nowrap tracking-[0.06em] text-faint">
              {size}
            </span>
          )}
        </span>
        <span
          className={cn(
            "type-eyebrow flex min-w-0 items-center gap-1 tracking-[0.06em]",
            mark.color,
          )}
        >
          <Icon name={mark.icon} size={11} strokeWidth={2.5} />
          <span className="truncate">{mark.text}</span>
        </span>
        {state === "uploading" && <ProgressBar value={progress} indeterminate className="h-1" />}
      </figcaption>
    </figure>
  );
}
