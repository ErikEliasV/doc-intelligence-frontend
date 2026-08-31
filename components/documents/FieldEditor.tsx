import { useId } from "react";
import { FieldOrigin, type FieldOrigin as Origem } from "@/lib/api/types";
import { cn } from "../cn";
import { Badge } from "../core/Badge";
import { Icon } from "../core/Icon";
import { ConfidenceMeter } from "../feedback/ConfidenceMeter";

/**
 * Ported from the design system's `FieldEditor.jsx`, with one change the
 * contract forced.
 *
 * The source assumes a corrected field becomes 100% confident, and shows the
 * meter regardless. Here `confianca` is always the model's own number and never
 * moves (see ADR-0012), so a corrected field shows a "Corrigido" badge instead
 * of a meter: the model's 43% is still true of the model, but it says nothing
 * about a value a person typed. Showing a percentage there would be a lie in
 * either direction.
 */
const LIMIAR_BAIXA = 0.7;

export interface FieldEditorProps {
  label: string;
  value: string;
  /** 0..1. The model's confidence, even after a correction. */
  confidence: number;
  origin: Origem;
  /** Machine-read values (numbers, dates, ids) take the mono face. */
  mono?: boolean;
  onChange?: (value: string) => void;
  onFocus?: () => void;
  active?: boolean;
  disabled?: boolean;
  className?: string;
}

export function FieldEditor({
  label,
  value,
  confidence,
  origin,
  mono,
  onChange,
  onFocus,
  active,
  disabled,
  className,
}: FieldEditorProps) {
  const id = useId();
  const corrigido = origin === FieldOrigin.HUMANO;
  const baixa = !corrigido && confidence < LIMIAR_BAIXA;

  return (
    <div
      className={cn(
        "grid gap-2 border-l-[3px] p-3 transition-control",
        active ? "bg-yellow-100" : "bg-transparent",
        baixa ? "border-l-red-500" : "border-l-transparent",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <label htmlFor={id} className="type-eyebrow text-muted">
          {label}
        </label>
        {corrigido ? <Badge tone="good">Corrigido</Badge> : <ConfidenceMeter value={confidence} />}
      </div>

      <div className="relative flex items-center">
        <input
          id={id}
          value={value}
          disabled={disabled}
          onFocus={onFocus}
          onChange={(evento) => onChange?.(evento.target.value)}
          aria-invalid={baixa || undefined}
          className={cn(
            "h-control w-full rounded-xs border bg-raised px-3 text-body outline-none",
            "focus-visible:shadow-[var(--focus-ring)] disabled:opacity-60",
            mono ? "type-mono" : "type-body",
            baixa ? "border-red-500 pr-9" : "border-line-strong",
          )}
        />
        {baixa && (
          <span className="pointer-events-none absolute right-3 flex text-red-500">
            <Icon name="alert-triangle" size={14} />
          </span>
        )}
      </div>
    </div>
  );
}
