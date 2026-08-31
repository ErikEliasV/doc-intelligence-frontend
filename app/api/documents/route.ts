import type { NextRequest } from "next/server";
import { DOCUMENT_STATUSES, type ApiError, type DocumentStatus } from "@/lib/api/types";
import { guardarArquivo } from "@/mocks/blobStore";
import { getSimulation } from "@/mocks/store";

/** The store is mutable per-process state; caching a read of it would be wrong. */
export const dynamic = "force-dynamic";

function badRequest(codigo: string, mensagem: string): Response {
  return Response.json({ codigo, mensagem } satisfies ApiError, { status: 400 });
}

function parsePositiveInt(value: string | null): number | undefined {
  if (value === null) return undefined;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
}

/**
 * GET /api/documents — the tracking panel's poll.
 *
 * Query: `status`, `pagina`, `tamanhoPagina`. Unparseable numbers fall back to
 * the defaults; an unknown `status` is a 400, because silently ignoring it
 * would show the caller a list that does not match what it asked for.
 */
export async function GET(request: NextRequest): Promise<Response> {
  const params = request.nextUrl.searchParams;
  const status = params.get("status");

  if (status !== null && !DOCUMENT_STATUSES.includes(status as DocumentStatus)) {
    return badRequest(
      "status_invalido",
      `Status desconhecido: ${status}. Valores aceitos: ${DOCUMENT_STATUSES.join(", ")}.`,
    );
  }

  return Response.json(
    getSimulation().list({
      status: (status as DocumentStatus | null) ?? undefined,
      pagina: parsePositiveInt(params.get("pagina")),
      tamanhoPagina: parsePositiveInt(params.get("tamanhoPagina")),
    }),
  );
}

/**
 * POST /api/documents — batch upload, `multipart/form-data`, repeated field
 * `arquivos`.
 *
 * Answers 202, not 201: the documents exist, but nothing has been extracted
 * yet. The caller polls GET to watch them move out of `recebido`.
 */
export async function POST(request: NextRequest): Promise<Response> {
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return badRequest("corpo_invalido", "Envie os arquivos como multipart/form-data.");
  }

  const arquivos = formData.getAll("arquivos").filter((value) => value instanceof File);

  if (arquivos.length === 0) {
    return badRequest("nenhum_arquivo", "Nenhum arquivo recebido no campo 'arquivos'.");
  }

  const resposta = getSimulation().upload(
    arquivos.map((arquivo) => ({
      nome: arquivo.name,
      tipoMime: arquivo.type || "application/octet-stream",
      tamanhoBytes: arquivo.size,
    })),
  );

  // The bytes are kept so the review screen can show the original beside the
  // extracted fields. Order is guaranteed: `upload` preserves it.
  await Promise.all(
    resposta.documentos.map(async (documento, indice) => {
      const arquivo = arquivos[indice];
      guardarArquivo(documento.id, new Uint8Array(await arquivo.arrayBuffer()), documento.tipoMime);
    }),
  );

  return Response.json(resposta, { status: 202 });
}
