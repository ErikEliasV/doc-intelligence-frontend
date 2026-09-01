import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Button } from "./Button";

/**
 * `href` is the deviation the ADR-0009 predicted ("entra quando houver
 * botão-link"). These tests fix what it must and must not change.
 * See docs/adr/ADR-0015.md.
 */
describe("Button", () => {
  it("renderiza um botão quando não recebe href", () => {
    const html = renderToStaticMarkup(<Button>Confirmar envio</Button>);

    expect(html).toContain("<button");
    expect(html).not.toContain("<a ");
  });

  it("renderiza uma âncora quando recebe href", () => {
    const html = renderToStaticMarkup(<Button href="/acompanhamento">Ir ao painel</Button>);

    expect(html).toContain('href="/acompanhamento"');
    expect(html).not.toContain("<button");
  });

  /** Um link não é um botão: `type="button"` num `<a>` é lixo no markup. */
  it("não leva type quando é link", () => {
    const html = renderToStaticMarkup(<Button href="/envio">Enviar mais</Button>);

    expect(html).not.toContain("type=");
  });

  it("veste o link com a mesma aparência do botão", () => {
    const comoBotao = renderToStaticMarkup(
      <Button variant="inverse" size="sm">
        Ir
      </Button>,
    );
    const comoLink = renderToStaticMarkup(
      <Button variant="inverse" size="sm" href="/x">
        Ir
      </Button>,
    );

    for (const classe of ["bg-inverse", "text-on-inverse", "h-control-sm", "rounded-pill"]) {
      expect(comoBotao).toContain(classe);
      expect(comoLink).toContain(classe);
    }
  });

  it("mantém os ícones dos dois lados nos dois modos", () => {
    const html = renderToStaticMarkup(
      <Button href="/envio" iconLeft={<span>L</span>} iconRight={<span>R</span>}>
        Enviar mais
      </Button>,
    );

    expect(html).toContain("<span>L</span>");
    expect(html).toContain("<span>R</span>");
  });
});
