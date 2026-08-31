import { describe, expect, it } from "vitest";
import {
  CONFIDENCE_REVIEW_THRESHOLD,
  ConflictCode,
  DocumentStatus,
  FieldOrigin,
  type Document,
} from "@/lib/api/types";
import { DEFAULT_SIMULATION_CONFIG } from "./config";
import { ConflictError, DocumentSimulation, PRESENCA_TTL_MS, type EngineDeps } from "./engine";

const T0 = Date.UTC(2026, 0, 15, 12, 0, 0);

function fakeClock(start = T0) {
  let atual = start;
  return { now: () => atual, advance: (ms: number) => void (atual += ms) };
}

/** 0.20 clears the 15% error roll but trips the 30% low-confidence roll. */
const SEMPRE_CONFERENCIA = () => 0.2;
const SEMPRE_PRONTO = () => 0.99;

function build(random: () => number = SEMPRE_CONFERENCIA) {
  const clock = fakeClock();
  const deps: EngineDeps = { now: clock.now, random };
  return { sim: new DocumentSimulation(DEFAULT_SIMULATION_CONFIG, deps), clock };
}

const rg = { nome: "rg-maria.jpg", tipoMime: "image/jpeg", tamanhoBytes: 240_000 };

/** Uploads one document and runs the clock out so it reaches a terminal status. */
function documentoProcessado(random?: () => number) {
  const { sim, clock } = build(random);
  const [{ id }] = sim.upload([rg]).documentos;
  clock.advance(DEFAULT_SIMULATION_CONFIG.maxProcessingMs);
  return { sim, clock, id };
}

function campoDeBaixaConfianca(documento: Document) {
  const campo = documento.campos.find((c) => c.confianca < CONFIDENCE_REVIEW_THRESHOLD);
  if (!campo) throw new Error("esperava um campo abaixo do limiar");
  return campo;
}

