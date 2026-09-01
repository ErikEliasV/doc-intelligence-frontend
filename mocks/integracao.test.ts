import { readFileSync } from "node:fs";
import { join } from "node:path";
import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GET as listar, POST as enviar } from "@/app/api/documents/route";
import { GET as obterArquivo } from "@/app/api/documents/[id]/arquivo/route";
import { PATCH as corrigir } from "@/app/api/documents/[id]/campos/route";
import { POST as confirmar } from "@/app/api/documents/[id]/confirmar/route";
import { GET as obter } from "@/app/api/documents/[id]/route";
import { POST as abrirRevisao } from "@/app/api/documents/[id]/revisao/route";
import {
  CONFIDENCE_REVIEW_THRESHOLD,
  DocumentStatus,
  FieldOrigin,
  type Document,
  type DocumentListResponse,
  type UploadResponse,
} from "@/lib/api/types";
import { DEFAULT_SIMULATION_CONFIG } from "./simulation/config";

/**
 * A fatia vertical inteira, atravessando os route handlers de verdade.
 *
 * Isto não é um teste do motor — esse é `simulation/review.test.ts`. Aqui o
 * caminho passa por HTTP: `Request` entra, `Response` sai, o corpo é JSON
 * serializado. Cobre o que testes de unidade não pegam — rota errada, corpo
 * malformado, status HTTP, e o contrato como o navegador o vê.
 *
 * Sem servidor e sem navegador: os handlers são funções `async`, e chamá-las
 * direto exercita a mesma pilha que o `next dev` executaria.
 *
 * Determinismo vem de fixar `Date.now` e `Math.random`, o que permite escolher
 * o desfecho de cada documento e adiantar 40s sem esperar 40s.
 */
const T0 = Date.UTC(2026, 0, 15, 12, 0, 0);
const BASE = "http://localhost/api/documents";
const REVISOR_A = "revisor-a";
const REVISOR_B = "revisor-b";

/** Constantes que decidem o desfecho no sorteio do motor (ver ADR-0006). */
const SORTEIO = {
  /** 0.0 < 0.15 → erro de processamento. */
  erro: 0,
  /** 0.20 passa do erro mas cai nos 30% de baixa confiança. */
  baixaConfianca: 0.2,
  /** 0.99 passa de tudo — todos os campos acima do limiar. */
  caminhoFeliz: 0.99,
} as const;

function ctx(id: string) {
  return { params: Promise.resolve({ id }) };
}

function arquivo(nome: string, tipo = "image/png"): File {
  const bytes = readFileSync(join(process.cwd(), "mocks", "exemplos", nome));
  return new File([new Uint8Array(bytes)], nome, { type: tipo });
}

async function enviarArquivo(nome: string, tipo?: string): Promise<Document> {
  const form = new FormData();
  form.append("arquivos", arquivo(nome, tipo));
  const resposta = await enviar(new NextRequest(BASE, { method: "POST", body: form }));

  expect(resposta.status).toBe(202);
  const { documentos } = (await resposta.json()) as UploadResponse;
  return documentos[0];
}

async function lerDocumento(id: string): Promise<Document> {
  const resposta = await obter(new Request(`${BASE}/${id}`), ctx(id));
  expect(resposta.status).toBe(200);
  return (await resposta.json()) as Document;
}

async function listarPor(query: string): Promise<DocumentListResponse> {
  const resposta = await listar(new NextRequest(`${BASE}?${query}`));
  expect(resposta.status).toBe(200);
  return (await resposta.json()) as DocumentListResponse;
}

/** Move o relógio para além da janela de processamento (5–40s). */
function processamentoConcluido() {
  vi.setSystemTime(T0 + DEFAULT_SIMULATION_CONFIG.maxProcessingMs + 1);
}

