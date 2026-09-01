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
construído. Cinco observações de honestidade:

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

## Onde o agente errou

Quatro vezes, em ordem do que custaram.

**1. A interface inteira em estilo inline — e um ADR justificando.** O projeto
declarava Tailwind desde o bootstrap, o [ADR-0003](../docs/adr/ADR-0003.md) tinha
construído a ponte de tokens para ele, e a primeira tela saiu com todo o visual
em `style={{}}`. Pior que o código: o agente registrou no próprio ADR-0003 que os
papéis de tipo do design system eram **inexpressáveis** em Tailwind, porque são
shorthand `font:` composto e não há utilitário para essa propriedade. A afirmação
era falsa e verificável em um minuto — o `@utility` do Tailwind v4 resolve isso e
a colisão de namespace que motivou o prefixo `ds-`.

Como percebi: abri as telas e não havia uma classe Tailwind em lugar nenhum, num
projeto que declara Tailwind. Daí o prompt 8 — _"não pode você não fez a
implementação usando tailwind css, quero que o sistema inteiro seja em
tailwind"_.

O que fiz: exigi a conversão completa, e o resultado virou o
[ADR-0010](../docs/adr/ADR-0010.md) — uma **emenda explícita**, não uma reescrita
por cima. A afirmação errada continua no ADR-0003, marcada como substituída, com
a correção apontando para ela. Um registro de decisões que apaga os próprios
enganos não serve para o que existe.

Esse é o erro que vale registrar não pelo tamanho, mas pelo tipo: o agente não
escreveu só código errado, escreveu uma **justificativa técnica errada dentro do
artefato cuja função inteira é ser confiável** — e com o mesmo tom de convicção
que usa quando está certo.

**2. Dois defeitos visuais entregues como prontos.** O tamanho do arquivo vazando
para fora do card (prompt 9) e a pill "EM CONFERÊNCIA" encostando na porcentagem
de confiança (prompt 11, mandado com captura de tela porque descrever era mais
difícil que mostrar). Os dois foram dados como concluídos.

Como percebi: olhando a tela. Nenhum dos dois tinha teste e — como diz a seção de
testes do [`README.md`](../README.md) da raiz — nenhum dos dois teria.

O que mudou depois: layout parou de ser conferido no olho e passou a ser medido
no DOM. Os números que aparecem no [ADR-0013](../docs/adr/ADR-0013.md) e no
[ADR-0014](../docs/adr/ADR-0014.md) — 272px de coluna, 684px de tabela contra
311px úteis — vêm dessa mudança.

**3. Atribuição no commit, e foi preciso pedir duas vezes.** O prompt 24 pediu
para tirar os rodapés de coautoria do agente das mensagens de commit. Não saiu
por inteiro, e o prompt 25 teve que reafirmar: _"eu quero que não tenha
contribuição"_. Pequeno, mas é o tipo honesto de pequeno — uma instrução dada uma
vez não bastou.

**4. Duas features pararam no desenho, e ninguém fechou o ciclo.** Os prompts 17
e 18 pediram detecção de duplicidade e mascaramento de dado sensível. Nos dois, o
agente apresentou o desenho e esperou aprovação — que é exatamente o que a regra
4 do [`AGENTS.md`](../AGENTS.md) manda fazer, e que nos prompts 19 e 21 recebeu
seu "pode". Nestes dois não veio, e a conversa seguiu.

A trava funcionou; o ciclo não fechou. Dois fatos do enunciado ficaram sem
implementação por causa disso, e estão registrados como não entregues no
`README.md` da raiz. O aprendizado não é afrouxar a trava — é que "esperando
aprovação" precisa ser um estado visível, não um silêncio.

### O padrão

Os quatro erros têm o mesmo formato: **o agente errou com mais confiança
justamente onde não conseguia ver o resultado.** O que roda e tem teste saiu
certo — o motor da simulação, o lock otimista, a paginação. O que saiu errado foi
o layout, que ninguém olhou, e a justificativa, que ninguém conferiu. Nos dois
casos quem pegou foi uma pessoa olhando para a coisa pronta.