describe("fluxo completo de revisão", () => {
  it("carrega em conferência, edita um campo, confirma, e o status vira pronto", () => {
    const { sim, id } = documentoProcessado();

    // 1. O documento chega para revisão porque um campo ficou abaixo do limiar.
    const emConferencia = sim.abrirParaRevisao(id, "revisor-a")!;
    expect(emConferencia.status).toBe(DocumentStatus.EM_CONFERENCIA);
    expect(emConferencia.campos).toHaveLength(5);

    const ruim = campoDeBaixaConfianca(emConferencia);
    expect(ruim.origem).toBe(FieldOrigin.MODELO);

    // 2. A correção salva o valor e NÃO fecha o documento.
    const corrigido = sim.corrigirCampos(id, emConferencia.versao, [
      { nome: ruim.nome, valor: "Maria Aparecida de Souza" },
    ])!;

    expect(corrigido.status).toBe(DocumentStatus.EM_CONFERENCIA);
    const campoCorrigido = corrigido.campos.find((c) => c.nome === ruim.nome)!;
    expect(campoCorrigido.valor).toBe("Maria Aparecida de Souza");
    expect(campoCorrigido.origem).toBe(FieldOrigin.HUMANO);
    expect(campoCorrigido.confianca).toBe(ruim.confianca);

    // 3. A confirmação explícita é o que fecha.
    const confirmado = sim.confirmar(id, corrigido.versao)!;
    expect(confirmado.status).toBe(DocumentStatus.PRONTO);

    // 4. E fica fechado.
    expect(sim.get(id)!.status).toBe(DocumentStatus.PRONTO);
    expect(sim.get(id)!.campos.find((c) => c.nome === ruim.nome)!.valor).toBe(
      "Maria Aparecida de Souza",
    );
  });

  it("corrigir sozinho nunca fecha o documento, por melhor que fique", () => {
    const { sim, id } = documentoProcessado();
    const inicial = sim.get(id)!;
    const ruim = campoDeBaixaConfianca(inicial);

    const depois = sim.corrigirCampos(id, inicial.versao, [
      { nome: ruim.nome, valor: "valor perfeito" },
    ])!;

    expect(depois.status).toBe(DocumentStatus.EM_CONFERENCIA);
  });

  it("confirmar sem corrigir nada é permitido — o modelo pode ter acertado", () => {
    const { sim, id } = documentoProcessado();
    const inicial = sim.get(id)!;

    const confirmado = sim.confirmar(id, inicial.versao)!;

    expect(confirmado.status).toBe(DocumentStatus.PRONTO);
    expect(confirmado.campos.every((c) => c.origem === FieldOrigin.MODELO)).toBe(true);
  });

  it("preserva a confiança do modelo no campo corrigido, como trilha de auditoria", () => {
    const { sim, id } = documentoProcessado();
    const inicial = sim.get(id)!;
    const ruim = campoDeBaixaConfianca(inicial);

    const depois = sim.corrigirCampos(id, inicial.versao, [{ nome: ruim.nome, valor: "novo" }])!;

    expect(depois.campos.find((c) => c.nome === ruim.nome)!.confianca).toBeLessThan(
      CONFIDENCE_REVIEW_THRESHOLD,
    );
  });

  it("não mexe nos campos que não foram corrigidos", () => {
    const { sim, id } = documentoProcessado();
    const inicial = sim.get(id)!;
    const ruim = campoDeBaixaConfianca(inicial);

    const depois = sim.corrigirCampos(id, inicial.versao, [{ nome: ruim.nome, valor: "novo" }])!;

    for (const campo of depois.campos) {
      if (campo.nome === ruim.nome) continue;
      expect(campo).toEqual(inicial.campos.find((c) => c.nome === campo.nome));
    }
  });

  it("avança a versão a cada mudança", () => {
    const { sim, id } = documentoProcessado();
    const v1 = sim.get(id)!.versao;
    const ruim = campoDeBaixaConfianca(sim.get(id)!);

    const v2 = sim.corrigirCampos(id, v1, [{ nome: ruim.nome, valor: "a" }])!.versao;
    const v3 = sim.confirmar(id, v2)!.versao;

    expect(v2).toBeGreaterThan(v1);
    expect(v3).toBeGreaterThan(v2);
  });

  it("devolve undefined para documento inexistente", () => {
    const { sim } = build();

    expect(sim.abrirParaRevisao("doc_9999", "revisor-a")).toBeUndefined();
    expect(sim.corrigirCampos("doc_9999", 1, [])).toBeUndefined();
    expect(sim.confirmar("doc_9999", 1)).toBeUndefined();
  });
});

describe("duas pessoas no mesmo documento", () => {
  it("avisa a segunda pessoa que alguém já está revisando", () => {
    const { sim, id } = documentoProcessado();

    const primeira = sim.abrirParaRevisao(id, "revisor-a")!;
    const segunda = sim.abrirParaRevisao(id, "revisor-b")!;

    expect(primeira.revisaoEmAndamento).toBeNull();
    expect(segunda.revisaoEmAndamento).toEqual({
      revisorId: "revisor-a",
      desde: new Date(T0 + DEFAULT_SIMULATION_CONFIG.maxProcessingMs).toISOString(),
    });
  });

  it("não avisa a própria pessoa que reabriu", () => {
    const { sim, id } = documentoProcessado();

    sim.abrirParaRevisao(id, "revisor-a");

    expect(sim.abrirParaRevisao(id, "revisor-a")!.revisaoEmAndamento).toBeNull();
  });

  it("o aviso expira — quem fechou o notebook não trava o documento", () => {
    const { sim, clock, id } = documentoProcessado();
    sim.abrirParaRevisao(id, "revisor-a");

    clock.advance(PRESENCA_TTL_MS + 1);

    expect(sim.abrirParaRevisao(id, "revisor-b")!.revisaoEmAndamento).toBeNull();
  });

  it("o aviso não bloqueia: a segunda pessoa ainda consegue corrigir", () => {
    const { sim, id } = documentoProcessado();
    sim.abrirParaRevisao(id, "revisor-a");
    const visaoDeB = sim.abrirParaRevisao(id, "revisor-b")!;
    const ruim = campoDeBaixaConfianca(visaoDeB);

    const depois = sim.corrigirCampos(id, visaoDeB.versao, [{ nome: ruim.nome, valor: "de B" }])!;

    expect(depois.campos.find((c) => c.nome === ruim.nome)!.valor).toBe("de B");
  });
});

