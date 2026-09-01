# Prompts

Todos os prompts usados na construção deste projeto, na íntegra e em ordem, em
[`transcricao.md`](transcricao.md).

## O que está aqui

São **27 prompts**, transcritos literalmente — com os erros de digitação, o
português informal e as correções de rumo preservados. Não foram limpos nem
reescritos: o valor de um registro de prompts é mostrar como a conversa
realmente aconteceu, inclusive onde ela precisou voltar atrás.

| #   | Prompt                 | O que produziu                                                         |
| --- | ---------------------- | ---------------------------------------------------------------------- |
| 1–3 | Ferramental            | Instalação de `headroom`, `claude-mem` e a skill `karpathy-guidelines` |
| 4   | Bootstrap              | Estrutura em camadas, ESLint + Prettier, `AGENTS.md`, design system    |
| 5–6 | Contrato e mock        | `lib/api/types.ts`, `openapi.yaml`, motor da simulação                 |
| 7   | Tela de envio          | `/envio`                                                               |
| 8   | Correção de rumo       | "o sistema inteiro em tailwind" — refactor da interface                |
| 9   | Bug reportado          | Tamanho do arquivo vazando do card                                     |
| 10  | Tooltip + painel       | `/acompanhamento`                                                      |
| 11  | Bug reportado (imagem) | Pill encostando na confiança                                           |
| 12  | Decisão de contrato    | `PATCH` + confirmação separada                                         |
| 13  | Tela de revisão        | `/revisao/[id]`, lock otimista                                         |
| 14  | Publicação             | Push de todas as branches                                              |
| 15  | Integração             | Prova da fatia vertical, teste de integração                           |
| 16  | Fechamento             | README de entrega, os prompts, checagem final                          |

E a segunda sessão, que reabriu a entrega:

| #     | Prompt               | O que produziu                                                    |
| ----- | -------------------- | ----------------------------------------------------------------- |
| 17    | Duplicidade          | **Nada** — design apresentado, aprovação não veio                 |
| 18    | Mascaramento         | **Nada** — design apresentado, aprovação não veio                 |
| 19–20 | Navegação lateral    | Shell, `SidebarNav` portado, ADR-0013                             |
| 21–22 | Celular e header     | `BottomNav`, ações de header, filtro `desde`, ADR-0014 a ADR-0016 |
| 23    | Publicação           | Push de `feature/navigation-sidebar`                              |
| 24–26 | Atribuição           | Reescrita das mensagens de commit, force-push                     |
| 27    | Fechamento, revisado | Este README, o README final, esta transcrição                     |

## Como isto foi montado

Os prompts foram transcritos do histórico da conversa em que o projeto foi
construído. Três observações de honestidade:

1. **Os prompts 1 a 3 vieram precedidos de comandos de barra** (`/model`,
   `/effort`, `/plugin`) que configuraram o ambiente. Não são prompts e não
   estão transcritos, mas a configuração resultante está registrada em
   [`ambiente.md`](ambiente.md).
2. **O prompt 6 é idêntico ao 5**, reenviado com marcação de citação. Está
   mantido porque aconteceu, e porque a resposta a ele foi não refazer o
   trabalho — o que também é informação.
3. **O prompt 11 veio com uma imagem anexada** (captura de tela do bug). A
   imagem não está versionada; o texto que a acompanhou está.
4. **Os prompts 17 e 18 não produziram código.** Os dois pediram uma feature
   inteira; nos dois casos o design foi apresentado e a conversa seguiu para o
   assunto seguinte antes da aprovação. Estão transcritos porque aconteceram, e
   porque o que ficou por fazer está registrado no `README.md` da raiz, em "O que
   não foi entregue".
5. **O prompt 27 é o 16 com um item a mais**, reenviado na segunda sessão. Os
   dois estão transcritos: o 16 fechou a primeira entrega, o 27 fechou esta.
