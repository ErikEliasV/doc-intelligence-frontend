import { describe, expect, it } from "vitest";
import {
  CONFIDENCE_REVIEW_THRESHOLD,
  DocumentStatus,
  FieldOrigin,
  type Document,
} from "@/lib/api/types";
import { DEFAULT_SIMULATION_CONFIG, type SimulationConfig } from "./config";
import {
  DocumentSimulation,
  MAX_PAGE_SIZE,
  deriveStatus,
  type EngineDeps,
  type UploadInput,
} from "./engine";

const T0 = Date.UTC(2026, 0, 15, 12, 0, 0);
const SECOND = 1_000;

/** Deterministic PRNG, so a failing rate assertion is reproducible. */
function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A clock the test moves by hand. */
function fakeClock(start = T0) {
  let current = start;
  return {
    now: () => current,
    advance: (ms: number) => {
      current += ms;
    },
    set: (ms: number) => {
      current = ms;
    },
  };
}

function file(nome = "peticao.pdf"): UploadInput {
  return { nome, tipoMime: "application/pdf", tamanhoBytes: 128_000 };
}

function build(random: () => number, config?: Partial<SimulationConfig>) {
  const clock = fakeClock();
  const deps: EngineDeps = { now: clock.now, random };
  const sim = new DocumentSimulation({ ...DEFAULT_SIMULATION_CONFIG, ...config }, deps);
  return { sim, clock };
}

/** Constant RNG. 0.20 clears the 15% error roll but trips the 30% low-confidence roll. */
const always = (value: number) => () => value;

const ALWAYS_ERROR = always(0.0);
const ALWAYS_LOW_CONFIDENCE = always(0.2);
const ALWAYS_HIGH_CONFIDENCE = always(0.99);

describe("upload", () => {
  it("accepts a batch and starts every document in recebido", () => {
    const { sim } = build(ALWAYS_HIGH_CONFIDENCE);

    const { documentos } = sim.upload([file("a.pdf"), file("b.pdf"), file("c.pdf")]);

    expect(documentos).toHaveLength(3);
    expect(documentos.map((d) => d.nome)).toEqual(["a.pdf", "b.pdf", "c.pdf"]);
    expect(documentos.every((d) => d.status === DocumentStatus.RECEBIDO)).toBe(true);
    expect(documentos.every((d) => d.campos.length === 0 && d.erro === null)).toBe(true);
  });

  it("never fails at upload time — the model fails later", () => {
    const { sim } = build(ALWAYS_ERROR);

    const { documentos } = sim.upload([file()]);

    expect(documentos[0].status).toBe(DocumentStatus.RECEBIDO);
    expect(documentos[0].erro).toBeNull();
  });

  it("echoes the file metadata it was given", () => {
    const { sim } = build(ALWAYS_HIGH_CONFIDENCE);

    const [documento] = sim.upload([
      { nome: "contrato.png", tipoMime: "image/png", tamanhoBytes: 4_096 },
    ]).documentos;

    expect(documento).toMatchObject({
      nome: "contrato.png",
      tipoMime: "image/png",
      tamanhoBytes: 4_096,
      enviadoEm: new Date(T0).toISOString(),
    });
  });
});

describe("status transitions over time", () => {
  it("moves recebido → processando → terminal as the clock advances", () => {
    const { sim, clock } = build(ALWAYS_HIGH_CONFIDENCE);
    const [{ id }] = sim.upload([file()]).documentos;

    expect(sim.get(id)?.status).toBe(DocumentStatus.RECEBIDO);

    clock.advance(DEFAULT_SIMULATION_CONFIG.handoffMs);
    expect(sim.get(id)?.status).toBe(DocumentStatus.PROCESSANDO);

    clock.advance(DEFAULT_SIMULATION_CONFIG.maxProcessingMs);
    expect(sim.get(id)?.status).toBe(DocumentStatus.PRONTO);
  });

  it("holds no fields and no error until processing finishes", () => {
    const { sim, clock } = build(ALWAYS_HIGH_CONFIDENCE);
    const [{ id }] = sim.upload([file()]).documentos;

    clock.advance(DEFAULT_SIMULATION_CONFIG.handoffMs);
    const processando = sim.get(id)!;

    expect(processando.status).toBe(DocumentStatus.PROCESSANDO);
    expect(processando.campos).toEqual([]);
    expect(processando.erro).toBeNull();
  });

  it("stamps atualizadoEm at the transition instant, not at read time", () => {
    const { sim, clock } = build(ALWAYS_HIGH_CONFIDENCE);
    const [{ id }] = sim.upload([file()]).documentos;

    clock.advance(DEFAULT_SIMULATION_CONFIG.handoffMs);
    const atTransition = sim.get(id)!.atualizadoEm;

    clock.advance(SECOND);
    expect(sim.get(id)!.atualizadoEm).toBe(atTransition);
    expect(atTransition).toBe(new Date(T0 + DEFAULT_SIMULATION_CONFIG.handoffMs).toISOString());
  });

  it("is a pure projection of the clock — reading twice changes nothing", () => {
    const { sim, clock } = build(ALWAYS_LOW_CONFIDENCE);
    const [{ id }] = sim.upload([file()]).documentos;

    clock.advance(DEFAULT_SIMULATION_CONFIG.maxProcessingMs);

    expect(sim.get(id)).toEqual(sim.get(id));
  });

  it("settles every document within the configured 5s–40s window", () => {
    const random = mulberry32(7);
    const { sim, clock } = build(random);
    const uploaded = sim.upload(
      Array.from({ length: 200 }, (_, i) => file(`f${i}.pdf`)),
    ).documentos;

    clock.set(T0 + DEFAULT_SIMULATION_CONFIG.minProcessingMs - 1);
    const beforeWindow = uploaded.map(({ id }) => sim.get(id)!);
    expect(beforeWindow.every((d) => !isTerminal(d))).toBe(true);

    clock.set(T0 + DEFAULT_SIMULATION_CONFIG.maxProcessingMs);
    const afterWindow = uploaded.map(({ id }) => sim.get(id)!);
    expect(afterWindow.every(isTerminal)).toBe(true);
  });
});

