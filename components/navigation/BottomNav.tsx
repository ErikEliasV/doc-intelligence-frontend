import Link from "next/link";
import { cn } from "../cn";
import { Icon } from "../core/Icon";
import type { SidebarNavItem } from "./SidebarNav";

/**
 * Navegação no celular. **Não vem do design system** — o kit da origem é um
 * viewport de 1440x900 com `overflow:hidden` e não tem tratamento mobile
 * nenhum, então isto é desenhado aqui. Ver docs/adr/ADR-0014.md.
 *
 * Barra fixa no rodapé em vez de gaveta com hambúrguer: são dois destinos. Uma
 * gaveta cobraria estado de aberto/fechado, scrim, fechar no Esc, fechar ao
 * navegar e armadilha de foco — tudo para esconder dois links que cabem lado a
 * lado ao alcance do polegar.
 *
 * Vive num arquivo separado do `SidebarNav` de propósito: aquele é portado e
 * comparável com a origem, este é invenção local. Misturar os dois num arquivo
 * só apagaria essa fronteira.
 *
 * Só aparece abaixo de `md`; acima disso a lateral assume. Os dois usam a mesma
 * lista de itens e o mesmo `activeHref`, vindos do `Shell`.
 */
export interface BottomNavProps {
  items: readonly SidebarNavItem[];
  /** Which item to highlight. Null when the current route has no entry. */
  activeHref?: string | null;
  className?: string;
}

export function BottomNav({ items, activeHref = null, className }: BottomNavProps) {
  return (
    <nav
      aria-label="Navegação principal"
      className={cn(
        "fixed inset-x-0 bottom-0 z-20 flex border-t border-line-strong bg-inverse md:hidden",
        // Keeps the row clear of the iPhone home indicator. `env()` is not a
        // hard-coded length — it resolves to 0 where there is no inset.
        "pb-[env(safe-area-inset-bottom)]",
        className,
      )}
    >
      {items.map((item) => {
        const ativo = item.href === activeHref;

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={ativo ? "page" : undefined}
            className={cn(
              "flex h-14 flex-1 items-center justify-center gap-2 no-underline transition-control",
              ativo ? "type-body-strong bg-yellow-500 text-ink-900" : "type-body text-cream-200",
            )}
          >
            <Icon name={item.icon} size={16} light={!ativo} />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
