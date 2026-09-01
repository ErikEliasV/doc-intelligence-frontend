import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { SidebarNav, type SidebarNavItem } from "./SidebarNav";

/**
 * Rendered to an HTML string, not to a DOM.
 *
 * `renderToStaticMarkup` comes from `react-dom`, already a runtime dependency,
 * so the component tests cost no jsdom and no Testing Library. Asserting on the
 * raw markup is also stricter than a query API for what matters here: it sees
 * the attribute, not just the visible text. See docs/adr/ADR-0013.md.
 */
const ITENS: readonly SidebarNavItem[] = [
  { href: "/envio", label: "Envio", icon: "upload-cloud" },
  { href: "/acompanhamento", label: "Acompanhamento", icon: "inbox" },
];

interface Ancora {
  href: string;
  atual: boolean;
  tag: string;
}

/** Every `<a>` opening tag, so an assertion can name the one it means. */
function ancoras(html: string): Ancora[] {
  return [...html.matchAll(/<a\b[^>]*>/g)].map((match) => ({
    href: /href="([^"]*)"/.exec(match[0])?.[1] ?? "",
    atual: match[0].includes('aria-current="page"'),
    tag: match[0],
  }));
}

function ancora(html: string, href: string): Ancora {
  const encontrada = ancoras(html).find((a) => a.href === href);
  if (!encontrada) throw new Error(`Nenhuma âncora para ${href} em: ${html}`);
  return encontrada;
}

describe("SidebarNav — rota ativa", () => {
  it("marca só o envio quando o envio é a rota ativa", () => {
    const html = renderToStaticMarkup(<SidebarNav items={ITENS} activeHref="/envio" />);

    expect(ancora(html, "/envio").atual).toBe(true);
    expect(ancora(html, "/acompanhamento").atual).toBe(false);
  });

  it("marca só o acompanhamento quando o acompanhamento é a rota ativa", () => {
    const html = renderToStaticMarkup(<SidebarNav items={ITENS} activeHref="/acompanhamento" />);

    expect(ancora(html, "/acompanhamento").atual).toBe(true);
    expect(ancora(html, "/envio").atual).toBe(false);
  });

  it("não marca nada quando nenhuma rota casa, como na revisão", () => {
    const html = renderToStaticMarkup(<SidebarNav items={ITENS} activeHref={null} />);

    expect(ancoras(html).every((a) => !a.atual)).toBe(true);
  });

  /**
   * O destaque não pode ser só a cor amarela: quem navega por leitor de tela
   * precisa do mesmo fato. Se alguém trocar o `aria-current` por uma classe,
   * este teste cai.
   */
  it("destaca por cor e por aria-current, não só por cor", () => {
    const html = renderToStaticMarkup(<SidebarNav items={ITENS} activeHref="/envio" />);

    const ativa = ancora(html, "/envio");
    const inativa = ancora(html, "/acompanhamento");

    expect(ativa.tag).toContain("bg-yellow-500");
    expect(inativa.tag).not.toContain("bg-yellow-500");
    expect(ativa.atual).toBe(true);
  });

  /**
   * Abaixo de `md` quem navega é a `BottomNav`. `hidden` é `display:none`, que
   * tira o elemento também da árvore de acessibilidade — é o que permite às
   * duas barras compartilharem o mesmo `aria-label` sem duplicar navegação
   * para quem usa leitor de tela. Ver docs/adr/ADR-0014.md.
   */
  it("só aparece a partir do breakpoint md", () => {
    const html = renderToStaticMarkup(<SidebarNav items={ITENS} activeHref="/envio" />);

    expect(html).toContain("hidden");
    expect(html).toContain("md:flex");
  });

  it("renderiza uma âncora por item, não um botão", () => {
    const html = renderToStaticMarkup(<SidebarNav items={ITENS} activeHref="/envio" />);

    expect(ancoras(html)).toHaveLength(ITENS.length);
    expect(html).not.toContain("<button");
  });
});

describe("SidebarNav — trilho colapsado", () => {
  it("esconde o rótulo mas o mantém acessível", () => {
    const html = renderToStaticMarkup(<SidebarNav items={ITENS} activeHref={null} collapsed />);

    expect(html).not.toContain(">Envio<");
    expect(ancora(html, "/envio").tag).toContain('aria-label="Envio"');
  });

  it("ainda destaca a rota ativa quando colapsado", () => {
    const html = renderToStaticMarkup(<SidebarNav items={ITENS} activeHref="/envio" collapsed />);

    expect(ancora(html, "/envio").atual).toBe(true);
    expect(ancora(html, "/envio").tag).toContain("bg-yellow-500");
  });
});
