import type { ReactNode } from "react";
import Link from "next/link";
import { cn } from "../cn";
import { Icon, type IconName } from "../core/Icon";

/**
 * Ported from the design system's `SidebarNav.jsx`, with the first prop-surface
 * change any ported component has taken. See docs/adr/ADR-0013.md.
 *
 * The origin navigates by `value`/`onChange` over `<button>`, which is right
 * for a prototype that swaps views in one page and wrong for an app with real
 * routes: a button cannot be ctrl-clicked into a new tab, cannot have its link
 * copied, and gets no prefetch. Items carry `href` and render `next/link`.
 *
 * Two other deviations, both subtractive:
 *  - **no `count` badge.** There is no summary endpoint, so a count per item
 *    would cost one request per item on every poll — the same reason `Tabs`
 *    dropped its own count. See docs/adr/ADR-0011.md.
 *  - **`footer` renders only when given.** The origin fills it with an invented
 *    user ("Ana Prado, Conferência"); this project has no authentication, and a
 *    fake person in the chrome would be a lie the interface tells at all times.
 *
 * This component knows no routes. It is handed the items and which one is
 * active — deriving that from the URL belongs to `features/shell/`.
 */
export interface SidebarNavItem {
  href: string;
  label: string;
  icon: IconName;
}

export interface SidebarNavProps {
  items: readonly SidebarNavItem[];
  /** Which item to highlight. Null when the current route has no entry. */
  activeHref?: string | null;
  /** Icon rail instead of full width, for routes that need the pixels back. */
  collapsed?: boolean;
  footer?: ReactNode;
  className?: string;
}

export function SidebarNav({
  items,
  activeHref = null,
  collapsed = false,
  footer,
  className,
}: SidebarNavProps) {
  return (
    <nav
      aria-label="Navegação principal"
      className={cn(
        // Hidden below `md`, where `BottomNav` takes over. `display:none` also
        // removes it from the accessibility tree, which is what lets both bars
        // carry the same label without announcing navigation twice.
        "hidden shrink-0 grow-0 flex-col border-r border-line-strong bg-inverse text-on-inverse md:flex",
        collapsed ? "w-14" : "w-[var(--sidebar-width)]",
        className,
      )}
    >
      <div className={cn("pt-6 pb-5", collapsed ? "px-1 text-center" : "px-5")}>
        {/* Set in type, never a drawn mark — the origin's own instruction, and
            there is no logo file in the brand. Collapsed it only shrinks; the
            full size overflows a 56px rail and clips. */}
        <span className={cn("block", collapsed ? "type-wordmark-compact" : "type-wordmark")}>
          DOC
        </span>
        {!collapsed && (
          <span className="type-eyebrow mt-1 block text-yellow-500">Intelligence</span>
        )}
      </div>

      <ul className={cn("m-0 grid list-none gap-0.5 p-0", collapsed ? "px-2" : "px-3")}>
        {items.map((item) => {
          const ativo = item.href === activeHref;

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={ativo ? "page" : undefined}
                // Collapsed, the glyph is the only visible label, so the name
                // has to reach a screen reader and a hover some other way.
                aria-label={collapsed ? item.label : undefined}
                title={collapsed ? item.label : undefined}
                className={cn(
                  "flex h-10 items-center gap-3 rounded-xs no-underline transition-control",
                  collapsed ? "justify-center px-0" : "px-3",
                  ativo
                    ? "type-body-strong bg-yellow-500 text-ink-900"
                    : "type-body text-cream-200 hover:bg-ink-800 hover:text-cream-50",
                )}
              >
                <Icon name={item.icon} size={16} light={!ativo} />
                {!collapsed && <span className="flex-1">{item.label}</span>}
              </Link>
            </li>
          );
        })}
      </ul>

      {footer && <div className="mt-auto border-t border-ink-700 p-5">{footer}</div>}
    </nav>
  );
}
