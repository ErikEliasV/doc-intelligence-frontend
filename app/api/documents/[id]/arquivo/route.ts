import { naoEncontrado } from "@/app/api/_shared";
import { lerArquivo } from "@/mocks/blobStore";

export const dynamic = "force-dynamic";

/**
 * GET /api/documents/{id}/arquivo — the uploaded bytes, for the review viewer.
 *
 * A real backend would answer a signed URL to object storage instead of
 * streaming from the API process.
 */
export async function GET(
  _request: Request,
  context: RouteContext<"/api/documents/[id]/arquivo">,
): Promise<Response> {
  const { id } = await context.params;
  const arquivo = lerArquivo(id);

  if (!arquivo) return naoEncontrado(id);

  return new Response(arquivo.bytes as BodyInit, {
    headers: {
      "content-type": arquivo.tipoMime,
      "content-length": String(arquivo.bytes.byteLength),
      "cache-control": "private, max-age=3600",
    },
  });
}
