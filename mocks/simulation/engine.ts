import {
  CONFIDENCE_REVIEW_THRESHOLD,
  DocumentStatus,
  type Document,
  type DocumentError,
  type DocumentListResponse,
  type ExtractedField,
  type UploadResponse,
} from "@/lib/api/types";
import { CONFIDENCE_BANDS, DEFAULT_SIMULATION_CONFIG, type SimulationConfig } from "./config";
import { DOCUMENT_ERRORS, FIELDS_PER_DOCUMENT, FIELD_TEMPLATES } from "./fixtures";

/**
 * Injected clock and RNG. Both are swapped in tests, which is the whole reason
 * the simulation takes no timers: a document's fate is decided once, at upload,
 * and every later read is a pure projection of the elapsed time. That makes
 * reads idempotent, lets a test fast-forward by lying about `now`, and means no
 * state is lost when a request ends.
 */
export interface EngineDeps {
  now: () => number;
  random: () => number;
}

export interface UploadInput {
  nome: string;
  tipoMime: string;
  tamanhoBytes: number;
}

export interface ListParams {
  status?: DocumentStatus;
  pagina?: number;
  tamanhoPagina?: number;
}

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

type Outcome =
  { kind: "sucesso"; campos: ExtractedField[] } | { kind: "erro"; erro: DocumentError };

/** Immutable once created. `project()` turns it into a `Document` for a given instant. */
interface ScheduledDocument {
  seq: number;
  id: string;
  nome: string;
  tipoMime: string;
  tamanhoBytes: number;
  enviadoEmMs: number;
  processandoEmMs: number;
  concluiEmMs: number;
  outcome: Outcome;
}

function iso(ms: number): string {
  return new Date(ms).toISOString();
}

function between(random: () => number, min: number, max: number): number {
  return min + random() * (max - min);
}

function drawConfidence(random: () => number, band: { min: number; max: number }): number {
  return Math.round(between(random, band.min, band.max) * 100) / 100;
}

function pick<T>(random: () => number, items: readonly T[]): T {
  return items[Math.floor(random() * items.length)];
}

/**
 * Builds the field set for a successfully processed document.
 *
 * When `lowConfidence` is set, exactly one field is drawn from the low band, so
 * the document is guaranteed to trip the review threshold. Otherwise every
 * field is drawn from the high band, so it is guaranteed not to. That guarantee
 * is what keeps the observed `em_conferencia` rate equal to the configured one
 * instead of drifting with the field count.
 */
function generateFields(random: () => number, lowConfidence: boolean): ExtractedField[] {
  const templates = FIELD_TEMPLATES.slice(0, FIELDS_PER_DOCUMENT);
  const lowIndex = lowConfidence ? Math.floor(random() * templates.length) : -1;

  return templates.map((template, index) => ({
    nome: template.nome,
    valor: pick(random, template.valores),
    confianca: drawConfidence(
      random,
      index === lowIndex ? CONFIDENCE_BANDS.low : CONFIDENCE_BANDS.high,
    ),
  }));
}

/** The contract rule: any field below the threshold sends the document to review. */
export function deriveStatus(campos: readonly ExtractedField[]): DocumentStatus {
  return campos.some((campo) => campo.confianca < CONFIDENCE_REVIEW_THRESHOLD)
    ? DocumentStatus.EM_CONFERENCIA
    : DocumentStatus.PRONTO;
}

/** Pure: the same record and instant always produce the same document. */
function project(record: ScheduledDocument, nowMs: number): Document {
  const base = {
    id: record.id,
    nome: record.nome,
    tipoMime: record.tipoMime,
    tamanhoBytes: record.tamanhoBytes,
    enviadoEm: iso(record.enviadoEmMs),
  };

  if (nowMs < record.processandoEmMs) {
    return {
      ...base,
      status: DocumentStatus.RECEBIDO,
      atualizadoEm: iso(record.enviadoEmMs),
      campos: [],
      erro: null,
    };
  }

  if (nowMs < record.concluiEmMs) {
    return {
      ...base,
      status: DocumentStatus.PROCESSANDO,
      atualizadoEm: iso(record.processandoEmMs),
      campos: [],
      erro: null,
    };
  }

  if (record.outcome.kind === "erro") {
    return {
      ...base,
      status: DocumentStatus.ERRO,
      atualizadoEm: iso(record.concluiEmMs),
      campos: [],
      erro: record.outcome.erro,
    };
  }

  return {
    ...base,
    status: deriveStatus(record.outcome.campos),
    atualizadoEm: iso(record.concluiEmMs),
    campos: record.outcome.campos,
    erro: null,
  };
}

