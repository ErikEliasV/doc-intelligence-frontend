"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { SidebarNav } from "@/components";
import { ITENS_NAV, deveColapsar, itemAtivo } from "./navegacao";

/**
 * The chrome the three screens share: a persistent rail on the left, the screen
 * on the right.
 *
 * This is the only place that reads the URL. `SidebarNav` stays a pure
 * component that is told what is active, and `navegacao.ts` stays a pure module
 * that decides it from a string — so every routing rule is tested without a
 * router. See docs/adr/ADR-0013.md.
 *
 * The rail is `sticky` rather than `position: fixed`: it stays in the flex flow,
 * so the main column needs no compensating margin, and the page keeps ordinary
 * document scrolling instead of an inner scroll container.
 */
export function Shell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex flex-1">
      <SidebarNav
        items={ITENS_NAV}
        activeHref={itemAtivo(pathname)?.href ?? null}
        collapsed={deveColapsar(pathname)}
        className="sticky top-0 h-screen self-start"
      />
      {/* `min-w-0` so a wide table inside can shrink instead of pushing the
          rail off-screen. */}
      <main className="p-gutter min-w-0 flex-1">{children}</main>
    </div>
  );
}
