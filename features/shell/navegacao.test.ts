import { describe, expect, it } from "vitest";
import { ITENS_NAV, deveColapsar, itemAtivo } from "./navegacao";

describe("ITENS_NAV", () => {
  it("leva apenas às duas telas com rota própria", () => {
    expect(ITENS_NAV.map((item) => item.href)).toEqual(["/envio", "/acompanhamento"]);
  });

  /**
   * `AGENTS.md`, regra 1: busca e fila de conferência estão fora do escopo até
   * confirmação explícita. O design system tem as duas, e a barra da origem
   * lista cinco destinos — este teste é o que impede que elas voltem por
   * descuido num porte futuro.
   */
  it("não oferece busca nem fila de conferência", () => {
    const rotulos = ITENS_NAV.map((item) => item.label.toLowerCase()).join(" ");
    expect(rotulos).not.toContain("busca");
    expect(rotulos).not.toContain("conferência");
  });
});

describe("itemAtivo", () => {
  it("marca o envio em /envio", () => {
    expect(itemAtivo("/envio")?.href).toBe("/envio");
  });

  it("marca o acompanhamento em /acompanhamento", () => {
    expect(itemAtivo("/acompanhamento")?.href).toBe("/acompanhamento");
  });

  it("não marca nada na revisão, que não tem item próprio", () => {
    expect(itemAtivo("/revisao/doc_0001")).toBeNull();
  });

  it("não marca nada na raiz", () => {
    expect(itemAtivo("/")).toBeNull();
  });

  it("casa sub-rota pelo separador", () => {
    expect(itemAtivo("/envio/lote")?.href).toBe("/envio");
  });

  /** Prefixo solto casaria `/envios` com `/envio` e acenderia o item errado. */
  it("não casa prefixo solto", () => {
    expect(itemAtivo("/envios")).toBeNull();
  });
});

describe("deveColapsar", () => {
  it("colapsa na revisão, onde a largura disputa com o lado a lado", () => {
    expect(deveColapsar("/revisao/doc_0001")).toBe(true);
  });

  it("não colapsa nas telas de largura folgada", () => {
    expect(deveColapsar("/envio")).toBe(false);
    expect(deveColapsar("/acompanhamento")).toBe(false);
  });
});
