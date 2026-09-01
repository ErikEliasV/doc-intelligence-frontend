"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { ApiRequestError, NetworkError, listarDocumentos } from "@/lib/api/client";
import type { DocumentListResponse, DocumentStatus } from "@/lib/api/types";
import { TAMANHO_PAGINA, decidirPolling, inicioDoDia, limitarPagina } from "./trackingList";

export type Filtro = "todos" | DocumentStatus;

/**
 * Drives the tracking panel: one page of documents, refreshed while anything on
 * it is still in flight.
 *
 * The scheduling rules live in `trackingList.ts` and are tested there. This hook
 * owns only state and the two browser things those rules need — the clock and
 * the tab's visibility.
 *
 * `setTimeout` chained per refresh, not `setInterval`: the interval changes when
 * the backoff kicks in, and a chain cannot stack requests if one is slow.
 */
export function useTrackingList() {
  const [pagina, setPagina] = useState(1);
  const [filtro, setFiltro] = useState<Filtro>("todos");
  const [dados, setDados] = useState<DocumentListResponse | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [falhasSeguidas, setFalhasSeguidas] = useState(0);
  const [atualizadoEm, setAtualizadoEm] = useState<Date | null>(null);
  const [enviadosHoje, setEnviadosHoje] = useState<number | null>(null);

  const visivel = useVisibilidadeDaAba();

  // Takes the query as arguments rather than closing over state, so its identity
  // never changes and the timer chain below is not restarted by every render.
  const buscar = useCallback(async (paginaAlvo: number, filtroAlvo: Filtro) => {
    try {
      const resposta = await listarDocumentos({
        status: filtroAlvo === "todos" ? undefined : filtroAlvo,
        pagina: paginaAlvo,
        tamanhoPagina: TAMANHO_PAGINA,
      });

      setDados(resposta);
      setErro(null);
      setFalhasSeguidas(0);
      setAtualizadoEm(new Date());

      // The server clamps an out-of-range page; follow it so the control and the
      // content agree after documents are filtered out from under the user.
      setPagina(resposta.paginacao.pagina);
    } catch (causa) {
      setFalhasSeguidas((n) => n + 1);
      setErro(
        causa instanceof ApiRequestError || causa instanceof NetworkError
          ? causa.message
          : "Não foi possível atualizar a lista.",
      );
    }
  }, []);

  /**
   * The "N hoje" badge, in its own request and deliberately non-fatal.
   *
   * `tamanhoPagina: 1` means the answer is `paginacao.total` and the payload is
   * one document, whatever the day's volume — the same property ADR-0011 wanted
   * from the page poll. A badge is not worth failing the screen over, so a
   * rejection here leaves the last known number on screen instead of turning
   * the panel into an error state.
   */
  const contarEnviadosHoje = useCallback(async () => {
    try {
      const { paginacao } = await listarDocumentos({
        desde: inicioDoDia(new Date()),
        tamanhoPagina: 1,
      });
      setEnviadosHoje(paginacao.total);
    } catch {
      // Deixa o número anterior de pé.
    }
  }, []);

  // Covers all three reasons to load: first render, a changed query, and coming
  // back to a tab that was in the background.
  //
  // The rule below cannot see through the `async` boundary. `buscar` awaits the
  // request before its first `setState`, so nothing is set synchronously in this
  // effect body — which is the cascade the rule exists to prevent. Fetching on
  // mount is the "subscribe to an external system" case the rule's own docs
  // allow; the alternative is a data library, which is a dependency and an ADR.
  useEffect(() => {
    if (!visivel) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void buscar(pagina, filtro);
    void contarEnviadosHoje();
  }, [buscar, contarEnviadosHoje, pagina, filtro, visivel]);

  const documentos = dados?.documentos ?? [];
  const decisao = decidirPolling({ documentos, visivel, falhasSeguidas });

  // Re-armed after every refresh, because `dados` changes each time.
  useEffect(() => {
    if (!decisao.ativo) return;
    const t = setTimeout(() => {
      void buscar(pagina, filtro);
      void contarEnviadosHoje();
    }, decisao.intervaloMs);
    return () => clearTimeout(t);
  }, [buscar, contarEnviadosHoje, pagina, filtro, decisao.ativo, decisao.intervaloMs, dados]);

  return {
    documentos,
    paginacao: dados?.paginacao ?? null,
    pagina,
    filtro,
    /** True only before the first answer arrives. */
    carregando: dados === null && erro === null,
    erro,
    atualizadoEm,
    /** Null until the first count arrives; the badge stays hidden meanwhile. */
    enviadosHoje,
    polling: decisao,
    irParaPagina: (p: number) => setPagina(limitarPagina(p, dados?.paginacao.totalPaginas ?? 1)),
    mudarFiltro: (novo: Filtro) => {
      setFiltro(novo);
      setPagina(1);
    },
    atualizarAgora: () => {
      void buscar(pagina, filtro);
      void contarEnviadosHoje();
    },
  };
}

/**
 * Subscribes to the tab's visibility.
 *
 * `useSyncExternalStore` rather than `useState` + an effect: visibility is an
 * external store, and this is the API for reading one without a render-phase
 * write. The server snapshot is `true` so the first paint assumes a visible tab.
 */
function useVisibilidadeDaAba(): boolean {
  return useSyncExternalStore(
    (aoMudar) => {
      document.addEventListener("visibilitychange", aoMudar);
      return () => document.removeEventListener("visibilitychange", aoMudar);
    },
    () => document.visibilityState === "visible",
    () => true,
  );
}
