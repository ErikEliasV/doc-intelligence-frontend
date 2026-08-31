/**
 * DOC Intelligence — API contract.
 *
 * This is the source of truth for the shape a real backend must implement.
 * The normative specification lives in `docs/api/openapi.yaml`; this file and
 * that document describe the same contract and must be changed together.
 *
 * Wire vocabulary is Brazilian Portuguese (property names and enum values),
 * matching the product language. Type names stay English, as does all other
 * code in the repo. See docs/adr/ADR-0005.md.
 */

/**
 * Lifecycle of a document in triage.
 *
 * ```
 * recebido ──▶ processando ──┬──▶ pronto
 *                            ├──▶ em_conferencia   (any field below threshold)
 *                            └──▶ erro
 * ```
 *
 * Terminal states are `pronto`, `em_conferencia` and `erro`. The backend owns
 * every transition; a client never derives status locally.
 *
 * Declared as a const object rather than a TypeScript `enum` because the
 * project sets `isolatedModules: true`, and because the mock needs the values
 * as a real runtime array. The exported type is still a closed union.
 */
export const DocumentStatus = {
  RECEBIDO: "recebido",
  PROCESSANDO: "processando",
  PRONTO: "pronto",
  ERRO: "erro",
  EM_CONFERENCIA: "em_conferencia",
} as const;

export type DocumentStatus = (typeof DocumentStatus)[keyof typeof DocumentStatus];

export const DOCUMENT_STATUSES: readonly DocumentStatus[] = Object.values(DocumentStatus);

/** States a document can no longer move out of. */
export const TERMINAL_STATUSES: readonly DocumentStatus[] = [
  DocumentStatus.PRONTO,
  DocumentStatus.EM_CONFERENCIA,
  DocumentStatus.ERRO,
];

export function isTerminal(status: DocumentStatus): boolean {
  return TERMINAL_STATUSES.includes(status);
}

/**
 * One value the extraction model read off a document.
 *
 * `confianca` is the model's self-reported certainty, 0..1 inclusive. A
 * document with any field below `CONFIDENCE_REVIEW_THRESHOLD` is routed to
 * `em_conferencia` rather than `pronto`.
 */
export interface ExtractedField {
  /** Human label, as shown in the interface. Unique within a document. */
  nome: string;
  /** Always a string on the wire — formatting and parsing belong to the client. */
  valor: string;
  /** 0..1 inclusive. */
  confianca: number;
}

/**
 * The rule that splits `pronto` from `em_conferencia`. Part of the contract:
 * a real backend must apply this same threshold so the two agree.
 */
export const CONFIDENCE_REVIEW_THRESHOLD = 0.75;

/** Why processing failed. Only present when `status === "erro"`. */
export interface DocumentError {
  /** Stable, machine-readable. Clients switch on this, never on `mensagem`. */
  codigo: DocumentErrorCode;
  /** Human-readable, pt-BR, states the fact without apology. */
  mensagem: string;
}

export const DocumentErrorCode = {
  /** The extraction model did not answer in time. */
  MODELO_INDISPONIVEL: "modelo_indisponivel",
  /** The model answered, but the document could not be read. */
  DOCUMENTO_ILEGIVEL: "documento_ilegivel",
} as const;

export type DocumentErrorCode = (typeof DocumentErrorCode)[keyof typeof DocumentErrorCode];

/** A document under triage. */
export interface Document {
  id: string;
  /** Original filename, as sent. */
  nome: string;
  tipoMime: string;
  tamanhoBytes: number;
  status: DocumentStatus;
  /** ISO 8601, UTC. */
  enviadoEm: string;
  /** ISO 8601, UTC. Changes on every status transition. */
  atualizadoEm: string;
  /** Empty until the document reaches `pronto` or `em_conferencia`. */
  campos: ExtractedField[];
  /** Non-null only when `status === "erro"`. */
  erro: DocumentError | null;
}

/** Result of `POST /api/documents`. One entry per accepted file, order preserved. */
export interface UploadResponse {
  documentos: Document[];
}

export interface Pagination {
  pagina: number;
  tamanhoPagina: number;
  total: number;
  totalPaginas: number;
}

/** Result of `GET /api/documents`. */
export interface DocumentListResponse {
  documentos: Document[];
  paginacao: Pagination;
}

/** Error envelope for non-2xx responses. */
export interface ApiError {
  codigo: string;
  mensagem: string;
}
