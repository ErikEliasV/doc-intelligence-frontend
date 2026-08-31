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
    <figure
      className={cn("m-0 w-[150px] border border-line-strong bg-card shadow-hard-sm", className)}
    >
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

      <figcaption className="grid gap-1.5 px-3 pt-2 pb-3">
        <span title={name} className="type-body-strong truncate">
          {name}
        </span>
        <span
          className={cn(
            "type-eyebrow flex items-center justify-between gap-1.5 tracking-[0.06em]",
            mark.color,
          )}
        >
          <span className="inline-flex items-center gap-1">
            <Icon name={mark.icon} size={11} strokeWidth={2.5} />
            {mark.text}
          </span>
          {size && <span className="text-faint">{size}</span>}
        </span>
        {state === "uploading" && <ProgressBar value={progress} indeterminate className="h-1" />}
      </figcaption>
    </figure>
  );
}
