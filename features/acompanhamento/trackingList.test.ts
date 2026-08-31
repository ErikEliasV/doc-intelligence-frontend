import { describe, expect, it } from "vitest";
import { DocumentStatus, type Document } from "@/lib/api/types";
import {
  INTERVALO_BASE_MS,
  INTERVALO_MAXIMO_MS,
  confiancaMinima,
  decidirPolling,
  formatarRecebidoEm,
  limitarPagina,
  podeAbrirRevisao,
  rotuloDoTipo,
  temItensAtivos,
} from "./trackingList";

const AGORA = new Date("2026-01-15T12:00:00.000Z");

function doc(status: DocumentStatus, id = "doc_0001"): Document {
  return {
    id,
    nome: "peticao.pdf",
    tipoMime: "application/pdf",
    tamanhoBytes: 1024,
    status,
    enviadoEm: "2026-01-15T11:59:00.000Z",
    atualizadoEm: "2026-01-15T11:59:00.000Z",
    campos: [],
    erro: null,
  };
}

describe("temItensAtivos", () => {
  it("é verdadeiro enquanto algum documento pode mudar sozinho", () => {
    expect(temItensAtivos([doc(DocumentStatus.PROCESSANDO)])).toBe(true);
    expect(temItensAtivos([doc(DocumentStatus.RECEBIDO)])).toBe(true);
  });

  it("é falso quando tudo já chegou a um status terminal", () => {
    expect(
      temItensAtivos([
        doc(DocumentStatus.PRONTO, "a"),
        doc(DocumentStatus.EM_CONFERENCIA, "b"),
        doc(DocumentStatus.ERRO, "c"),
      ]),
    ).toBe(false);
  });

  it("basta um item ativo no meio de terminais", () => {
    expect(
      temItensAtivos([
        doc(DocumentStatus.PRONTO, "a"),
        doc(DocumentStatus.PROCESSANDO, "b"),
        doc(DocumentStatus.ERRO, "c"),
      ]),
    ).toBe(true);
  });

  it("é falso numa página vazia", () => {
    expect(temItensAtivos([])).toBe(false);
  });
});

describe("decidirPolling", () => {
  const ativos = [doc(DocumentStatus.PROCESSANDO)];
  const terminais = [doc(DocumentStatus.PRONTO)];

  it("atualiza a cada 15s quando há item em processamento", () => {
    expect(decidirPolling({ documentos: ativos, visivel: true, falhasSeguidas: 0 })).toEqual({
      ativo: true,
      intervaloMs: INTERVALO_BASE_MS,
      motivo: "ativo",
    });
  });

  it("para quando tudo é terminal — nada mais muda sozinho", () => {
    const decisao = decidirPolling({ documentos: terminais, visivel: true, falhasSeguidas: 0 });

    expect(decisao.ativo).toBe(false);
    expect(decisao.motivo).toBe("parado-tudo-terminal");
  });

  it("para com a aba oculta, mesmo havendo item ativo", () => {
    const decisao = decidirPolling({ documentos: ativos, visivel: false, falhasSeguidas: 0 });

    expect(decisao.ativo).toBe(false);
    expect(decisao.motivo).toBe("parado-aba-oculta");
  });

  it("a aba oculta tem prioridade sobre tudo", () => {
    expect(
      decidirPolling({ documentos: terminais, visivel: false, falhasSeguidas: 3 }).motivo,
    ).toBe("parado-aba-oculta");
  });

  it("recua exponencialmente a cada falha seguida", () => {
    const intervalos = [1, 2, 3].map(
      (falhas) =>
        decidirPolling({ documentos: ativos, visivel: true, falhasSeguidas: falhas }).intervaloMs,
    );

    expect(intervalos).toEqual([
      INTERVALO_BASE_MS * 2,
      INTERVALO_BASE_MS * 4,
      INTERVALO_BASE_MS * 8,
    ]);
  });

  it("o recuo tem teto — um servidor fora do ar não vira espera infinita", () => {
    const decisao = decidirPolling({ documentos: ativos, visivel: true, falhasSeguidas: 20 });

    expect(decisao.intervaloMs).toBe(INTERVALO_MAXIMO_MS);
    expect(decisao.motivo).toBe("ativo-com-recuo");
  });

  it("volta ao intervalo base quando a falha se resolve", () => {
    expect(
      decidirPolling({ documentos: ativos, visivel: true, falhasSeguidas: 0 }).intervaloMs,
    ).toBe(INTERVALO_BASE_MS);
  });

  it("não fica atualizando uma página vazia", () => {
    expect(decidirPolling({ documentos: [], visivel: true, falhasSeguidas: 0 }).ativo).toBe(false);
  });
});