beforeEach(() => {
  // Ordem obrigatória: a simulação captura `Date.now` como referência quando é
  // construída. Criá-la antes do relógio falso deixaria o motor preso no tempo
  // real, e o documento nunca sairia de `recebido`. Zerar os singletons força
  // uma instância nova, já ligada ao relógio deste teste.
  vi.useFakeTimers();
  vi.setSystemTime(T0);
  globalThis.__docIntelligenceSimulation = undefined;
  globalThis.__docIntelligenceBlobs = undefined;
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("fatia vertical: envio → acompanhamento → conferência → pronto", () => {
  it("percorre o caminho inteiro de um documento de baixa confiança", async () => {
    vi.spyOn(Math, "random").mockReturnValue(SORTEIO.baixaConfianca);

    // ---- 1. Envio -------------------------------------------------------
    const enviado = await enviarArquivo("rg-desbotado-fake.png");

    expect(enviado.status).toBe(DocumentStatus.RECEBIDO);
    expect(enviado.campos).toEqual([]);
    expect(enviado.versao).toBe(1);

    // ---- 2. Painel: aparece processando ---------------------------------
    vi.setSystemTime(T0 + DEFAULT_SIMULATION_CONFIG.handoffMs);
    const processando = await listarPor("tamanhoPagina=25");

    expect(processando.paginacao.total).toBe(1);
    expect(processando.documentos[0].status).toBe(DocumentStatus.PROCESSANDO);

    // ---- 3. Latência simulada passa → cai na fila de conferência --------
    processamentoConcluido();
    const naFila = await listarPor(`status=${DocumentStatus.EM_CONFERENCIA}`);

    expect(naFila.paginacao.total).toBe(1);
    expect(naFila.documentos[0].id).toBe(enviado.id);

    // ---- 4. Abrir para revisão ------------------------------------------
    const emRevisao = await abrirParaRevisao(enviado.id, REVISOR_A);

    expect(emRevisao.status).toBe(DocumentStatus.EM_CONFERENCIA);
    expect(emRevisao.campos).toHaveLength(5);
    expect(emRevisao.revisaoEmAndamento).toBeNull();

    const ruim = emRevisao.campos.find((c) => c.confianca < CONFIDENCE_REVIEW_THRESHOLD)!;
    expect(ruim).toBeDefined();

    // ---- 5. Corrigir campo → NÃO fecha ----------------------------------
    const corrigido = await corrigirCampo(
      emRevisao.id,
      emRevisao.versao,
      ruim.nome,
      "Maria Aparecida de Souza",
    );

    expect(corrigido.status).toBe(DocumentStatus.EM_CONFERENCIA);
    const campoCorrigido = corrigido.campos.find((c) => c.nome === ruim.nome)!;
    expect(campoCorrigido.valor).toBe("Maria Aparecida de Souza");
    expect(campoCorrigido.origem).toBe(FieldOrigin.HUMANO);
    expect(campoCorrigido.confianca).toBe(ruim.confianca);

    // ---- 6. Confirmar → vira pronto -------------------------------------
    const confirmado = await confirmarRevisao(corrigido.id, corrigido.versao);
    expect(confirmado.status).toBe(DocumentStatus.PRONTO);

    // ---- 7. Volta ao painel como pronto ---------------------------------
    const prontos = await listarPor(`status=${DocumentStatus.PRONTO}`);
    expect(prontos.paginacao.total).toBe(1);
    expect(prontos.documentos[0].id).toBe(enviado.id);

    const emConferencia = await listarPor(`status=${DocumentStatus.EM_CONFERENCIA}`);
    expect(emConferencia.paginacao.total).toBe(0);

    // E a correção sobreviveu à releitura.
    const final = await lerDocumento(enviado.id);
    expect(final.campos.find((c) => c.nome === ruim.nome)!.valor).toBe("Maria Aparecida de Souza");
  });

  it("caminho feliz: não passa pela conferência", async () => {
    vi.spyOn(Math, "random").mockReturnValue(SORTEIO.caminhoFeliz);

    const enviado = await enviarArquivo("rg-frente-fake.png");
    processamentoConcluido();

    const documento = await lerDocumento(enviado.id);

    expect(documento.status).toBe(DocumentStatus.PRONTO);
    expect(documento.campos.every((c) => c.confianca >= CONFIDENCE_REVIEW_THRESHOLD)).toBe(true);
    expect(documento.campos.every((c) => c.origem === FieldOrigin.MODELO)).toBe(true);
  });

  it("erro de processamento: sem campos, com motivo legível", async () => {
    vi.spyOn(Math, "random").mockReturnValue(SORTEIO.erro);

    const enviado = await enviarArquivo("rg-rasurado-fake.png");
    processamentoConcluido();

    const documento = await lerDocumento(enviado.id);

    expect(documento.status).toBe(DocumentStatus.ERRO);
    expect(documento.campos).toEqual([]);
    expect(documento.erro?.mensagem).toBeTruthy();

    // E um documento com erro não entra em conferência.
    const resposta = await confirmar(
      new Request(`${BASE}/${enviado.id}/confirmar`, {
        method: "POST",
        body: JSON.stringify({ versao: documento.versao }),
      }),
      ctx(enviado.id),
    );
    expect(resposta.status).toBe(409);
  });

  it("os três desfechos convivem no painel", async () => {
    const aleatorio = vi.spyOn(Math, "random");

    aleatorio.mockReturnValue(SORTEIO.caminhoFeliz);
    await enviarArquivo("rg-frente-fake.png");
    aleatorio.mockReturnValue(SORTEIO.baixaConfianca);
    await enviarArquivo("rg-desbotado-fake.png");
    aleatorio.mockReturnValue(SORTEIO.erro);
    await enviarArquivo("rg-rasurado-fake.png");

    processamentoConcluido();
    const todos = await listarPor("tamanhoPagina=25");

    expect(todos.paginacao.total).toBe(3);
    expect(todos.documentos.map((d) => d.status).sort()).toEqual(
      [DocumentStatus.EM_CONFERENCIA, DocumentStatus.ERRO, DocumentStatus.PRONTO].sort(),
    );
  });
});

describe("o arquivo original chega à tela de revisão", () => {
  it("devolve os bytes enviados, com o tipo certo", async () => {
    vi.spyOn(Math, "random").mockReturnValue(SORTEIO.baixaConfianca);
    const enviado = await enviarArquivo("rg-frente-fake.png");

    const resposta = await obterArquivo(
      new Request(`${BASE}/${enviado.id}/arquivo`),
      ctx(enviado.id),
    );

    expect(resposta.status).toBe(200);
    expect(resposta.headers.get("content-type")).toBe("image/png");

    const bytes = new Uint8Array(await resposta.arrayBuffer());
    const original = readFileSync(join(process.cwd(), "mocks", "exemplos", "rg-frente-fake.png"));
    expect(bytes.byteLength).toBe(original.byteLength);
    // Assinatura PNG, provando que não é outro arquivo com o mesmo tamanho.
    expect([...bytes.slice(0, 4)]).toEqual([0x89, 0x50, 0x4e, 0x47]);
  });

  it("404 para documento que não existe", async () => {
    const resposta = await obterArquivo(new Request(`${BASE}/doc_9999/arquivo`), ctx("doc_9999"));
    expect(resposta.status).toBe(404);
  });
});

describe("duas pessoas na mesma conferência, via HTTP", () => {
  it("a segunda é avisada, e a versão velha leva 409 sem sobrescrever", async () => {
    vi.spyOn(Math, "random").mockReturnValue(SORTEIO.baixaConfianca);
    const enviado = await enviarArquivo("rg-desbotado-fake.png");
    processamentoConcluido();

    const visaoDeA = await abrirParaRevisao(enviado.id, REVISOR_A);
    const visaoDeB = await abrirParaRevisao(enviado.id, REVISOR_B);

    expect(visaoDeA.revisaoEmAndamento).toBeNull();
    expect(visaoDeB.revisaoEmAndamento?.revisorId).toBe(REVISOR_A);

    const alvo = visaoDeA.campos[0].nome;
    await corrigirCampo(enviado.id, visaoDeA.versao, alvo, "valor de A");

    // B ainda segura a versão que leu antes de A salvar.
    const resposta = await corrigir(
      new Request(`${BASE}/${enviado.id}/campos`, {
        method: "PATCH",
        body: JSON.stringify({
          versao: visaoDeB.versao,
          campos: [{ nome: alvo, valor: "valor de B" }],
        }),
      }),
      ctx(enviado.id),
    );

    expect(resposta.status).toBe(409);
    const conflito = (await resposta.json()) as { codigo: string; atual: Document };
    expect(conflito.codigo).toBe("versao_desatualizada");
    expect(conflito.atual.campos.find((c) => c.nome === alvo)!.valor).toBe("valor de A");

    // E o servidor guardou o valor de A, não o de B.
    const final = await lerDocumento(enviado.id);
    expect(final.campos.find((c) => c.nome === alvo)!.valor).toBe("valor de A");
  });

  it("abrir revisão sem se identificar é 400", async () => {
    vi.spyOn(Math, "random").mockReturnValue(SORTEIO.baixaConfianca);
    const enviado = await enviarArquivo("rg-desbotado-fake.png");

    const resposta = await abrirRevisao(
      new Request(`${BASE}/${enviado.id}/revisao`, { method: "POST" }),
      ctx(enviado.id),
    );

    expect(resposta.status).toBe(400);
  });
});

/**
 * O painel usa isto para a badge "N hoje": pede uma página de tamanho 1 e lê
 * `paginacao.total`. Ver docs/adr/ADR-0016.md.
 */
describe("contagem por janela de tempo, via HTTP", () => {
  it("conta a janela sem transferir a janela", async () => {
    vi.spyOn(Math, "random").mockReturnValue(SORTEIO.caminhoFeliz);
    await enviarArquivo("rg-frente-fake.png");
    await enviarArquivo("rg-verso-fake.png");

    const corte = new Date(T0).toISOString();
    const pagina = await listarPor(`desde=${encodeURIComponent(corte)}&tamanhoPagina=1`);

    expect(pagina.paginacao.total).toBe(2);
    expect(pagina.documentos).toHaveLength(1);
  });

  it("exclui o que chegou antes do corte", async () => {
    vi.spyOn(Math, "random").mockReturnValue(SORTEIO.caminhoFeliz);
    await enviarArquivo("rg-frente-fake.png");

    vi.setSystemTime(T0 + 60_000);
    const corte = new Date(T0 + 30_000).toISOString();
    await enviarArquivo("rg-verso-fake.png");

    expect((await listarPor(`desde=${encodeURIComponent(corte)}`)).paginacao.total).toBe(1);
  });

  it("um desde ilegível é 400, não um filtro ignorado em silêncio", async () => {
    const resposta = await listar(new NextRequest(`${BASE}?desde=ontem`));

    expect(resposta.status).toBe(400);
    expect(((await resposta.json()) as { codigo: string }).codigo).toBe("desde_invalido");
  });
});

// --- auxiliares que passam pelo HTTP ---------------------------------------

async function abrirParaRevisao(id: string, revisorId: string): Promise<Document> {
  const resposta = await abrirRevisao(
    new Request(`${BASE}/${id}/revisao`, {
      method: "POST",
      headers: { "x-revisor-id": revisorId },
    }),
    ctx(id),
  );
  expect(resposta.status).toBe(200);
  return (await resposta.json()) as Document;
}

async function corrigirCampo(
  id: string,
  versao: number,
  nome: string,
  valor: string,
): Promise<Document> {
  const resposta = await corrigir(
    new Request(`${BASE}/${id}/campos`, {
      method: "PATCH",
      body: JSON.stringify({ versao, campos: [{ nome, valor }] }),
    }),
    ctx(id),
  );
  expect(resposta.status).toBe(200);
  return (await resposta.json()) as Document;
}

async function confirmarRevisao(id: string, versao: number): Promise<Document> {
  const resposta = await confirmar(
    new Request(`${BASE}/${id}/confirmar`, {
      method: "POST",
      body: JSON.stringify({ versao }),
    }),
    ctx(id),
  );
  expect(resposta.status).toBe(200);
  return (await resposta.json()) as Document;
}
