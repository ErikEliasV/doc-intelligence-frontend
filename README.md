# DOC Intelligence

Triagem de documentos para escritório de advocacia. Documentos sobem em lote,
são lidos por um modelo de extração, e voltam para conferência humana quando o
modelo não tem confiança suficiente.

Projeto de avaliação técnica — **trilha Front-end**. Não existe API real: o
contrato está especificado aqui e é servido por um mock (ver
[Mockado vs. real](#mockado-vs-real)).

## Subir localmente

Requer **Node 20+**.

```bash
npm install
npm run dev
```

Abre em `http://localhost:3000` e redireciona para `/envio`.

### Percorrer a fatia vertical em 2 minutos

1. Em **`/envio`**, arraste os arquivos de `mocks/exemplos/` — são cinco
   documentos fictícios prontos para isso.
2. Clique em **Confirmar envio**. Cada arquivo mostra seu próprio status.
3. Vá para **`/acompanhamento`**. Os documentos aparecem em `processando` e a
   lista se atualiza sozinha a cada 15s.
4. Em 5 a 40 segundos eles assentam. Alguns caem em **`em_conferência`**
   (~30%), alguns em **`erro`** (~15%).
5. Clique numa linha `em conferência` — só essas abrem. Corrija um campo,
   **Salvar correções**: o documento **continua** em conferência.
6. **Concluir conferência** fecha e o documento volta ao painel como `pronto`.

> Se nenhum documento cair em conferência, suba o lote de novo. O desfecho é
> sorteado, não vem do arquivo — ver `mocks/exemplos/README.md`.

Para ver o aviso de **duas pessoas no mesmo documento**, abra a mesma URL de
revisão em duas abas.

## Comandos

| Comando                | O que faz                       |
| ---------------------- | ------------------------------- |
| `npm run dev`          | Servidor de desenvolvimento     |
| `npm run build`        | Build de produção               |
| `npm start`            | Serve o build                   |
| `npm test`             | Testes (97)                     |
| `npm run test:watch`   | Testes em watch                 |
| `npm run lint`         | ESLint                          |
| `npm run typecheck`    | `next typegen` + `tsc --noEmit` |
| `npm run format`       | Prettier, escrevendo            |
| `npm run format:check` | Prettier, só verificando        |

O gate completo antes de dizer que algo está pronto:

```bash
npm run typecheck && npm run lint && npm run format:check && npm test && npm run build
```

> `typecheck` roda `next typegen` primeiro de propósito: `RouteContext` e
> `PageProps` são tipos **gerados** pelo Next. Sem isso, o `tsc` quebra num
> checkout limpo e passa na máquina de quem acabou de buildar.

## Estrutura

A dependência corre numa direção só:

```
app/  →  features/  →  lib/  +  components/
                          ↑
                      mocks/ implementa o contrato de lib/
```

| Pasta                   | Responsabilidade                                              |
| ----------------------- | ------------------------------------------------------------- |
| `app/`                  | Rotas e route handlers. Só composição                         |
| `components/`           | UI pura, portada do design system. Props entram, JSX sai      |
| `features/`             | Lógica de domínio, uma pasta por tela                         |
| `lib/`                  | Contratos, tipos, cliente de API — a fronteira com o back-end |
| `mocks/`                | Simulação, fixtures, documentos de exemplo                    |
| `styles/design-system/` | Tokens vendorizados. **Não edite `tokens/` à mão**            |
| `docs/adr/`             | 12 decisões de arquitetura                                    |
| `prompts/`              | Todos os prompts do projeto, na íntegra                       |

Cada pasta tem um `README.md` com a sua fronteira.

## As três telas

| Rota              | Tela                     |
| ----------------- | ------------------------ |
| `/envio`          | Envio de documentos      |
| `/acompanhamento` | Painel de acompanhamento |
| `/revisao/[id]`   | Revisão e correção       |

Fora de escopo por decisão registrada em `AGENTS.md`: fila de conferência
completa e busca textual.

## Mockado vs. real

**O contrato é real.** Está especificado em
[`docs/api/openapi.yaml`](docs/api/openapi.yaml) (OpenAPI 3.1) e tipado em
[`lib/api/types.ts`](lib/api/types.ts). Um backend implementaria isso e nada na
interface mudaria além da URL base.

|                         | Hoje                                          | Num sistema real                                 |
| ----------------------- | --------------------------------------------- | ------------------------------------------------ |
| **Extração**            | Sorteio: 15% erro, 30% baixa confiança, 5–40s | Modelo de verdade                                |
| **Campos**              | 5 fixos de RG, valores de uma lista           | Schema por tipo de documento                     |
| **Persistência**        | `Map` em memória, some no restart             | Banco; `versao` vira coluna                      |
| **Arquivos**            | Bytes no processo                             | Object storage + URL assinada                    |
| **Identidade**          | Id opaco de sessão num header                 | Usuário autenticado; o header seria **ignorado** |
| **Presença na revisão** | `Map` com TTL de 60s                          | Redis com TTL                                    |
| **Conflito 409**        | Comparação em memória                         | `UPDATE ... WHERE versao = ?`                    |

**Não é mock:** as três telas, o design system, o cliente tipado, a paginação, o
polling, e o comportamento de conflito como o cliente o enxerga.

O mock vive em `mocks/` e é servido por route handlers do Next
([ADR-0006](docs/adr/ADR-0006.md)) — o contrato é executável por `curl`:

```bash
curl -X POST localhost:3000/api/documents -F "arquivos=@mocks/exemplos/rg-frente-fake.png"
curl "localhost:3000/api/documents?status=em_conferencia"
```

## O que foi escolhido testar, e por quê

São **97 testes**, e a escolha do que testar seguiu uma regra: **testar o que
quebra em silêncio**, não o que é visível.

A maior parte cobre a **lógica pura** — o motor da simulação, a fila de envio, as
regras de polling, o fluxo de revisão. Essa lógica foi deliberadamente escrita
sem relógio, sem `fetch` e sem React: o relógio e o gerador aleatório entram por
parâmetro. É isso que permite verificar uma taxa de erro de 15% sobre 4.000
documentos, ou adiantar 40 segundos de processamento, em milissegundos. Um teste
que precisasse esperar não teria sido escrito.

As asserções estatísticas foram **verificadas por mutação**, não só executadas:
alterar `errorRate` de 0.15 para 0.40 quebra o teste de falha; alterar
`lowConfidenceRate` de 0.30 para 0.60 quebra o de conferência. Um teste de taxa
que passa com o valor errado não testa nada.

Acima disso há um **teste de integração** (`mocks/integracao.test.ts`) que
atravessa os route handlers de verdade — `Request` entra, `Response` sai, JSON
serializado — e percorre o caminho inteiro: envio, processamento, fila de
conferência, correção, confirmação, volta ao painel como pronto. Ele pega o que
teste de unidade não pega: status HTTP, corpo malformado, e o contrato como o
navegador o vê.

**O que deliberadamente não tem teste automatizado: a UI.** Renderização de
componente teria exigido jsdom e Testing Library — duas dependências — para
verificar principalmente aparência, que é o que testes de componente cobrem pior.
No lugar disso, cada tela foi verificada no navegador, com medição do DOM quando
o problema era de layout. Foi assim que dois bugs de sobreposição foram
encontrados e corrigidos com número, não com impressão. A troca é consciente e
tem um custo real: uma regressão visual não quebra o build.

Um caso ilustra o limite dessa escolha: um conflito que deveria devolver 409
devolveu 500 no servidor de desenvolvimento, e **nenhum teste pegaria** — era
identidade de classe quebrada por hot reload, coisa que só existe fora do grafo
de módulos do runner. Foi a verificação manual que achou. Está registrado em
[ADR-0006](docs/adr/ADR-0006.md).

## Decisões

12 ADRs em [`docs/adr/`](docs/adr/README.md), com índice, as três emendas onde
uma decisão contradisse outra, e o quadro das dívidas ainda abertas.

As quatro que mais moldaram o resultado:

- **[0006](docs/adr/ADR-0006.md)** — o motor não usa timers; toda leitura é
  função pura do tempo decorrido.
- **[0010](docs/adr/ADR-0010.md)** — Tailwind em toda a interface, via
  `@utility` para os papéis de tipo do design system.
- **[0011](docs/adr/ADR-0011.md)** — polling de 15s no escopo da página, não
  WebSocket.
- **[0012](docs/adr/ADR-0012.md)** — status guardado, não derivado: só a
  confirmação explícita fecha um documento.

## Limitações conhecidas

Todas registradas, nenhuma escondida. As três que mais pesam:

1. **Paginação por offset desliza no pico.** A 6,7 documentos/min, quem está na
   página 2 pode ver o mesmo documento duas vezes. Correção: cursor
   ([ADR-0011](docs/adr/ADR-0011.md)).
2. **Sem endpoint de resumo.** As abas do painel não têm contagem, então não se
   vê quantos aguardam conferência sem paginar ([ADR-0011](docs/adr/ADR-0011.md)).
3. **Sem trilha de auditoria.** `origem` diz que um humano corrigiu, não quem nem
   qual era o valor antes ([ADR-0012](docs/adr/ADR-0012.md)).

## Stack

Next.js 16.3.3 (App Router, Turbopack) · React 19 · TypeScript strict ·
Tailwind v4 · Vitest · ESLint 9 + Prettier

Design system importado de `claude.ai/design`, vendorizado em
`styles/design-system/`.
