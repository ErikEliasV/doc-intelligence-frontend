/**
 * Byte count as the interface shows it. Brazilian decimal separator, one
 * decimal place, mono font at the call site — the design system's rule for
 * anything machine-read.
 */
export function formatarTamanho(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return "—";
  if (bytes < 1024) return `${bytes} B`;

  const kb = bytes / 1024;
  if (kb < 1024) return `${formatar(kb)} KB`;

  return `${formatar(kb / 1024)} MB`;
}

function formatar(valor: number): string {
  return valor.toFixed(1).replace(".", ",");
}
