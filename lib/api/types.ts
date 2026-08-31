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
  /**
   * 0..1 inclusive. **Always the model's own number**, never overwritten by a
   * correction: a value a person typed did not become more confident, it became
   * authoritative. `origem` is what says so. Keeping the model's figure is the
   * audit trail of where it failed.
   */
  confianca: number;
  origem: FieldOrigin;
}

export const FieldOrigin = {
  MODELO: "modelo",
  HUMANO: "humano",
} as const;

export type FieldOrigin = (typeof FieldOrigin)[keyof typeof FieldOrigin];

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

/** Conflict codes returned as 409 by the review endpoints. */
export const ConflictCode = {
  /** The document moved on since the client read it. */
  VERSAO_DESATUALIZADA: "versao_desatualizada",
  /** The action does not apply to the document's current status. */
  STATUS_INCOMPATIVEL: "status_incompativel",
} as const;

export type ConflictCode = (typeof ConflictCode)[keyof typeof ConflictCode];

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
  /**
   * Bumped on every server-side change. A client sends the version it read back
   * with a correction; a mismatch is a 409 rather than a silent overwrite.
   * See docs/adr/ADR-0012.md.
   */
  versao: number;
  /**
   * Who else has this document open for review, if anyone. Advisory: it warns,
   * it does not block. Null when nobody else is in it.
   */
  revisaoEmAndamento: ReviewPresence | null;
}

/** Someone else holding the review screen open on this document. */
export interface ReviewPresence {
  /**
   * Opaque per-session id. There is no authentication in this project, so the
   * mock cannot name a person; a real backend would carry the user.
   */
  revisorId: string;
  /** ISO 8601, UTC — when they opened it. */
  desde: string;
}

/** Body of `PATCH /documents/{id}/campos`. Only the fields being corrected. */
export interface CorrecaoCamposRequest {
  /** The version the client read. A mismatch is a 409. */
  versao: number;
  campos: readonly { nome: string; valor: string }[];
}

/** Body of `POST /documents/{id}/confirmar`. */
export interface ConfirmacaoRequest {
  versao: number;
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
