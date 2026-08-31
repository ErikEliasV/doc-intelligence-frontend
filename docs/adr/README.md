# Architecture Decision Records

Doze decisões, do bootstrap à fatia vertical fechada.

Uma decisão por arquivo, numeração sequencial, sem reaproveitar número. Um ADR
não é apagado quando muda de ideia — escreva um novo que o substitua e marque o
antigo. Ver `AGENTS.md`, regra 2.

## Índice

### Fundação

| ADR                 | Decisão                | Por quê, em uma linha                                                            | Status |
| ------------------- | ---------------------- | -------------------------------------------------------------------------------- | ------ |
| [0001](ADR-0001.md) | Next.js 16, não 14     | O pedido era "14+"; a instalada é 16.3.3, e a margem muda como se escreve código | Aceito |
| [0002](ADR-0002.md) | Camadas fora de `app/` | Toda pasta dentro de `app/` vira rota; fora, a arquitetura aparece na raiz       | Aceito |
| [0004](ADR-0004.md) | ESLint + Prettier      | Prettier decide forma, ESLint decide correção, zero sobreposição                 | Aceito |
| [0007](ADR-0007.md) | Vitest                 | Lê TypeScript sem configuração e serve para o teste de componente que vem depois | Aceito |

### Design system

| ADR                 | Decisão                                      | Por quê, em uma linha                                                                                   | Status                                                 |
| ------------------- | -------------------------------------------- | ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| [0003](ADR-0003.md) | Tokens vendorizados + fontes por `next/font` | Cópia literal para re-sincronizar; fontes auto-hospedadas em vez de CDN                                 | Aceito — §3 substituída pela [0010](ADR-0010.md)       |
| [0009](ADR-0009.md) | Componentes portados sob demanda             | Portar 17 componentes não usados seria código não exercitado                                            | Aceito — prop surface revista pela [0010](ADR-0010.md) |
| [0010](ADR-0010.md) | Tailwind em toda a interface                 | `@utility` do Tailwind v4 resolve o shorthand `font:` e a colisão de namespace que me levaram ao inline | Aceito                                                 |

### Contrato e mock

| ADR                 | Decisão                                             | Por quê, em uma linha                                                                     | Status                                                     |
| ------------------- | --------------------------------------------------- | ----------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| [0005](ADR-0005.md) | Contrato em OpenAPI                                 | Um backend gera stub a partir dela; de markdown, gera leitura                             | Aceito — regra de status emendada pela [0012](ADR-0012.md) |
| [0006](ADR-0006.md) | Mock por route handlers                             | Zero dependências, e o contrato vira executável por `curl`                                | Aceito                                                     |
| [0012](ADR-0012.md) | Correção e confirmação separadas, com lock otimista | Salvar não conclui; `versao` evita perder trabalho, presença evita fazer trabalho perdido | Aceito                                                     |

### Telas

| ADR                 | Decisão                         | Por quê, em uma linha                                                                | Status |
| ------------------- | ------------------------------- | ------------------------------------------------------------------------------------ | ------ |
| [0008](ADR-0008.md) | Upload sem biblioteca           | O que a `react-dropzone` adiciona é sobretudo validação de tipo, que o escopo proíbe | Aceito |
| [0011](ADR-0011.md) | Polling paginado, não WebSocket | No pico há ~2,5 documentos mudando de estado por vez; um socket não paga             | Aceito |

## As quatro decisões que mais moldaram o resultado

Se alguém for ler só quatro:

1. **[0006](ADR-0006.md) — o motor não usa timers.** O destino de um documento é
   sorteado uma vez, no envio; toda leitura depois é função pura do tempo
   decorrido. É o que torna a leitura idempotente e o que permite ao teste
   adiantar 40 segundos sem esperar 40 segundos.
2. **[0010](ADR-0010.md) — `@utility` em vez de estilo inline.** Eu tinha
   registrado no ADR-0003 que os papéis de tipo do design system eram
   inexpressáveis em Tailwind. Estavam expressáveis; eu é que não tinha
   procurado.
3. **[0011](ADR-0011.md) — polling no escopo da página.** O payload é constante
   independente do acervo, e o custo se concentra onde a informação muda.
4. **[0012](ADR-0012.md) — status guardado, não derivado.** A decisão de separar
   salvar de confirmar invalidou a regra "se e somente se" que a
   [0005](ADR-0005.md) tinha escrito. Um `PATCH` fecharia o documento sozinho.

## Onde as decisões se contradisseram

Três emendas, todas registradas no lugar em vez de reescritas por cima:

- **0003 §3 → 0010.** O prefixo `ds-` era desnecessário nas cores, e o
  `@utility` resolvia a colisão que o motivou.
- **0009 (prop surface) → 0010.** `style` deu lugar a `className`; `Card` perdeu
  a prop `padding`.
- **0005 (regra de status) → 0012.** O limiar de 0.75 passa a valer só na
  extração.

## Dívidas registradas, ainda abertas

Cada uma tem o ADR que a documenta:

| Dívida                                        | Onde                | Impacto                                                    |
| --------------------------------------------- | ------------------- | ---------------------------------------------------------- |
| Paginação por offset desliza no pico          | [0011](ADR-0011.md) | Alto — na página 2 dá para ver um documento duas vezes     |
| Sem endpoint de resumo (abas sem contagem)    | [0011](ADR-0011.md) | Médio — não se vê quantos aguardam conferência sem paginar |
| Sem trilha de auditoria de quem corrigiu      | [0012](ADR-0012.md) | Alto para escritório de advocacia                          |
| Sem sincronia entre `openapi.yaml` e os tipos | [0005](ADR-0005.md) | Médio — os dois podem divergir em silêncio                 |
| Estado do mock por processo, some no restart  | [0006](ADR-0006.md) | Esperado num mock                                          |
| Sem miniatura de PDF                          | [0008](ADR-0008.md) | Baixo                                                      |
