"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { enviarDocumentos } from "@/lib/api/client";
import {
  adicionar,
  atualizar,
  browserQueueDeps,
  criarItens,
  enviarFila,
  itensEnviaveis,
  limpar,
  remover,
  resumir,
  type QueuedFile,
  type UploadPort,
} from "./uploadQueue";

export interface Aviso {
  tone: "success" | "error";
  texto: string;
}

/**
 * Wires the pure queue in `uploadQueue.ts` to React state and the API client.
 *
 * All the logic worth testing lives in that module; this hook only holds state
 * and owns the browser-only bits — object URLs and their release.
 */
export function useUploadQueue() {
  const [fila, setFila] = useState<QueuedFile[]>([]);
  const [aviso, setAviso] = useState<Aviso | null>(null);
  const [enviando, setEnviando] = useState(false);

  const deps = useMemo(() => browserQueueDeps(), []);

  // Mirrors `fila` so unmount cleanup sees the current queue without making
  // every callback depend on it.
  const filaRef = useRef<QueuedFile[]>([]);
  useEffect(() => {
    filaRef.current = fila;
  }, [fila]);

  // Release every object URL when the screen goes away.
  useEffect(() => {
    const atual = filaRef;
    return () => {
      for (const item of atual.current) {
        if (item.previewUrl) deps.revokePreviewUrl(item.previewUrl);
      }
    };
  }, [deps]);

  const port: UploadPort = useMemo(
    () => ({
      enviar: async (file) => {
        const { documentos } = await enviarDocumentos([file]);
        const documento = documentos[0];
        if (!documento) {
          throw new Error("O servidor aceitou o envio mas não devolveu o documento.");
        }
        return documento;
      },
    }),
    [],
  );

  const adicionarArquivos = useCallback(
    (files: File[]) => {
      setFila((atual) => adicionar(atual, criarItens(files, deps)));
      setAviso(null);
    },
    [deps],
  );

  const removerItem = useCallback(
    (id: string) => setFila((atual) => remover(atual, id, deps)),
    [deps],
  );

  const limparTudo = useCallback(() => {
    setFila((atual) => limpar(atual, deps));
    setAviso(null);
  }, [deps]);

  const enviar = useCallback(async () => {
    const pendentes = itensEnviaveis(filaRef.current);
    if (pendentes.length === 0 || enviando) return;

    setEnviando(true);
    setAviso(null);

    const { enviados, falhas } = await enviarFila(pendentes, port, {
      onStart: (id) => setFila((atual) => atualizar(atual, id, { state: "uploading", erro: null })),
      onSuccess: (id, documentId) =>
        setFila((atual) => atualizar(atual, id, { state: "sent", documentId, erro: null })),
      onError: (id, mensagem) =>
        setFila((atual) => atualizar(atual, id, { state: "error", erro: mensagem })),
    });

    setEnviando(false);
    setAviso(resumoDoEnvio(enviados, falhas));
  }, [enviando, port]);

  return {
    fila,
    resumo: resumir(fila),
    aviso,
    enviando,
    adicionarArquivos,
    removerItem,
    limparTudo,
    enviar,
    descartarAviso: () => setAviso(null),
  };
}

/**
 * Copy follows the design system: state the fact and what happens next, then
 * stop. No apology, no exclamation mark, no emoji.
 */
function resumoDoEnvio(enviados: number, falhas: number): Aviso {
  const plural = (n: number, um: string, muitos: string) => (n === 1 ? um : muitos);

  if (falhas === 0) {
    return {
      tone: "success",
      texto: `${enviados} ${plural(enviados, "documento enviado", "documentos enviados")}. O processamento continua em segundo plano.`,
    };
  }

  if (enviados === 0) {
    return {
      tone: "error",
      texto: `${falhas} ${plural(falhas, "arquivo falhou", "arquivos falharam")}. Nenhum documento foi enviado.`,
    };
  }

  return {
    tone: "error",
    texto: `${enviados} ${plural(enviados, "documento enviado", "documentos enviados")}, ${falhas} ${plural(falhas, "falhou", "falharam")}. Reenvie os que falharam.`,
  };
}
