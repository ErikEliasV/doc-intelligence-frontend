import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { SidebarNavItem } from "./SidebarNav";
import { BottomNav } from "./BottomNav";

/**
 * The bottom bar is designed here, not ported: the origin's kit is a
 * 1440x900 viewport with `overflow:hidden` and has no mobile treatment at all.
 * See docs/adr/ADR-0014.md.
 */
const ITENS: readonly SidebarNavItem[] = [
  { href: "/envio", label: "Envio", icon: "upload-cloud" },
  { href: "/acompanhamento", label: "Acompanhamento", icon: "inbox" },
];

function ancora(html: string, href: string): string {
  const encontrada = [...html.matchAll(/<a\b[^>]*>/g)].find((m) => m[0].includes(`href="${href}"`));
  if (!encontrada) throw new Error(`Nenhuma âncora para ${href} em: ${html}`);
  return encontrada[0];
}

describe("BottomNav", () => {
  it("renderiza uma âncora por item", () => {
    const html = renderToStaticMarkup(<BottomNav items={ITENS} activeHref="/envio" />);

    expect([...html.matchAll(/<a\b/g)]).toHaveLength(ITENS.length);
    expect(html).not.toContain("<button");
  });

  it("destaca só a rota ativa, por cor e por aria-current", () => {
    const html = renderToStaticMarkup(<BottomNav items={ITENS} activeHref="/acompanhamento" />);

    expect(ancora(html, "/acompanhamento")).toContain('aria-current="page"');
    expect(ancora(html, "/acompanhamento")).toContain("bg-yellow-500");
    expect(ancora(html, "/envio")).not.toContain('aria-current="page"');
    expect(ancora(html, "/envio")).not.toContain("bg-yellow-500");
  });

  it("não destaca nada onde nenhuma rota casa, como na revisão", () => {
    const html = renderToStaticMarkup(<BottomNav items={ITENS} activeHref={null} />);

    expect(html).not.toContain('aria-current="page"');
  });

  /**
   * Diferente do trilho colapsado: aqui há largura de sobra, então o rótulo
   * aparece de verdade em vez de virar `aria-label`.
   */
  it("mostra os rótulos", () => {
    const html = renderToStaticMarkup(<BottomNav items={ITENS} activeHref={null} />);

    expect(html).toContain(">Envio<");
    expect(html).toContain(">Acompanhamento<");
  });

  it("some a partir do breakpoint em que a lateral aparece", () => {
    const html = renderToStaticMarkup(<BottomNav items={ITENS} activeHref={null} />);

    expect(html).toContain("md:hidden");
  });
});