/**
 * In-memory stand-in for the document service. Holds no timers and no I/O, so
 * it can be driven straight from a unit test or wrapped by a route handler.
 */
export class DocumentSimulation {
  private readonly records = new Map<string, ScheduledDocument>();
  private seq = 0;

  constructor(
    private readonly config: SimulationConfig = DEFAULT_SIMULATION_CONFIG,
    private readonly deps: EngineDeps = { now: Date.now, random: Math.random },
  ) {}

  /**
   * Accepts a batch. Upload itself never fails — the 15% failure rate models the
   * extraction model, which only runs afterwards, so a document fails while
   * `processando`, never at the door.
   */
  upload(inputs: readonly UploadInput[]): UploadResponse {
    const nowMs = this.deps.now();

    const documentos = inputs.map((input) => {
      const record = this.schedule(input, nowMs);
      this.records.set(record.id, record);
      return project(record, nowMs);
    });

    return { documentos };
  }

  get(id: string): Document | undefined {
    const record = this.records.get(id);
    return record ? project(record, this.deps.now()) : undefined;
  }

  /** Newest first. Filtering happens before pagination, so `total` respects it. */
  list(params: ListParams = {}): DocumentListResponse {
    const nowMs = this.deps.now();

    const all = [...this.records.values()]
      .sort((a, b) => b.enviadoEmMs - a.enviadoEmMs || b.seq - a.seq)
      .map((record) => project(record, nowMs));

    const filtered = params.status
      ? all.filter((documento) => documento.status === params.status)
      : all;

    const tamanhoPagina = Math.min(
      Math.max(1, Math.floor(params.tamanhoPagina ?? DEFAULT_PAGE_SIZE)),
      MAX_PAGE_SIZE,
    );
    const totalPaginas = Math.max(1, Math.ceil(filtered.length / tamanhoPagina));
    const pagina = Math.min(Math.max(1, Math.floor(params.pagina ?? 1)), totalPaginas);
    const offset = (pagina - 1) * tamanhoPagina;

    return {
      documentos: filtered.slice(offset, offset + tamanhoPagina),
      paginacao: {
        pagina,
        tamanhoPagina,
        total: filtered.length,
        totalPaginas,
      },
    };
  }

  reset(): void {
    this.records.clear();
    this.seq = 0;
  }

  /**
   * Draw order is fixed and load-bearing for tests that script the RNG:
   * duration, then the error roll, then either the error pick or the
   * low-confidence roll and the field draws.
   */
  private schedule(input: UploadInput, nowMs: number): ScheduledDocument {
    const { random } = this.deps;
    const seq = ++this.seq;

    const durationMs = between(random, this.config.minProcessingMs, this.config.maxProcessingMs);
    const failed = random() < this.config.errorRate;

    let outcome: Outcome;
    if (failed) {
      outcome = { kind: "erro", erro: pick(random, DOCUMENT_ERRORS) };
    } else {
      const lowConfidence = random() < this.config.lowConfidenceRate;
      outcome = { kind: "sucesso", campos: generateFields(random, lowConfidence) };
    }

    return {
      seq,
      id: `doc_${String(seq).padStart(4, "0")}`,
      nome: input.nome,
      tipoMime: input.tipoMime,
      tamanhoBytes: input.tamanhoBytes,
      enviadoEmMs: nowMs,
      processandoEmMs: nowMs + this.config.handoffMs,
      concluiEmMs: nowMs + Math.round(durationMs),
      outcome,
    };
  }
}
