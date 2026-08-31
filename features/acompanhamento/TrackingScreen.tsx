"use client";

import { useRouter } from "next/navigation";
import { Card, DocumentRow, EmptyState, Icon, Pagination, Tabs } from "@/components";
import { DocumentStatus } from "@/lib/api/types";
import {
  INTERVALO_BASE_MS,
  TAMANHO_PAGINA,
  confiancaMinima,
  formatarRecebidoEm,
  podeAbrirRevisao,
  rotuloDoTipo,
} from "./trackingList";
import { useTrackingList, type Filtro } from "./useTrackingList";

/**
 * Painel de acompanhamento.
 *
 * One page of documents at a time — never the whole backlog. At the documented
 * peak of ~800 documents the DOM holds 25 rows and the poll payload is one
 * page, both independent of the total. See docs/adr/ADR-0011.md.
 */
const ABAS: readonly { value: Filtro; label: string }[] = [
  { value: "todos", label: "Todos" },
  { value: DocumentStatus.EM_CONFERENCIA, label: "Em conferência" },
  { value: DocumentStatus.ERRO, label: "Erros" },
];

const COLUNAS = ["Documento", "Tipo", "Recebido", "Status", "Confiança", ""];

export function TrackingScreen() {
  const router = useRouter();
  const {
    documentos,
    paginacao,
    pagina,
    filtro,
    carregando,
    erro,
    atualizadoEm,
    polling,
    irParaPagina,
    mudarFiltro,
    atualizarAgora,
  } = useTrackingList();

  const agora = atualizadoEm ?? new Date();

  return (
    <div className="grid max-w-content gap-5">
      <header className="grid gap-2">
        <span className="type-eyebrow text-eyebrow">Triagem</span>
        <h1 className="type-display-2">Painel de acompanhamento</h1>
      </header>

      <div className="flex flex-wrap items-center justify-between gap-6">
        <Tabs items={ABAS} value={filtro} onChange={mudarFiltro} className="flex-1" />

        <button
          type="button"
          onClick={atualizarAgora}
          className="type-body-sm inline-flex cursor-pointer items-center gap-2 border-0 bg-transparent whitespace-nowrap text-muted hover:text-display"
        >
          <Icon name="refresh-cw" size={13} />
          {legendaDeAtualizacao(polling.motivo, atualizadoEm, agora)}
        </button>
      </div>

      {erro && (
        <Card
          raised={false}
          className="flex items-center gap-3 border-red-600 px-4 py-3 text-red-600"
        >
          <Icon name="alert-triangle" size={16} />
          <p className="type-body-sm">
            {erro}
            {polling.motivo === "ativo-com-recuo" &&
              ` Nova tentativa em ${Math.round(polling.intervaloMs / 1000)}s.`}
          </p>
        </Card>
      )}

      <Card raised className="p-0">
        <div className="type-eyebrow grid grid-cols-[1fr_150px_132px_150px_118px_28px] items-center gap-4 border-b border-line-strong px-4 py-3 text-muted">
          {COLUNAS.map((coluna, i) => (
            <span key={i}>{coluna}</span>
          ))}
        </div>

        {documentos.length === 0 ? (
          <EmptyState
            icon={filtro === DocumentStatus.ERRO ? "alert-triangle" : "inbox"}
            title={carregando ? "Carregando" : "Nenhum documento"}
            body={
              carregando
                ? undefined
                : filtro === "todos"
                  ? "Nada foi enviado ainda. Comece pelo envio de documentos."
                  : "Nenhum documento neste status."
            }
          />
        ) : (
          documentos.map((documento) => (
            <DocumentRow
              key={documento.id}
              name={documento.nome}
              type={rotuloDoTipo(documento.tipoMime)}
              receivedAt={formatarRecebidoEm(documento.enviadoEm, agora)}
              status={documento.status}
              confidence={confiancaMinima(documento.campos)}
              onOpen={
                podeAbrirRevisao(documento.status)
                  ? () => router.push(`/revisao/${documento.id}`)
                  : undefined
              }
            />
          ))
        )}
      </Card>

      {paginacao && paginacao.total > 0 && (
        <Pagination
          page={pagina}
          pageCount={paginacao.totalPaginas}
          total={paginacao.total}
          pageSize={TAMANHO_PAGINA}
          onChange={irParaPagina}
        />
      )}
    </div>
  );
}

/**
 * Says what the panel is doing, in the design system's register: the fact,
 * then what happens next. Never "Tudo certo!".
 */
function legendaDeAtualizacao(
  motivo: ReturnType<typeof useTrackingList>["polling"]["motivo"],
  atualizadoEm: Date | null,
  agora: Date,
): string {
  if (motivo === "parado-tudo-terminal") {
    return "Nada em processamento · atualizar";
  }
  if (motivo === "parado-aba-oculta") {
    return "Pausado em segundo plano";
  }
  if (motivo === "ativo-com-recuo") {
    return "Falha ao atualizar · tentar agora";
  }

  const segundos = atualizadoEm
    ? Math.max(0, Math.floor((agora.getTime() - atualizadoEm.getTime()) / 1000))
    : null;
  const quando = segundos === null ? "" : segundos < 5 ? "Atualizado agora" : `Há ${segundos}s`;

  return `${quando} · a cada ${INTERVALO_BASE_MS / 1000}s`;
}
