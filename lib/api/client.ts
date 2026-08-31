import type {
  ApiError,
  Document,
  DocumentListResponse,
  DocumentStatus,
  UploadResponse,
} from "./types";

/**
 * The only place that knows how a request is made.
 *
 * `features/` calls these functions and never learns whether a mock or a real
 * backend answered — that is the boundary ADR-0002 set up. Pointing this at a
 * real service is a change to `BASE_URL` and nothing else.
 */
const BASE_URL = "/api";

/** A response the server refused, carrying the contract's error envelope. */
export class ApiRequestError extends Error {
  readonly codigo: string;
  readonly status: number;

  constructor(codigo: string, mensagem: string, status: number) {
    super(mensagem);
    this.name = "ApiRequestError";
    this.codigo = codigo;
    this.status = status;
  }
}

/** The request never reached the server, or the answer was unreadable. */
export class NetworkError extends Error {
  constructor(mensagem: string, options?: { cause?: unknown }) {
    super(mensagem, options);
    this.name = "NetworkError";
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${BASE_URL}${path}`, init);
  } catch (cause) {
    throw new NetworkError("Não foi possível falar com o servidor.", { cause });
  }

  if (!response.ok) {
    // A refusal should still carry the contract's envelope. When it does not —
    // a proxy error page, a crash — say so plainly instead of surfacing
    // "undefined" to the interface.
    let erro: ApiError;
    try {
      erro = (await response.json()) as ApiError;
    } catch {
      throw new ApiRequestError(
        "resposta_invalida",
        `O servidor respondeu ${response.status} sem detalhar o erro.`,
        response.status,
      );
    }
    throw new ApiRequestError(erro.codigo, erro.mensagem, response.status);
  }

  try {
    return (await response.json()) as T;
  } catch (cause) {
    throw new NetworkError("O servidor respondeu algo que não é JSON.", { cause });
  }
}

/**
 * Sends a batch. The contract accepts N files per request, but the upload
 * screen calls this one file at a time so a failure is per-file and retryable
 * — see docs/adr/ADR-0008.md.
 */
export function enviarDocumentos(arquivos: readonly File[]): Promise<UploadResponse> {
  const formData = new FormData();
  for (const arquivo of arquivos) formData.append("arquivos", arquivo);

  return request<UploadResponse>("/documents", { method: "POST", body: formData });
}

export interface ListarDocumentosParams {
  status?: DocumentStatus;
  pagina?: number;
  tamanhoPagina?: number;
}

export function listarDocumentos(params: ListarDocumentosParams = {}) {
  const query = new URLSearchParams();
  if (params.status) query.set("status", params.status);
  if (params.pagina !== undefined) query.set("pagina", String(params.pagina));
  if (params.tamanhoPagina !== undefined) {
    query.set("tamanhoPagina", String(params.tamanhoPagina));
  }

  const suffix = query.size > 0 ? `?${query}` : "";
  return request<DocumentListResponse>(`/documents${suffix}`);
}

export function obterDocumento(id: string): Promise<Document> {
  return request<Document>(`/documents/${encodeURIComponent(id)}`);
}
