import { DocumentErrorCode, type DocumentError } from "@/lib/api/types";

/**
 * Field vocabulary the fake extraction model "reads" off a document. Labels are
 * the ones a law-office triage screen would show, so the review screen has
 * plausible content to correct.
 */
export interface FieldTemplate {
  nome: string;
  valores: readonly string[];
}

export const FIELD_TEMPLATES: readonly FieldTemplate[] = [
  {
    nome: "Número do processo",
    valores: [
      "0801234-56.2025.8.19.0001",
      "1004567-89.2024.8.26.0100",
      "5009876-54.2025.4.03.6100",
    ],
  },
  {
    nome: "Comarca",
    valores: ["São Paulo — SP", "Rio de Janeiro — RJ", "Belo Horizonte — MG", "Curitiba — PR"],
  },
  {
    nome: "Data de emissão",
    valores: ["12/03/2025", "04/11/2024", "28/07/2025", "19/01/2026"],
  },
  {
    nome: "Emitente",
    valores: [
      "Tribunal de Justiça do Estado de São Paulo",
      "Junta Comercial do Estado do Rio de Janeiro",
      "Receita Federal do Brasil",
    ],
  },
  {
    nome: "CPF/CNPJ",
    valores: ["123.456.789-09", "12.345.678/0001-95", "987.654.321-00"],
  },
  {
    nome: "Valor da causa",
    valores: ["R$ 48.500,00", "R$ 12.300,45", "R$ 250.000,00"],
  },
];

/** How many fields the model returns per document. */
export const FIELDS_PER_DOCUMENT = 5;

/**
 * Failure modes. Messages follow the design system's content rule: name the
 * object and the fact, no apology, no exclamation mark.
 */
export const DOCUMENT_ERRORS: readonly DocumentError[] = [
  {
    codigo: DocumentErrorCode.MODELO_INDISPONIVEL,
    mensagem: "O modelo de extração não respondeu no tempo limite.",
  },
  {
    codigo: DocumentErrorCode.DOCUMENTO_ILEGIVEL,
    mensagem: "O documento não pôde ser lido.",
  },
];