describe("failure rate", () => {
  it("fails about 15% of documents", () => {
    const { sim, clock } = build(mulberry32(42));
    sim.upload(Array.from({ length: 4_000 }, (_, i) => file(`f${i}.pdf`)));
    clock.advance(DEFAULT_SIMULATION_CONFIG.maxProcessingMs);

    const all = settled(sim);
    const errorRate = all.filter((d) => d.status === DocumentStatus.ERRO).length / all.length;

    expect(errorRate).toBeGreaterThan(0.12);
    expect(errorRate).toBeLessThan(0.18);
  });

  it("gives failed documents an error and no fields", () => {
    const { sim, clock } = build(ALWAYS_ERROR);
    const [{ id }] = sim.upload([file()]).documentos;
    clock.advance(DEFAULT_SIMULATION_CONFIG.maxProcessingMs);

    const documento = sim.get(id)!;

    expect(documento.status).toBe(DocumentStatus.ERRO);
    expect(documento.campos).toEqual([]);
    expect(documento.erro).not.toBeNull();
    expect(documento.erro!.mensagem).not.toBe("");
  });

  it("honours a configured rate of zero", () => {
    const { sim, clock } = build(mulberry32(3), { errorRate: 0 });
    sim.upload(Array.from({ length: 300 }, (_, i) => file(`f${i}.pdf`)));
    clock.advance(DEFAULT_SIMULATION_CONFIG.maxProcessingMs);

    expect(settled(sim).some((d) => d.status === DocumentStatus.ERRO)).toBe(false);
  });
});

describe("low confidence routing", () => {
  it("routes about 30% of processed documents to em_conferencia", () => {
    const { sim, clock } = build(mulberry32(42));
    sim.upload(Array.from({ length: 4_000 }, (_, i) => file(`f${i}.pdf`)));
    clock.advance(DEFAULT_SIMULATION_CONFIG.maxProcessingMs);

    const processed = settled(sim).filter((d) => d.status !== DocumentStatus.ERRO);
    const reviewRate =
      processed.filter((d) => d.status === DocumentStatus.EM_CONFERENCIA).length / processed.length;

    expect(reviewRate).toBeGreaterThan(0.26);
    expect(reviewRate).toBeLessThan(0.34);
  });

  it("puts a document in em_conferencia exactly when a field is below the threshold", () => {
    const { sim, clock } = build(mulberry32(11));
    sim.upload(Array.from({ length: 500 }, (_, i) => file(`f${i}.pdf`)));
    clock.advance(DEFAULT_SIMULATION_CONFIG.maxProcessingMs);

    for (const documento of settled(sim)) {
      if (documento.status === DocumentStatus.ERRO) continue;

      const hasLowField = documento.campos.some(
        (campo) => campo.confianca < CONFIDENCE_REVIEW_THRESHOLD,
      );
      expect(documento.status).toBe(
        hasLowField ? DocumentStatus.EM_CONFERENCIA : DocumentStatus.PRONTO,
      );
    }
  });

  it("keeps every confidence inside 0..1", () => {
    const { sim, clock } = build(mulberry32(5));
    sim.upload(Array.from({ length: 500 }, (_, i) => file(`f${i}.pdf`)));
    clock.advance(DEFAULT_SIMULATION_CONFIG.maxProcessingMs);

    const confidences = settled(sim).flatMap((d) => d.campos.map((c) => c.confianca));

    expect(confidences.length).toBeGreaterThan(0);
    expect(confidences.every((c) => c >= 0 && c <= 1)).toBe(true);
  });

  it("returns a named value for every field", () => {
    const { sim, clock } = build(ALWAYS_LOW_CONFIDENCE);
    const [{ id }] = sim.upload([file()]).documentos;
    clock.advance(DEFAULT_SIMULATION_CONFIG.maxProcessingMs);

    const documento = sim.get(id)!;

    expect(documento.status).toBe(DocumentStatus.EM_CONFERENCIA);
    expect(documento.campos.length).toBeGreaterThan(0);
    expect(documento.campos.every((c) => c.nome !== "" && c.valor !== "")).toBe(true);
  });

  it("never sends an all-high-confidence document to review", () => {
    const { sim, clock } = build(ALWAYS_HIGH_CONFIDENCE);
    const [{ id }] = sim.upload([file()]).documentos;
    clock.advance(DEFAULT_SIMULATION_CONFIG.maxProcessingMs);

    const documento = sim.get(id)!;

    expect(documento.status).toBe(DocumentStatus.PRONTO);
    expect(documento.campos.every((c) => c.confianca >= CONFIDENCE_REVIEW_THRESHOLD)).toBe(true);
  });
});

