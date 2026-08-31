import { comConflito, requisicaoInvalida, revisorDaRequisicao } from "@/app/api/_shared";
import { getSimulation } from "@/mocks/store";

export const dynamic = "force-dynamic";

/**
 * POST /api/documents/{id}/revisao — opens the document for review.
 *
 * POST, not GET, because it records presence: it tells the server "I am looking
 * at this", so the next person to open it is warned. The response is the
 * document, with `revisaoEmAndamento` filled in when somebody else got there
 * first.
 *
 * Advisory only — it never refuses. See docs/adr/ADR-0012.md.
 */
export async function POST(
  request: Request,
  context: RouteContext<"/api/documents/[id]/revisao">,
): Promise<Response> {
  const { id } = await context.params;
  const revisorId = revisorDaRequisicao(request);

  if (!revisorId) {
    return requisicaoInvalida(
      "revisor_ausente",
      "Informe quem está revisando no cabeçalho x-revisor-id.",
    );
  }

  return comConflito(id, () => getSimulation().abrirParaRevisao(id, revisorId));
}
