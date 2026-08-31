/**
 * The uploaded bytes, kept so the review screen can show the original document
 * beside the extracted fields.
 *
 * A side table rather than a field on the simulation record, deliberately: the
 * engine stays synchronous and free of I/O concerns, which is what makes its
 * rules testable in Node without touching a file.
 *
 * A real backend puts these in object storage and serves a signed URL. Here
 * they live in the process and vanish on restart, like everything else in the
 * mock. See docs/adr/ADR-0006.md.
 */
export interface StoredBlob {
  bytes: Uint8Array;
  tipoMime: string;
}

/** Above this, the bytes are dropped and the viewer falls back to a placeholder. */
export const TAMANHO_MAXIMO_BYTES = 10 * 1024 * 1024;

declare global {
  // Survives the module re-evaluation Next does on hot reload, for the same
  // reason the simulation instance does.
  var __docIntelligenceBlobs: Map<string, StoredBlob> | undefined;
}

function store(): Map<string, StoredBlob> {
  globalThis.__docIntelligenceBlobs ??= new Map();
  return globalThis.__docIntelligenceBlobs;
}

export function guardarArquivo(id: string, bytes: Uint8Array, tipoMime: string): void {
  if (bytes.byteLength > TAMANHO_MAXIMO_BYTES) return;
  store().set(id, { bytes, tipoMime });
}

export function lerArquivo(id: string): StoredBlob | undefined {
  return store().get(id);
}
