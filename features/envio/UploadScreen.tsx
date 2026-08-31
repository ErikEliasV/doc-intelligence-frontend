"use client";

import { Button, Card, DropZone, FileThumb, Icon, Toast } from "@/components";
import { formatarTamanho } from "./formatarTamanho";
import { useUploadQueue } from "./useUploadQueue";

/**
 * Envio de documentos.
 *
 * Scope note: everything here is about getting bytes to the server. The
 * extraction that follows — slow, sometimes failing, sometimes low confidence —
 * is the tracking screen's job, and this screen deliberately says so in the
 * note at the bottom rather than pretending the work is done.
 */
export function UploadScreen() {
  const {
    fila,
    resumo,
    aviso,
    enviando,
    adicionarArquivos,
    removerItem,
    limparTudo,
    enviar,
    descartarAviso,
  } = useUploadQueue();

  const podeEnviar = resumo.pendentes + resumo.comErro > 0 && !enviando;
  const rotuloEnvio = resumo.comErro > 0 && resumo.pendentes === 0 ? "Reenviar" : "Confirmar envio";

  return (
    <div style={{ display: "grid", gap: "var(--space-6)", maxWidth: "var(--max-content)" }}>
      <header style={{ display: "grid", gap: "var(--space-2)" }}>
        <span className="ds-eyebrow">Triagem</span>
        <h1 style={{ font: "var(--type-display-2)" }}>Envio de documentos</h1>
      </header>

      <DropZone onFiles={adicionarArquivos} />

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "var(--space-4)",
          flexWrap: "wrap",
        }}
      >
        <h2 style={{ font: "var(--type-display-3)" }}>
          Selecionados{" "}
          <span style={{ font: "var(--type-mono)", color: "var(--text-faint)" }}>
            {resumo.total}
          </span>
        </h2>

        <div style={{ display: "flex", gap: "var(--space-3)" }}>
          <Button variant="ghost" onClick={limparTudo} disabled={resumo.total === 0 || enviando}>
            Limpar
          </Button>
          <Button
            onClick={enviar}
            disabled={!podeEnviar}
            iconRight={<Icon name="arrow-right" size={13} />}
          >
            {enviando ? "Enviando" : rotuloEnvio}
          </Button>
        </div>
      </div>

      {resumo.comErro > 0 && (
        <Card
          tone="paper"
          padding="var(--space-3) var(--space-4)"
          raised={false}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "var(--space-3)",
            borderColor: "var(--red-600)",
            color: "var(--red-600)",
          }}
        >
          <Icon name="alert-triangle" size={16} />
          <p style={{ font: "var(--type-body-sm)" }}>
            {resumo.comErro === 1
              ? "1 arquivo falhou no envio. O motivo está no cartão do arquivo."
              : `${resumo.comErro} arquivos falharam no envio. O motivo está em cada cartão.`}
          </p>
        </Card>
      )}

      {fila.length === 0 ? (
        <p style={{ font: "var(--type-body)", color: "var(--text-muted)" }}>
          Nenhum arquivo selecionado · Arraste documentos acima ou use o seletor.
        </p>
      ) : (
        <ul
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "var(--space-4)",
            listStyle: "none",
            margin: 0,
            padding: 0,
          }}
        >
          {fila.map((item) => (
            <li key={item.id} style={{ display: "grid", gap: "var(--space-1)", width: 150 }}>
              <FileThumb
                name={item.nome}
                size={formatarTamanho(item.tamanhoBytes)}
                src={item.previewUrl}
                state={item.state}
                onRemove={enviando ? undefined : () => removerItem(item.id)}
              />
              {item.erro && (
                <p
                  style={{
                    font: "var(--type-body-sm)",
                    color: "var(--red-600)",
                    lineHeight: "var(--leading-snug)",
                  }}
                >
                  {item.erro}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}

      <Card
        tone="inverse"
        padding="var(--space-4) var(--space-5)"
        raised={false}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "var(--space-3)",
          maxWidth: 640,
        }}
      >
        <Icon name="info" size={16} light />
        <p style={{ font: "var(--type-body-sm)" }}>
          O envio confirma arquivo por arquivo. A leitura dos dados acontece depois, em segundo
          plano — acompanhe no painel.
        </p>
      </Card>

      {aviso && (
        <div
          style={{
            position: "fixed",
            left: "var(--space-6)",
            bottom: "var(--space-6)",
            zIndex: 20,
          }}
        >
          <Toast tone={aviso.tone} onClose={descartarAviso}>
            {aviso.texto}
          </Toast>
        </div>
      )}
    </div>
  );
}
