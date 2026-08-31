import { cn } from "../cn";

/**
 * Ported from the design system's `Tabs.jsx`, minus the optional `count` badge.
 *
 * The count is dropped because the API cannot produce it cheaply: there is no
 * summary endpoint, so a count per tab would mean one extra request per tab on
 * every poll. See docs/adr/ADR-0011.md — it is recorded there as a contract gap,
 * not as a design choice.
 */
export interface TabItem<T extends string> {
  value: T;
  label: string;
}

export interface TabsProps<T extends string> {
  items: readonly TabItem<T>[];
  value: T;
  onChange?: (value: T) => void;
  className?: string;
}

export function Tabs<T extends string>({ items, value, onChange, className }: TabsProps<T>) {
  return (
    <div role="tablist" className={cn("flex gap-6 border-b border-line-strong", className)}>
      {items.map((item) => {
        const ativo = item.value === value;
        return (
          <button
            key={item.value}
            type="button"
            role="tab"
            aria-selected={ativo}
            onClick={() => onChange?.(item.value)}
            className={cn(
              "type-eyebrow inline-flex cursor-pointer items-center gap-2 border-0 bg-transparent pb-3 transition-control",
              ativo ? "text-display shadow-[inset_0_-3px_0_var(--yellow-500)]" : "text-muted",
            )}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
