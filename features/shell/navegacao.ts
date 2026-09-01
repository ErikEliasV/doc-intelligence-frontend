import type { IconName } from "@/components";

/**
 * What the sidebar offers and which route lights up.
 *
 * Pure — no React, no `usePathname`, no router. The shell passes the pathname
 * in, which is what lets every routing rule here be tested without rendering
 * anything. See docs/adr/ADR-0013.md.
 */

export interface ItemNav {
  href: string;
  label: string;
  icon: IconName;
}

/**
 * Two destinations, not the design system's five.
 *
 * `SidebarNav` on the origin lists five, including search and the full review
 * queue. Both are out of scope until asked for (`AGENTS.md`, rule 1), so they
 * are not here — and `navegacao.test.ts` fails if they come back.
 *
 * Revisão has no entry of its own: it is reached from a row of the panel, and
 * a nav item pointing at a document id that does not exist yet would be a dead
 * link. The way back is the breadcrumb on the screen itself.
 */
export const ITENS_NAV: readonly ItemNav[] = [
  { href: "/envio", label: "Envio", icon: "upload-cloud" },
  { href: "/acompanhamento", label: "Acompanhamento", icon: "inbox" },
];

/** The review route, whose width is the reason the rail collapses. */
const ROTA_REVISAO = "/revisao";

/**
 * Segment-aware, so `/envios` does not light up `/envio`. A bare
 * `startsWith` would.
 */
function casa(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** The item the current route belongs to, or null when none does. */
export function itemAtivo(pathname: string, itens: readonly ItemNav[] = ITENS_NAV): ItemNav | null {
  return itens.find((item) => casa(pathname, item.href)) ?? null;
}

/**
 * Whether the sidebar shows as an icon rail instead of full width.
 *
 * True only on revisão. At 1024px the full 236px rail leaves the fields column
 * 272px, which is not enough for a value like "José de Souza e Terezinha de
 * Souza"; the rail gives 180px of that back. Separate from `itemAtivo` because
 * "no item matches" and "collapse here" are different questions — a future
 * route could do one without the other.
 */
export function deveColapsar(pathname: string): boolean {
  return casa(pathname, ROTA_REVISAO);
}
