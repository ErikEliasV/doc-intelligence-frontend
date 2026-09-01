import { DocumentStatus, isTerminal, type Document, type ExtractedField } from "@/lib/api/types";

/**
 * Logic behind the tracking panel: when to poll, how fast, and what a row
 * shows. Pure — no clock, no fetch, no React — so the polling rules can be
 * tested without waiting for real seconds.
 */

/**
 * Base interval between refreshes.
 *
 * 15s is the design system's own documented choice ("Atualizado agora · a cada
 * 15s" in its tracking screen). Extraction takes 5–40s, so a document is at
 * worst 15s stale; at the documented peak of ~800 documents in a day this is
 * ~480 requests per client over two hours, each returning one page.
 * See docs/adr/ADR-0011.md.
 */
export const INTERVALO_BASE_MS = 15_000;

/** Ceiling for the error backoff. */
export const INTERVALO_MAXIMO_MS = 120_000;

export const TAMANHO_PAGINA = 25;

/**
 * A page is "active" while any document on it can still change on its own.
 * `pronto`, `em_conferencia` and `erro` are terminal: once a page holds only
 * those, nothing will change until the user acts, and polling stops.
 */
export function temItensAtivos(documentos: readonly Document[]): boolean {
  return documentos.some((documento) => !isTerminal(documento.status));
}

export interface PollingEntrada {
  documentos: readonly Document[];
  /** `false` when the tab is in the background. */
  visivel: boolean;
  /** Consecutive failed refreshes. Resets to 0 on success. */
  falhasSeguidas: number;
}

export interface PollingDecisao {
  ativo: boolean;
  intervaloMs: number;
  motivo: "parado-tudo-terminal" | "parado-aba-oculta" | "ativo" | "ativo-com-recuo";
}

/**
 * Decides whether to schedule the next refresh, and how far out.
 *
 * Three rules, in order:
 *  - a hidden tab never polls — nobody is looking, and the first thing a
 *    returning user does is trigger an immediate refresh;
 *  - a page with nothing in flight never polls;
 *  - repeated failures back off exponentially, so a server that is down is not
 *    hammered every 15s by every open panel.
 */
export function decidirPolling({
  documentos,
  visivel,
  falhasSeguidas,
}: PollingEntrada): PollingDecisao {
  if (!visivel) {
    return { ativo: false, intervaloMs: INTERVALO_BASE_MS, motivo: "parado-aba-oculta" };
  }

  if (!temItensAtivos(documentos)) {
    return { ativo: false, intervaloMs: INTERVALO_BASE_MS, motivo: "parado-tudo-terminal" };
  }

  if (falhasSeguidas > 0) {
    const intervaloMs = Math.min(INTERVALO_BASE_MS * 2 ** falhasSeguidas, INTERVALO_MAXIMO_MS);
    return { ativo: true, intervaloMs, motivo: "ativo-com-recuo" };
  }

  return { ativo: true, intervaloMs: INTERVALO_BASE_MS, motivo: "ativo" };
}

/** Keeps a page number inside the range the server reported. */
export function limitarPagina(pagina: number, totalPaginas: number): number {
  if (!Number.isFinite(pagina)) return 1;
  return Math.min(Math.max(1, Math.floor(pagina)), Math.max(1, totalPaginas));
}

/**
 * The lowest confidence among a document's fields — the one that decided
 * whether it went to review. `null` while nothing has been extracted yet.
 */
export function confiancaMinima(campos: readonly ExtractedField[]): number | null {
  if (campos.length === 0) return null;
  return campos.reduce((menor, campo) => Math.min(menor, campo.confianca), Infinity);
}

/** Only documents waiting on a human open the review screen. */
export function podeAbrirRevisao(status: DocumentStatus): boolean {
  return status === DocumentStatus.EM_CONFERENCIA;
}

/**
 * When a document arrived, as the panel shows it.
 *
 * Relative under an hour, because that is the window where "how long has this
 * been sitting there" is the question being asked; clock time after that.
 * `agora` is a parameter so this is testable and so a re-render cannot show two
 * rows computed against different clocks.
 */
export function formatarRecebidoEm(iso: string, agora: Date): string {
  const quando = new Date(iso);
  if (Number.isNaN(quando.getTime())) return "—";

  const segundos = Math.floor((agora.getTime() - quando.getTime()) / 1000);

  if (segundos < 0) return formatarHora(quando);
  if (segundos < 60) return "agora";
  if (segundos < 3600) {
    const minutos = Math.floor(segundos / 60);
    return `há ${minutos} min`;
  }
  return formatarHora(quando);
}

function formatarHora(data: Date): string {
  const hh = String(data.getHours()).padStart(2, "0");
  const mm = String(data.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

/**
 * Midnight of `agora`, in the viewer's own timezone, as ISO 8601 UTC.
 *
 * Feeds the `desde` filter behind the panel's "N hoje" badge. "Hoje" is the
 * question a person in the office is asking, so the day boundary is theirs and
 * not UTC's — in Brazil the two differ by three hours, which would put a whole
 * evening's uploads in the wrong day.
 *
 * `agora` is a parameter for the same reason `formatarRecebidoEm` takes one:
 * a function that reads the clock itself cannot be tested.
 */
export function inicioDoDia(agora: Date): string {
  const meiaNoite = new Date(agora);
  meiaNoite.setHours(0, 0, 0, 0);
  return meiaNoite.toISOString();
}

/** MIME type as a short label for the list's "Tipo" column. */
export function rotuloDoTipo(tipoMime: string): string {
  if (tipoMime === "application/pdf") return "PDF";
  if (tipoMime.startsWith("image/")) return tipoMime.slice("image/".length).toUpperCase();
  return "Arquivo";
}