describe("lock otimista", () => {
  it("recusa a correção de quem está com versão velha", () => {
    const { sim, id } = documentoProcessado();
    const versaoDeAmbos = sim.get(id)!.versao;
    const ruim = campoDeBaixaConfianca(sim.get(id)!);

    // A salva primeiro.
    sim.corrigirCampos(id, versaoDeAmbos, [{ nome: ruim.nome, valor: "de A" }]);

    // B ainda está com a versão que leu antes.
    expect(() =>
      sim.corrigirCampos(id, versaoDeAmbos, [{ nome: ruim.nome, valor: "de B" }]),
    ).toThrowError(ConflictError);
  });

  it("o conflito carrega o código e o documento atual, para a tela mostrar o que mudou", () => {
    const { sim, id } = documentoProcessado();
    const versao = sim.get(id)!.versao;
    const ruim = campoDeBaixaConfianca(sim.get(id)!);
    sim.corrigirCampos(id, versao, [{ nome: ruim.nome, valor: "de A" }]);

    try {
      sim.corrigirCampos(id, versao, [{ nome: ruim.nome, valor: "de B" }]);
      expect.unreachable("deveria ter conflitado");
    } catch (erro) {
      expect(erro).toBeInstanceOf(ConflictError);
      const conflito = erro as ConflictError;
      expect(conflito.codigo).toBe(ConflictCode.VERSAO_DESATUALIZADA);
      expect(conflito.atual.campos.find((c) => c.nome === ruim.nome)!.valor).toBe("de A");
    }
  });

  it("não perde a correção de A quando B tenta escrever por cima", () => {
    const { sim, id } = documentoProcessado();
    const versao = sim.get(id)!.versao;
    const ruim = campoDeBaixaConfianca(sim.get(id)!);
    sim.corrigirCampos(id, versao, [{ nome: ruim.nome, valor: "de A" }]);

    try {
      sim.corrigirCampos(id, versao, [{ nome: ruim.nome, valor: "de B" }]);
    } catch {
      // esperado
    }

    expect(sim.get(id)!.campos.find((c) => c.nome === ruim.nome)!.valor).toBe("de A");
  });

  it("recusa a confirmação de quem está com versão velha", () => {
    const { sim, id } = documentoProcessado();
    const versao = sim.get(id)!.versao;
    const ruim = campoDeBaixaConfianca(sim.get(id)!);
    sim.corrigirCampos(id, versao, [{ nome: ruim.nome, valor: "de A" }]);

    expect(() => sim.confirmar(id, versao)).toThrowError(ConflictError);
  });

  it("depois de confirmado, corrigir de novo é conflito de status", () => {
    const { sim, id } = documentoProcessado();
    const confirmado = sim.confirmar(id, sim.get(id)!.versao)!;

    try {
      sim.corrigirCampos(id, confirmado.versao, [{ nome: "Nome", valor: "x" }]);
      expect.unreachable("deveria ter conflitado");
    } catch (erro) {
      expect((erro as ConflictError).codigo).toBe(ConflictCode.STATUS_INCOMPATIVEL);
    }
  });

  it("um documento pronto não entra em revisão", () => {
    const { sim, id } = documentoProcessado(SEMPRE_PRONTO);
    const pronto = sim.get(id)!;
    expect(pronto.status).toBe(DocumentStatus.PRONTO);

    expect(() => sim.confirmar(id, pronto.versao)).toThrowError(ConflictError);
  });
});
