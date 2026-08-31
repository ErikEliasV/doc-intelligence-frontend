import type { ApiError } from "@/lib/api/types";
import { ConflictError } from "@/mocks/simulation/engine";

/**
 * Response shapes the review endpoints share. Kept beside the routes rather
 * than in `lib/`, because these are server-side concerns: `lib/` describes the
 * contract, this produces it.
 *
 * The leading underscore keeps the folder out of the router — Next treats
 * `_`-prefixed directories as private, and a bare file here would not be a
 * route anyway.
 */
export function naoEncontrado(id: string): Response {
  return Response.json(
    {
      codigo: "documento_nao_encontrado",
      mensagem: `Documento ${id} não existe.`,
    } satisfies ApiError,
    { status: 404 },
  );
}

export function requisicaoInvalida(codigo: string, mensagem: string): Response {
  return Response.json({ codigo, mensagem } satisfies ApiError, { status: 400 });
}

/**
 * A conflict answers 409 **with the current document**, not just an error.
 * The client needs to show what the other person changed; making it re-fetch to
 * find out would be a second round trip for information we already have.
 */
export function conflito(erro: ConflictError): Response {
  return Response.json(
    { codigo: erro.codigo, mensagem: erro.message, atual: erro.atual },
    { status: 409 },
  );
}

/** Runs a review action, turning its two failure modes into responses. */
export function comConflito(id: string, acao: () => unknown): Response {
  try {
    const documento = acao();
    return documento === undefined ? naoEncontrado(id) : Response.json(documento);
  } catch (erro) {
    if (erro instanceof ConflictError) return conflito(erro);
    throw erro;
  }
}

/**
 * Identifies the browser session doing the review.
 *
 * There is no authentication in this project, so this is an opaque id the
 * client generates and keeps in `sessionStorage`. A real backend would take the
 * authenticated user and never trust a header. See docs/adr/ADR-0012.md.
 */
export const HEADER_REVISOR = "x-revisor-id";

export function revisorDaRequisicao(request: Request): string | null {
  const id = request.headers.get(HEADER_REVISOR);
  return id && id.length > 0 && id.length <= 128 ? id : null;
}
