import { comConflito, requisicaoInvalida } from "@/app/api/_shared";
import type { CorrecaoCamposRequest } from "@/lib/api/types";
import { getSimulation } from "@/mocks/store";

export const dynamic = "force-dynamic";

/**
 * PATCH /api/documents/{id}/campos — saves corrected values.
 *
 * Partial: only the fields being corrected, matched by `nome` (unique within a
 * document, per the contract). Sending `versao` is mandatory — it is what turns
 * a concurrent edit into a 409 instead of a silent overwrite.
 *
 * **Never changes the status.** A corrected document stays in `em_conferencia`
 * until somebody confirms it.
 */
export async function PATCH(
  request: Request,
  context: RouteContext<"/api/documents/[id]/campos">,
): Promise<Response> {
  const { id } = await context.params;

  let corpo: CorrecaoCamposRequest;
  try {
    corpo = (await request.json()) as CorrecaoCamposRequest;
  } catch {
    return requisicaoInvalida("corpo_invalido", "Envie um JSON com versao e campos.");
  }

  if (typeof corpo?.versao !== "number" || !Array.isArray(corpo?.campos)) {
    return requisicaoInvalida("corpo_invalido", "Informe a versao lida e a lista de campos.");
  }

  const invalido = corpo.campos.some(
    (campo) => typeof campo?.nome !== "string" || typeof campo?.valor !== "string",
  );
  if (invalido) {
    return requisicaoInvalida("campo_invalido", "Cada campo precisa de nome e valor em texto.");
  }

  return comConflito(id, () => getSimulation().corrigirCampos(id, corpo.versao, corpo.campos));
}
