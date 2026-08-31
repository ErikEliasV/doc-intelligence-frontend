import { Icon } from "@/components";
import { urlDoArquivo } from "@/lib/api/client";

/**
 * The uploaded document, beside the fields it produced.
 *
 * A plain viewer on purpose: no zoom, no rotation, no annotation — out of scope
 * per the brief. Images render inline; a PDF gets a labelled pane, because
 * drawing its first page needs pdf.js, a dependency ADR-0008 already declined.
 */
export interface DocumentoOriginalProps {
  id: string;
  nome: string;
  tipoMime: string;
}

export function DocumentoOriginal({ id, nome, tipoMime }: DocumentoOriginalProps) {
  const ehImagem = tipoMime.startsWith("image/");

  return (
    <div className="grid content-start gap-3">
      <div className="flex items-center justify-between gap-3">
        <span className="ds-eyebrow">Documento original</span>
        <span
          title={nome}
          className="type-mono max-w-[22ch] truncate text-[length:var(--size-caption)] text-muted"
        >
          {nome}
        </span>
      </div>

      <div className="relative grid aspect-[3/4] place-items-center overflow-hidden border border-line-strong bg-sunken shadow-hard">
        {ehImagem ? (
          // next/image is not used here: the bytes come from an API route that
          // exists only in the mock, and the optimizer would cache a document
          // that is meant to be private and short-lived.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={urlDoArquivo(id)}
            alt={`Documento enviado: ${nome}`}
            className="h-full w-full object-contain"
          />
        ) : (
          <div className="grid w-full justify-items-center gap-3 border-2 border-dashed border-line p-8 text-center">
            <Icon name="file-text" size={26} className="text-faint" />
            <p className="type-body-sm max-w-[30ch] text-muted">
              Pré-visualização de PDF não disponível. Renderizar a página exigiria um leitor de PDF,
              que está fora do escopo desta entrega.
            </p>
            <a href={urlDoArquivo(id)} target="_blank" rel="noreferrer" className="type-body-sm">
              Abrir o arquivo
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
