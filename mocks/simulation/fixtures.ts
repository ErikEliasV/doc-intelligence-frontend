import { DocumentErrorCode, type DocumentError } from "@/lib/api/types";

/**
 * Field vocabulary the fake extraction model "reads" off a document.
 *
 * Scoped to **one document type: a Brazilian identity card (RG)**. The review
 * screen is built against exactly these five fields, per the brief. Supporting
 * every document type would mean a field schema per type and a review screen
 * that renders an unknown shape — explicitly out of scope.
 */
export interface FieldTemplate {
  nome: string;
  valores: readonly string[];
  /** Machine-read values are shown in the mono face. */
  mono?: boolean;
}

export const FIELD_TEMPLATES: readonly FieldTemplate[] = [
  {
    nome: "Nome",
    valores: [
      "Maria Aparecida de Souza",
      "João Batista Ferreira",
      "Ana Carolina Rodrigues Lima",
      "Carlos Eduardo Nogueira",
    ],
  },
  {
    nome: "Filiação",
    valores: [
      "José de Souza e Terezinha de Souza",
      "Antônio Ferreira e Maria Ferreira",
      "Paulo Rodrigues Lima e Sônia Rodrigues",
      "Roberto Nogueira e Cláudia Nogueira",
    ],
  },
  {
    nome: "Data de nascimento",
    valores: ["14/03/1987", "02/11/1964", "28/07/1995", "09/01/1978"],
    mono: true,
  },
  {
    nome: "Número",
    valores: ["12.345.678-9", "45.678.912-3", "98.765.432-1", "23.456.789-0"],
    mono: true,
  },
  {
    nome: "Órgão emissor",
    valores: ["SSP/SP", "DETRAN/RJ", "SSP/MG", "IFP/RJ"],
    mono: true,
  },
];

/** All five fields of the identity card. */
export const FIELDS_PER_DOCUMENT = FIELD_TEMPLATES.length;

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
