"use client";

import { useState } from "react";
import Link from "next/link";
import { Badge, Button, Card, Icon, ReviewerChip, StatusPill, Toast } from "@/components";
import { FieldOrigin } from "@/lib/api/types";
import { CamposExtraidos } from "./CamposExtraidos";
import { DocumentoOriginal } from "./DocumentoOriginal";
import { useRevisao } from "./useRevisao";

/**
 * Revisão e correção — the last of the three screens, and the one that closes
 * the vertical slice: a document uploaded on /envio, watched on
 * /acompanhamento, corrected and confirmed here.
 *
 * Scoped to one document type (identity card, five fields) per the brief.
 */
export function ReviewScreen({ id }: { id: string }) {
  const {
    documento,
    campos,
    carregando,
    salvando,
    erro,
    aviso,
    conflito,
    temAlteracoes,
    concluido,
    editarCampo,
    salvar,
    confirmar,
    descartar,
    descartarAviso,
  } = useRevisao(id);

  const [ativo, setAtivo] = useState<string | null>(null);

  if (carregando) {
    return <p className="type-body text-muted">Carregando documento.</p>;
  }

  if (erro || !documento) {
    return (
      <Card
        raised={false}
        className="flex items-center gap-3 border-red-600 px-4 py-3 text-red-600"
      >
        <Icon name="alert-triangle" size={16} />
        <p className="type-body-sm">{erro ?? "Documento não encontrado."}</p>
      </Card>
    );
  }

  const baixaConfianca = campos.filter(
    (campo) => campo.origem === FieldOrigin.MODELO && campo.confianca < 0.7,
  ).length;
  const outroRevisor = documento.revisaoEmAndamento;

  return (
    <div className="grid gap-6">
      <header className="grid gap-2">
        <span className="type-eyebrow text-eyebrow">Triagem</span>
        <h1 className="type-display-2">Revisão e correção</h1>
      </header>

      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(300px,420px)_1fr]">
        <DocumentoOriginal id={documento.id} nome={documento.nome} tipoMime={documento.tipoMime} />

        <div className="grid gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <StatusPill status={documento.status} />
            {!concluido && (
              <Badge tone={baixaConfianca > 0 ? "alert" : "good"}>
                {baixaConfianca > 0
                  ? `${baixaConfianca} ${baixaConfianca === 1 ? "campo abaixo" : "campos abaixo"} de 70%`
                  : "Nenhum campo abaixo de 70%"}
              </Badge>
            )}
            {outroRevisor && (
              <ReviewerChip
                name={outroRevisor.revisorId}
                note="também está nesta tela"
                className="ml-auto"
              />
            )}
          </div>

          {outroRevisor && (
            <Card
              raised={false}
              className="flex items-start gap-3 border-yellow-600 bg-yellow-100 px-4 py-3"
            >
              <Icon name="alert-triangle" size={16} />
              <p className="type-body-sm">
                Outra pessoa abriu este documento para conferência. Vocês dois podem editar; quem
                salvar por último recebe um aviso em vez de sobrescrever.
              </p>
            </Card>
          )}

          {conflito && (
            <Card
              raised={false}
              className="flex items-start gap-3 border-red-600 px-4 py-3 text-red-600"
            >
              <Icon name="alert-triangle" size={16} />
              <p className="type-body-sm">{conflito}</p>
            </Card>
          )}

          {concluido ? (
            <Card raised className="grid gap-4 p-5">
              <p className="type-body">
                Conferência concluída. Os valores abaixo são os que ficaram registrados.
              </p>
              <CamposExtraidos campos={campos} somenteLeitura />
              <p className="type-body-sm">
                <Link href="/acompanhamento">Voltar ao painel</Link>
              </p>
            </Card>
          ) : (
            <>
              <Card raised className="grid p-2">
                <CamposExtraidos
                  campos={campos}
                  ativo={ativo}
                  onFocus={setAtivo}
                  onChange={editarCampo}
                  disabled={salvando}
                />
              </Card>

              <div className="flex flex-wrap items-center gap-3">
                <Button
                  onClick={confirmar}
                  disabled={salvando}
                  iconLeft={<Icon name="check" size={14} />}
                >
                  {salvando ? "Salvando" : "Concluir conferência"}
                </Button>
                <Button variant="outline" onClick={salvar} disabled={salvando || !temAlteracoes}>
                  Salvar correções
                </Button>
                <Button variant="ghost" onClick={descartar} disabled={salvando || !temAlteracoes}>
                  Descartar
                </Button>
                <span className="type-body-sm ml-auto text-muted">
                  Salvar não conclui: o documento só sai da conferência ao concluir.
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      {aviso && (
        <div className="fixed bottom-6 left-6 z-20">
          <Toast tone={aviso.tone} onClose={descartarAviso}>
            {aviso.texto}
          </Toast>
        </div>
      )}
    </div>
  );
}