describe("limitarPagina", () => {
  it("mantém uma página válida", () => {
    expect(limitarPagina(3, 10)).toBe(3);
  });

  it("puxa para a última quando o total encolhe sob o usuário", () => {
    expect(limitarPagina(33, 4)).toBe(4);
  });

  it("nunca vai abaixo de 1", () => {
    expect(limitarPagina(0, 10)).toBe(1);
    expect(limitarPagina(-5, 10)).toBe(1);
  });

  it("trata lista vazia como uma página", () => {
    expect(limitarPagina(1, 0)).toBe(1);
    expect(limitarPagina(7, 0)).toBe(1);
  });

  it("descarta entrada não numérica", () => {
    expect(limitarPagina(NaN, 10)).toBe(1);
    expect(limitarPagina(2.7, 10)).toBe(2);
  });
});

describe("confiancaMinima", () => {
  it("devolve o menor campo — o que decidiu a conferência", () => {
    expect(
      confiancaMinima([
        { nome: "a", valor: "1", confianca: 0.92 },
        { nome: "b", valor: "2", confianca: 0.61 },
        { nome: "c", valor: "3", confianca: 0.88 },
      ]),
    ).toBe(0.61);
  });

  it("é nulo antes de haver extração", () => {
    expect(confiancaMinima([])).toBeNull();
  });
});

describe("podeAbrirRevisao", () => {
  it("só em_conferencia abre a revisão", () => {
    expect(podeAbrirRevisao(DocumentStatus.EM_CONFERENCIA)).toBe(true);
  });

  it("os demais status não abrem", () => {
    for (const status of [
      DocumentStatus.RECEBIDO,
      DocumentStatus.PROCESSANDO,
      DocumentStatus.PRONTO,
      DocumentStatus.ERRO,
    ]) {
      expect(podeAbrirRevisao(status)).toBe(false);
    }
  });
});

describe("formatarRecebidoEm", () => {
  it("mostra 'agora' no primeiro minuto", () => {
    expect(formatarRecebidoEm("2026-01-15T11:59:30.000Z", AGORA)).toBe("agora");
  });

  it("conta minutos dentro da hora", () => {
    expect(formatarRecebidoEm("2026-01-15T11:45:00.000Z", AGORA)).toBe("há 15 min");
    expect(formatarRecebidoEm("2026-01-15T11:01:00.000Z", AGORA)).toBe("há 59 min");
  });

  it("passa a hora do relógio acima de uma hora", () => {
    expect(formatarRecebidoEm("2026-01-15T09:30:00.000Z", AGORA)).toMatch(/^\d{2}:\d{2}$/);
  });

  it("não quebra com data inválida", () => {
    expect(formatarRecebidoEm("nao-e-data", AGORA)).toBe("—");
  });

  it("não inventa tempo negativo se o relógio do cliente estiver atrasado", () => {
    expect(formatarRecebidoEm("2026-01-15T12:05:00.000Z", AGORA)).toMatch(/^\d{2}:\d{2}$/);
  });
});

describe("rotuloDoTipo", () => {
  it("encurta os tipos que a triagem recebe", () => {
    expect(rotuloDoTipo("application/pdf")).toBe("PDF");
    expect(rotuloDoTipo("image/png")).toBe("PNG");
    expect(rotuloDoTipo("image/jpeg")).toBe("JPEG");
  });

  it("tem rótulo para o que não reconhece", () => {
    expect(rotuloDoTipo("application/octet-stream")).toBe("Arquivo");
  });
});
