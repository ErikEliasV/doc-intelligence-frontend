# Architecture Decision Records

Uma decisão por arquivo, numeração sequencial, sem reaproveitar número.
Um ADR não é apagado quando muda de ideia — escreva um novo que o substitua e
marque o antigo como `Substituído por ADR-000Y`.

| ADR                 | Decisão                                             | Status |
| ------------------- | --------------------------------------------------- | ------ |
| [0001](ADR-0001.md) | Baseline da stack: Next.js 16 em vez de 14          | Aceito |
| [0002](ADR-0002.md) | Separação por camadas fora de `app/`                | Aceito |
| [0003](ADR-0003.md) | Design system vendorizado + ponte para Tailwind v4  | Aceito |
| [0004](ADR-0004.md) | ESLint + Prettier: divisão de responsabilidade      | Aceito |
| [0005](ADR-0005.md) | Contrato em OpenAPI, não em markdown                | Aceito |
| [0006](ADR-0006.md) | Servir o mock por route handlers do Next.js         | Aceito |
| [0007](ADR-0007.md) | Vitest como runner de testes                        | Aceito |
| [0008](ADR-0008.md) | Upload e drag-and-drop sem biblioteca               | Aceito |
| [0009](ADR-0009.md) | Portar componentes do design system sob demanda     | Aceito |
| [0010](ADR-0010.md) | Tailwind em toda a interface, sem estilo inline     | Aceito |
| [0011](ADR-0011.md) | Polling paginado no painel, não WebSocket           | Aceito |
| [0012](ADR-0012.md) | Correção e confirmação separadas, com lock otimista | Aceito |
