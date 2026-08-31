import { comConflito, requisicaoInvalida } from "@/app/api/_shared";
import type { ConfirmacaoRequest } from "@/lib/api/types";
import { getSimulation } from "@/mocks/store";

export const dynamic = "force-dynamic";

/**
 * POST /api/documents/{id}/confirmar — closes the review.
 *
 * The only thing that moves a document out of `em_conferencia`. Valid with or
 * without a prior correction: confirming an untouched document is how a
 * reviewer says the model got it right.
 */
export async function POST(
  request: Request,
  context: RouteContext<"/api/documents/[id]/confirmar">,
): Promise<Response> {
  const { id } = await context.params;

  let corpo: ConfirmacaoRequest;
  try {
    corpo = (await request.json()) as ConfirmacaoRequest;
  } catch {
    return requisicaoInvalida("corpo_invalido", "Envie um JSON com a versao lida.");
  }

  if (typeof corpo?.versao !== "number") {
    return requisicaoInvalida("corpo_invalido", "Informe a versao lida.");
  }

  return comConflito(id, () => getSimulation().confirmar(id, corpo.versao));
}
