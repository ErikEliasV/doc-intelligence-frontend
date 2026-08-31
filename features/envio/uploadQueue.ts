import { ApiRequestError, NetworkError } from "@/lib/api/client";
import type { Document } from "@/lib/api/types";

/**
 * The upload queue: what the screen holds between "user picked files" and
 * "the server has them".
 *
 * Everything here is about the **upload**. What the extraction model then does
 * with a document — slow, flaky, low confidence — belongs to the tracking
 * screen and never appears in this file.
 *
 * The pure functions take no clock, no randomness and no browser API; the two
 * browser things needed (id generation, object URLs) are injected, which is
 * what lets this be tested in Node.
 */

/** Upload lifecycle, matching the design system's `FileThumb` states. */
export type UploadState = "pending" | "uploading" | "sent" | "error";

export interface QueuedFile {
  /** Local to the queue. Not the server's document id. */
  id: string;
  file: File;
  nome: string;
  tamanhoBytes: number;
  /** Object URL for images; null for anything with no previewable form. */
  previewUrl: string | null;
  state: UploadState;
  /** Human-readable, pt-BR. Non-null only when `state === "error"`. */
  erro: string | null;
  /** The server's id, once accepted. */
  documentId: string | null;
}

export interface QueueDeps {
  /** Distinct per call — two files with the same name are two queue entries. */
  makeId: () => string;
  /** Returns null when the file has no previewable form. */
  makePreviewUrl: (file: File) => string | null;
  /** Releases a preview URL. */
  revokePreviewUrl: (url: string) => void;
}

/**
 * Only images preview. A PDF would need a renderer (pdf.js) to produce a first
 * page, which is a dependency this screen does not carry — `FileThumb` falls
 * back to a file glyph. See docs/adr/ADR-0008.md.
 */
export function browserQueueDeps(): QueueDeps {
  return {
    makeId: () => crypto.randomUUID(),
    makePreviewUrl: (file) => (file.type.startsWith("image/") ? URL.createObjectURL(file) : null),
    revokePreviewUrl: (url) => URL.revokeObjectURL(url),
  };
}

export function criarItens(files: readonly File[], deps: QueueDeps): QueuedFile[] {
  return files.map((file) => ({
    id: deps.makeId(),
    file,
    nome: file.name,
    tamanhoBytes: file.size,
    previewUrl: deps.makePreviewUrl(file),
    state: "pending",
    erro: null,
    documentId: null,
  }));
}

/**
 * Appends. Deliberately does not de-duplicate by name: two scans of the same
 * document are two documents, and the office may legitimately send both.
 */
export function adicionar(fila: readonly QueuedFile[], novos: readonly QueuedFile[]): QueuedFile[] {
  return [...fila, ...novos];
}

export function atualizar(
  fila: readonly QueuedFile[],
  id: string,
  patch: Partial<Omit<QueuedFile, "id" | "file">>,
): QueuedFile[] {
  return fila.map((item) => (item.id === id ? { ...item, ...patch } : item));
}

/** Removes and releases the preview, so a long session does not leak blobs. */
export function remover(fila: readonly QueuedFile[], id: string, deps: QueueDeps): QueuedFile[] {
  const alvo = fila.find((item) => item.id === id);
  if (alvo?.previewUrl) deps.revokePreviewUrl(alvo.previewUrl);
  return fila.filter((item) => item.id !== id);
}

export function limpar(fila: readonly QueuedFile[], deps: QueueDeps): QueuedFile[] {
  for (const item of fila) {
    if (item.previewUrl) deps.revokePreviewUrl(item.previewUrl);
  }
  return [];
}

export interface QueueSummary {
  total: number;
  pendentes: number;
  enviando: number;
  enviados: number;
  comErro: number;
  /** True while any file is in flight. */
  ocupado: boolean;
}

export function resumir(fila: readonly QueuedFile[]): QueueSummary {
  const conta = (state: UploadState) => fila.filter((item) => item.state === state).length;
  const enviando = conta("uploading");

  return {
    total: fila.length,
    pendentes: conta("pending"),
    enviando,
    enviados: conta("sent"),
    comErro: conta("error"),
    ocupado: enviando > 0,
  };
}

/** What the send button acts on: anything not already accepted by the server. */
export function itensEnviaveis(fila: readonly QueuedFile[]): QueuedFile[] {
  return fila.filter((item) => item.state === "pending" || item.state === "error");
}

/**
 * Turns any thrown value into something a person can read. The design system's
 * rule for error copy: name the object and the fact, no apology.
 */
export function mensagemDeFalha(erro: unknown): string {
  if (erro instanceof ApiRequestError || erro instanceof NetworkError) return erro.message;
  if (erro instanceof Error && erro.message) return erro.message;
  return "Falha no envio.";
}

/** The single call the runner needs. Injected, so tests never touch `fetch`. */
export interface UploadPort {
  enviar(file: File): Promise<Document>;
}

export interface UploadHandlers {
  onStart(id: string): void;
  onSuccess(id: string, documentId: string): void;
  onError(id: string, mensagem: string): void;
}

export interface UploadResult {
  enviados: number;
  falhas: number;
}

/**
 * Uploads one file per request, in order.
 *
 * One request per file is what makes a per-file status honest: a batch request
 * either succeeds or fails as a whole, so a single bad file would leave the
 * other thumbnails lying. Sequential, not parallel, because the design system's
 * own copy promises it — "O envio confirma arquivo por arquivo".
 *
 * A failure never stops the run. Every file gets its attempt, and the caller
 * gets counts for both outcomes so nothing fails silently.
 */
export async function enviarFila(
  itens: readonly QueuedFile[],
  port: UploadPort,
  handlers: UploadHandlers,
): Promise<UploadResult> {
  let enviados = 0;
  let falhas = 0;

  for (const item of itens) {
    handlers.onStart(item.id);
    try {
      const documento = await port.enviar(item.file);
      handlers.onSuccess(item.id, documento.id);
      enviados++;
    } catch (erro) {
      handlers.onError(item.id, mensagemDeFalha(erro));
      falhas++;
    }
  }

  return { enviados, falhas };
}
