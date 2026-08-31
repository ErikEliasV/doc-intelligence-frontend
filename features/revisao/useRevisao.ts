"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ApiRequestError,
  ConflictError,
  NetworkError,
  abrirParaRevisao,
  confirmarRevisao,
  corrigirCampos,
} from "@/lib/api/client";
import { DocumentStatus, type Document } from "@/lib/api/types";

export type Aviso = { tone: "success" | "error"; texto: string };

/**
 * Drives the review screen.
 *
 * Two ideas hold it together:
 *
 * 1. **The server's document is the truth; the edits are a draft on top.** They
 *    are kept apart so a concurrent change can be merged in without throwing
 *    away what the reviewer is in the middle of typing.
 * 2. **Saving and confirming are separate calls**, because the contract
 *    separates them: a correction never closes the document (ADR-0012).
 */
export function useRevisao(id: string) {
  const [documento, setDocumento] = useState<Document | null>(null);
  const [rascunho, setRascunho] = useState<Record<string, string>>({});
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [aviso, setAviso] = useState<Aviso | null>(null);
  const [conflito, setConflito] = useState<string | null>(null);

  useEffect(() => {
    let cancelado = false;

    void abrirParaRevisao(id)
      .then((doc) => {
        if (cancelado) return;
        setDocumento(doc);
        setErro(null);
      })
      .catch((causa: unknown) => {
        if (cancelado) return;
        setErro(mensagem(causa, "Não foi possível abrir o documento."));
      })
      .finally(() => {
        if (!cancelado) setCarregando(false);
      });

    return () => {
      cancelado = true;
    };
  }, [id]);

  /** Server values with the reviewer's unsaved edits laid over them. */
  const campos = (documento?.campos ?? []).map((campo) => ({
    ...campo,
    valor: rascunho[campo.nome] ?? campo.valor,
  }));

  const alterados = (documento?.campos ?? [])
    .filter((campo) => rascunho[campo.nome] !== undefined && rascunho[campo.nome] !== campo.valor)
    .map((campo) => ({ nome: campo.nome, valor: rascunho[campo.nome] }));

  const editarCampo = useCallback((nome: string, valor: string) => {
    setRascunho((atual) => ({ ...atual, [nome]: valor }));
    setAviso(null);
  }, []);

  /**
   * Absorbs the document the 409 came back with: the reviewer keeps their
   * unsaved edits, and the fields they had not touched pick up the other
   * person's values. Re-fetching instead would discard the draft.
   */
  const aceitarVersaoAtual = useCallback((atual: Document, texto: string) => {
    setDocumento(atual);
    setConflito(texto);
  }, []);

  const salvar = useCallback(async () => {
    if (!documento || alterados.length === 0 || salvando) return;

    setSalvando(true);
    setConflito(null);
    try {
      const atualizado = await corrigirCampos(documento.id, documento.versao, alterados);
      setDocumento(atualizado);
      setRascunho({});
      setAviso({
        tone: "success",
        texto: `${alterados.length} ${alterados.length === 1 ? "campo corrigido" : "campos corrigidos"}. O documento segue em conferência até ser confirmado.`,
      });
    } catch (causa) {
      if (causa instanceof ConflictError) {
        aceitarVersaoAtual(
          causa.atual,
          "Outra pessoa alterou este documento enquanto você editava. Os valores dela estão abaixo; confira antes de salvar de novo.",
        );
      } else {
        setAviso({ tone: "error", texto: mensagem(causa, "Não foi possível salvar.") });
      }
    } finally {
      setSalvando(false);
    }
  }, [documento, alterados, salvando, aceitarVersaoAtual]);

  const confirmar = useCallback(async () => {
    if (!documento || salvando) return;

    setSalvando(true);
    setConflito(null);
    try {
      // Unsaved edits go first, so confirming never silently drops them.
      const base =
        alterados.length > 0
          ? await corrigirCampos(documento.id, documento.versao, alterados)
          : documento;

      const confirmado = await confirmarRevisao(base.id, base.versao);
      setDocumento(confirmado);
      setRascunho({});
      setAviso({ tone: "success", texto: "Conferência concluída. O documento está pronto." });
    } catch (causa) {
      if (causa instanceof ConflictError) {
        aceitarVersaoAtual(
          causa.atual,
          causa.atual.status === DocumentStatus.PRONTO
            ? "Outra pessoa já concluiu a conferência deste documento."
            : "Outra pessoa alterou este documento. Confira os valores antes de concluir.",
        );
      } else {
        setAviso({ tone: "error", texto: mensagem(causa, "Não foi possível concluir.") });
      }
    } finally {
      setSalvando(false);
    }
  }, [documento, alterados, salvando, aceitarVersaoAtual]);

  return {
    documento,
    campos,
    carregando,
    salvando,
    erro,
    aviso,
    conflito,
    temAlteracoes: alterados.length > 0,
    concluido: documento?.status === DocumentStatus.PRONTO,
    editarCampo,
    salvar,
    confirmar,
    descartar: () => {
      setRascunho({});
      setAviso(null);
    },
    descartarAviso: () => setAviso(null),
  };
}

function mensagem(causa: unknown, padrao: string): string {
  if (causa instanceof ApiRequestError || causa instanceof NetworkError) return causa.message;
  return padrao;
}