describe("deriveStatus", () => {
  it("is the rule the backend must reproduce", () => {
    expect(
      deriveStatus([{ nome: "a", valor: "1", confianca: 0.9, origem: FieldOrigin.MODELO }]),
    ).toBe(DocumentStatus.PRONTO);
    expect(
      deriveStatus([
        {
          nome: "a",
          valor: "1",
          confianca: CONFIDENCE_REVIEW_THRESHOLD,
          origem: FieldOrigin.MODELO,
        },
      ]),
    ).toBe(DocumentStatus.PRONTO);
    expect(
      deriveStatus([
        { nome: "a", valor: "1", confianca: 0.99, origem: FieldOrigin.MODELO },
        { nome: "b", valor: "2", confianca: 0.5, origem: FieldOrigin.MODELO },
      ]),
    ).toBe(DocumentStatus.EM_CONFERENCIA);
  });

  it("treats a document with no fields as pronto", () => {
    expect(deriveStatus([])).toBe(DocumentStatus.PRONTO);
  });
});

describe("list", () => {
  it("returns newest first", () => {
    const { sim, clock } = build(ALWAYS_HIGH_CONFIDENCE);
    sim.upload([file("primeiro.pdf")]);
    clock.advance(SECOND);
    sim.upload([file("segundo.pdf")]);

    expect(sim.list().documentos.map((d) => d.nome)).toEqual(["segundo.pdf", "primeiro.pdf"]);
  });

  it("paginates and reports the totals", () => {
    const { sim } = build(ALWAYS_HIGH_CONFIDENCE);
    sim.upload(Array.from({ length: 25 }, (_, i) => file(`f${i}.pdf`)));

    const page = sim.list({ pagina: 2, tamanhoPagina: 10 });

    expect(page.documentos).toHaveLength(10);
    expect(page.paginacao).toEqual({
      pagina: 2,
      tamanhoPagina: 10,
      total: 25,
      totalPaginas: 3,
    });
  });

  it("counts the filtered set, not the whole store", () => {
    const { sim, clock } = build(ALWAYS_ERROR);
    sim.upload(Array.from({ length: 6 }, (_, i) => file(`f${i}.pdf`)));
    clock.advance(DEFAULT_SIMULATION_CONFIG.maxProcessingMs);

    expect(sim.list({ status: DocumentStatus.ERRO }).paginacao.total).toBe(6);
    expect(sim.list({ status: DocumentStatus.PRONTO }).paginacao.total).toBe(0);
  });

  it("clamps an out-of-range page instead of returning nothing", () => {
    const { sim } = build(ALWAYS_HIGH_CONFIDENCE);
    sim.upload(Array.from({ length: 5 }, (_, i) => file(`f${i}.pdf`)));

    const page = sim.list({ pagina: 99, tamanhoPagina: 10 });

    expect(page.paginacao.pagina).toBe(1);
    expect(page.documentos).toHaveLength(5);
  });

  it("reports one empty page when the store is empty", () => {
    const { sim } = build(ALWAYS_HIGH_CONFIDENCE);

    expect(sim.list()).toEqual({
      documentos: [],
      paginacao: { pagina: 1, tamanhoPagina: 20, total: 0, totalPaginas: 1 },
    });
  });
});

describe("get", () => {
  it("returns undefined for an unknown id", () => {
    const { sim } = build(ALWAYS_HIGH_CONFIDENCE);

    expect(sim.get("doc_9999")).toBeUndefined();
  });
});

describe("reset", () => {
  it("empties the store", () => {
    const { sim } = build(ALWAYS_HIGH_CONFIDENCE);
    sim.upload([file(), file()]);

    sim.reset();

    expect(sim.list().paginacao.total).toBe(0);
  });
});

function isTerminal(documento: Document): boolean {
  return (
    documento.status === DocumentStatus.PRONTO ||
    documento.status === DocumentStatus.EM_CONFERENCIA ||
    documento.status === DocumentStatus.ERRO
  );
}

/** Every document in the store, walked past pagination. */
function settled(sim: DocumentSimulation): Document[] {
  const first = sim.list({ tamanhoPagina: MAX_PAGE_SIZE });
  const documentos = [...first.documentos];
  for (let pagina = 2; pagina <= first.paginacao.totalPaginas; pagina++) {
    documentos.push(...sim.list({ pagina, tamanhoPagina: MAX_PAGE_SIZE }).documentos);
  }
  return documentos;
}
