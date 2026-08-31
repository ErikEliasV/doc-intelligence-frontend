import { FieldEditor } from "@/components";
import type { ExtractedField } from "@/lib/api/types";

/**
 * The five fields of an identity card.
 *
 * `mono` is decided here rather than carried on the wire: whether a value is
 * machine-read is a presentation call, and the contract has no business
 * knowing that a document number is shown in a mono face.
 */
const MONO = new Set(["Data de nascimento", "Número", "Órgão emissor"]);

export interface CamposExtraidosProps {
  campos: readonly ExtractedField[];
  ativo?: string | null;
  onFocus?: (nome: string) => void;
  onChange?: (nome: string, valor: string) => void;
  disabled?: boolean;
  somenteLeitura?: boolean;
}

export function CamposExtraidos({
  campos,
  ativo,
  onFocus,
  onChange,
  disabled,
  somenteLeitura,
}: CamposExtraidosProps) {
  return (
    <div className="grid">
      {campos.map((campo) => (
        <FieldEditor
          key={campo.nome}
          label={campo.nome}
          value={campo.valor}
          confidence={campo.confianca}
          origin={campo.origem}
          mono={MONO.has(campo.nome)}
          active={!somenteLeitura && ativo === campo.nome}
          disabled={disabled || somenteLeitura}
          onFocus={() => onFocus?.(campo.nome)}
          onChange={(valor) => onChange?.(campo.nome, valor)}
        />
      ))}
    </div>
  );
}
