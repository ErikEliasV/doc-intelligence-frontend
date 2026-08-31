import {
  CONFIDENCE_REVIEW_THRESHOLD,
  ConflictCode,
  DocumentStatus,
  FieldOrigin,
  type Document,
  type DocumentError,
  type DocumentListResponse,
  type ExtractedField,
  type ReviewPresence,
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

/**
 * Everything decided at upload time, plus the review state a human can change.
 *
 * The scheduling half stays immutable and `project()` remains a pure function of
 * it and the clock. The review half (`campos`, `confirmado`, `versao`,
 * `presenca`) is genuinely mutable — it is the record of what people did.
 */
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
  /** Set by a correction; overrides the extracted fields once present. */
  camposCorrigidos: ExtractedField[] | null;
  /** Set when a person changes the document; otherwise the pipeline instant wins. */
  atualizadoEmMs: number | null;
  /** Set by an explicit confirmation. Only then does the status become `pronto`. */
  confirmado: boolean;
  versao: number;
  presenca: ReviewPresence | null;
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
    origem: FieldOrigin.MODELO,
  }));
}

/**
 * The rule that splits `pronto` from `em_conferencia` **at extraction time**.
 *
 * It is not re-applied afterwards. Once a human is involved the status is
 * stored, not derived: correcting the low field must not close the document on
 * its own — only an explicit confirmation does. See docs/adr/ADR-0012.md.
 */
export function deriveStatus(campos: readonly ExtractedField[]): DocumentStatus {
  return campos.some((campo) => campo.confianca < CONFIDENCE_REVIEW_THRESHOLD)
    ? DocumentStatus.EM_CONFERENCIA
    : DocumentStatus.PRONTO;
}

/**
 * Pure: the same record and instant always produce the same document.
 *
 * The clock decides the pipeline phase; the review state decides the rest. A
 * corrected-but-unconfirmed document stays `em_conferencia` however good its
 * numbers look — closing it is a person's decision, not a threshold's.
 */
function project(record: ScheduledDocument, nowMs: number): Document {
  const base = {
    id: record.id,
    nome: record.nome,
    tipoMime: record.tipoMime,
    tamanhoBytes: record.tamanhoBytes,
    enviadoEm: iso(record.enviadoEmMs),
    versao: record.versao,
    revisaoEmAndamento: record.presenca,
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

  const campos = record.camposCorrigidos ?? record.outcome.campos;
  const statusInicial = deriveStatus(record.outcome.campos);

  return {
    ...base,
    // The threshold only ever decided the *initial* status. After that the
    // document leaves `em_conferencia` by confirmation alone.
    status:
      statusInicial === DocumentStatus.EM_CONFERENCIA && !record.confirmado
        ? DocumentStatus.EM_CONFERENCIA
        : DocumentStatus.PRONTO,
    atualizadoEm: iso(record.atualizadoEmMs ?? record.concluiEmMs),
    campos,
    erro: null,
  };
}

/**
 * Thrown by the review methods when the document cannot accept the action.
 * The route handler turns it into a 409 carrying the current document, so the
 * client can show what changed instead of guessing.
 */
export class ConflictError extends Error {
  readonly codigo: ConflictCode;
  readonly atual: Document;

  constructor(codigo: ConflictCode, mensagem: string, atual: Document) {
    super(mensagem);
    this.name = "ConflictError";
    this.codigo = codigo;
    this.atual = atual;
  }
}

/** How long a review presence lasts without being refreshed. */
export const PRESENCA_TTL_MS = 60_000;

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

  /**
   * Registers that someone opened this document for review, and reports whoever
   * else is already in it.
   *
   * Advisory, not a lock: it never refuses. A hard lock in a system with no
   * authentication and no session teardown strands documents behind whoever
   * closed their laptop — see docs/adr/ADR-0012.md.
   */
  abrirParaRevisao(id: string, revisorId: string): Document | undefined {
    const record = this.records.get(id);
    if (!record) return undefined;

    const nowMs = this.deps.now();
    const outro = record.presenca;
    const expirada = outro !== null && nowMs - Date.parse(outro.desde) > PRESENCA_TTL_MS;

    // Someone else's fresh presence is what the caller needs to see, so it is
    // left in place; ours only takes over once theirs has gone stale.
    if (outro === null || outro.revisorId === revisorId || expirada) {
      record.presenca = { revisorId, desde: iso(nowMs) };
      return { ...project(record, nowMs), revisaoEmAndamento: null };
    }

    return project(record, nowMs);
  }

  /**
   * Saves corrected values. **Does not change the status** — that is the whole
   * point of splitting correction from confirmation.
   *
   * A corrected field keeps the model's `confianca` and flips `origem` to
   * `humano`: the value became authoritative, not more confident.
   */
  corrigirCampos(
    id: string,
    versao: number,
    correcoes: readonly { nome: string; valor: string }[],
  ): Document | undefined {
    const record = this.records.get(id);
    if (!record) return undefined;

    const nowMs = this.deps.now();
    const atual = project(record, nowMs);

    this.exigirEmConferencia(atual, "Só um documento em conferência aceita correções.");
    this.exigirVersao(atual, versao);

    const base =
      record.camposCorrigidos ?? (record.outcome.kind === "sucesso" ? record.outcome.campos : []);
    const porNome = new Map(correcoes.map((c) => [c.nome, c.valor]));

    record.camposCorrigidos = base.map((campo) => {
      const novo = porNome.get(campo.nome);
      if (novo === undefined || novo === campo.valor) return campo;
      return { ...campo, valor: novo, origem: FieldOrigin.HUMANO };
    });
    record.versao += 1;
    record.atualizadoEmMs = nowMs;

    return project(record, nowMs);
  }

  /** Closes the review: `em_conferencia` → `pronto`. The only thing that does. */
  confirmar(id: string, versao: number): Document | undefined {
    const record = this.records.get(id);
    if (!record) return undefined;

    const nowMs = this.deps.now();
    const atual = project(record, nowMs);

    this.exigirEmConferencia(atual, "Só um documento em conferência pode ser confirmado.");
    this.exigirVersao(atual, versao);

    record.confirmado = true;
    record.versao += 1;
    record.atualizadoEmMs = nowMs;
    record.presenca = null;

    return project(record, nowMs);
  }

  private exigirEmConferencia(atual: Document, mensagem: string): void {
    if (atual.status !== DocumentStatus.EM_CONFERENCIA) {
      throw new ConflictError(ConflictCode.STATUS_INCOMPATIVEL, mensagem, atual);
    }
  }

  private exigirVersao(atual: Document, versao: number): void {
    if (atual.versao !== versao) {
      throw new ConflictError(
        ConflictCode.VERSAO_DESATUALIZADA,
        `O documento foi alterado por outra pessoa. Você tinha a versão ${versao}, a atual é ${atual.versao}.`,
        atual,
      );
    }
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
      camposCorrigidos: null,
      atualizadoEmMs: null,
      confirmado: false,
      versao: 1,
      presenca: null,
    };
  }
}
