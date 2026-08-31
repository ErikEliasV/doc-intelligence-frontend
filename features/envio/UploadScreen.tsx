"use client";

import { Button, Card, DropZone, FileThumb, Icon, Toast } from "@/components";
import { formatarTamanho } from "./formatarTamanho";
import { useUploadQueue } from "./useUploadQueue";

/**
 * Envio de documentos.
 *
 * Scope note: everything here is about getting bytes to the server. The
 * extraction that follows — slow, sometimes failing, sometimes low confidence —
 * is the tracking screen's job, and this screen says so in the note at the
 * bottom rather than pretending the work is done.
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
    <div className="grid max-w-content gap-6">
      <header className="grid gap-2">
        <span className="type-eyebrow text-eyebrow">Triagem</span>
        <h1 className="type-display-2">Envio de documentos</h1>
      </header>

      <DropZone onFiles={adicionarArquivos} />

      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="type-display-3">
          Selecionados <span className="type-mono text-faint">{resumo.total}</span>
        </h2>

        <div className="flex gap-3">
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
          raised={false}
          className="flex items-center gap-3 border-red-600 px-4 py-3 text-red-600"
        >
          <Icon name="alert-triangle" size={16} />
          <p className="type-body-sm">
            {resumo.comErro === 1
              ? "1 arquivo falhou no envio. O motivo está no cartão do arquivo."
              : `${resumo.comErro} arquivos falharam no envio. O motivo está em cada cartão.`}
          </p>
        </Card>
      )}

      {fila.length === 0 ? (
        <p className="type-body text-muted">
          Nenhum arquivo selecionado · Arraste documentos acima ou use o seletor.
        </p>
      ) : (
        <ul className="m-0 flex list-none flex-wrap gap-4 p-0">
          {fila.map((item) => (
            <li key={item.id} className="grid w-[150px] gap-1">
              <FileThumb
                name={item.nome}
                size={formatarTamanho(item.tamanhoBytes)}
                src={item.previewUrl}
                state={item.state}
                onRemove={enviando ? undefined : () => removerItem(item.id)}
              />
              {item.erro && <p className="type-body-sm leading-snug text-red-600">{item.erro}</p>}
            </li>
          ))}
        </ul>
      )}

      <Card
        tone="inverse"
        raised={false}
        className="flex max-w-[640px] items-center gap-3 px-5 py-4"
      >
        <Icon name="info" size={16} />
        <p className="type-body-sm">
          O envio confirma arquivo por arquivo. A leitura dos dados acontece depois, em segundo
          plano — acompanhe no painel.
        </p>
      </Card>

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
