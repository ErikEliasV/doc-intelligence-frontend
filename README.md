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
3. Clique em **Acompanhamento** na barra lateral, ou no botão **Ir ao painel** no
   header. Os documentos aparecem em `processando` e a lista se atualiza sozinha
   a cada 15s. A badge **"N hoje"** no header conta o que chegou no dia.
4. Em 5 a 40 segundos eles assentam. Alguns caem em **`em_conferência`**
   (~30%), alguns em **`erro`** (~15%).
5. Clique numa linha `em conferência` — só essas abrem. Corrija um campo,
   **Salvar correções**: o documento **continua** em conferência.
6. **Concluir conferência** fecha e o documento volta ao painel como `pronto`.

> Se nenhum documento cair em conferência, suba o lote de novo. O desfecho é
> sorteado, não vem do arquivo — ver `mocks/exemplos/README.md`.

Para ver o aviso de **duas pessoas no mesmo documento**, abra a mesma URL de
revisão em duas abas.

Para ver o **layout de celular**, estreite a janela abaixo de 768px: a lateral dá
lugar a uma barra fixa no rodapé.

## Configuração do agente, versionada

O projeto foi construído com assistência de agente, e o que guiou essa
construção está no repositório, não na máquina de quem rodou:

| Arquivo                                       | O que é                                         |
| --------------------------------------------- | ----------------------------------------------- |
| `AGENTS.md`                                   | Instruções permanentes: escopo, camadas, regras |
| `CLAUDE.md`                                   | Aponta para o `AGENTS.md`                       |
| `.claude/skills/karpathy-guidelines/SKILL.md` | Única skill de projeto configurada              |

Não há hooks nem comandos customizados. `.claude/settings.local.json` está no
`.gitignore` de propósito — são preferências por desenvolvedor (modelo, tema,
permissões locais), não configuração do projeto; o `.gitignore` diz isso na
linha.

Os **27 prompts** que construíram o projeto estão em
[`prompts/`](prompts/README.md), na íntegra e em ordem, com os erros de digitação
preservados. No mesmo lugar,
[**onde o agente errou**](prompts/README.md#onde-o-agente-errou): as quatro vezes
em que foi preciso corrigir o rumo, como cada uma foi percebida e o que mudou
depois — incluindo a vez em que ele escreveu uma justificativa técnica falsa
dentro de um ADR.

## Comandos

| Comando                | O que faz                       |
| ---------------------- | ------------------------------- |
| `npm run dev`          | Servidor de desenvolvimento     |
| `npm run build`        | Build de produção               |
| `npm start`            | Serve o build                   |
| `npm test`             | Testes (137)                    |
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
| `docs/adr/`             | 17 decisões de arquitetura                                    |
| `prompts/`              | Todos os prompts do projeto, na íntegra                       |

`features/shell/` é a única pasta de `features/` que não é uma tela: é a moldura
de navegação que as três compartilham. Fica ali, e não em `components/`, porque
conhece rotas — e `components/` não pode ([ADR-0013](docs/adr/ADR-0013.md)).

Cada pasta tem um `README.md` com a sua fronteira.

## As três telas

| Rota              | Tela                     |
| ----------------- | ------------------------ |
| `/envio`          | Envio de documentos      |
| `/acompanhamento` | Painel de acompanhamento |
| `/revisao/[id]`   | Revisão e correção       |

Fora de escopo por decisão registrada em `AGENTS.md`: fila de conferência
completa e busca textual.

### Navegação

As três compartilham um shell: barra lateral fixa de 236px, com a rota ativa
destacada por cor **e** por `aria-current` — o destaque não pode ser só a cor.
`SidebarNav` foi portado do design system sob demanda, com um desvio de contrato
registrado: navega por `href` com `next/link`, não por `value`/`onChange` com
`<button>`, o que devolve ctrl-clique, copiar link e prefetch
([ADR-0013](docs/adr/ADR-0013.md), [ADR-0015](docs/adr/ADR-0015.md)).

A revisão **não tem item próprio na barra** — é alcançada por uma linha do
painel, e um item apontando para um id inexistente seria link morto. O caminho de
volta é um breadcrumb no topo da tela, presente também nos estados de carregando
e de erro.

Cada tela tem as ações de header do design system: **"Ir ao painel"** no envio, e
no painel a contagem **"N hoje"** ao lado de **"Enviar mais"**.

### Responsividade

Abaixo de 768px a lateral some e entra uma barra fixa no rodapé. Não é porte: o
kit da origem é um viewport de 1440×900 com `overflow:hidden` e não tem
tratamento mobile nenhum, então a barra inferior foi desenhada aqui
([ADR-0014](docs/adr/ADR-0014.md)). Barra em vez de gaveta porque são dois
destinos — uma gaveta cobraria estado, scrim, `Esc`, fechar ao navegar e
armadilha de foco para esconder dois links.

Na revisão, entre 1024px e 1280px, a lateral cheia deixaria a coluna de campos
com 272px, onde `"José de Souza e Terezinha de Souza"` não cabe. Ali ela colapsa
para um trilho de ícones de 56px, e a coluna volta a 452px. Números medidos no
DOM, não estimados ([ADR-0013](docs/adr/ADR-0013.md)).

## Mockado vs. real

**O contrato é real.** Está especificado em
[`docs/api/openapi.yaml`](docs/api/openapi.yaml) (OpenAPI 3.1) e tipado em
[`lib/api/types.ts`](lib/api/types.ts). Um backend implementaria isso e nada na
interface mudaria além da URL base.

|                         | Hoje                                          | Num sistema real                                 |
| ----------------------- | --------------------------------------------- | ------------------------------------------------ |
| **Extração**            | Sorteio: 15% erro, 30% baixa confiança, 5–40s | Modelo de verdade                                |
| **Campos**              | 5 fixos de RG, valores de uma lista           | Os mesmos quatro atributos, vindos do modelo     |
| **Persistência**        | `Map` em memória, some no restart             | Banco; `versao` vira coluna                      |
| **Arquivos**            | Bytes no processo                             | Object storage + URL assinada                    |
| **Identidade**          | Id opaco de sessão num header                 | Usuário autenticado; o header seria **ignorado** |
| **Presença na revisão** | `Map` com TTL de 60s                          | Redis com TTL                                    |
| **Conflito 409**        | Comparação em memória                         | `UPDATE ... WHERE versao = ?`                    |

**Não é mock:** as três telas, o design system, o cliente tipado, a paginação, o
polling, e o comportamento de conflito como o cliente o enxerga.

**O que muda quando o modelo trocar de versão: nada aqui.** O fato (f) do
enunciado avisa que o modelo será trocado e que os prompts vão mudar mais de uma
vez no primeiro ano. Por isso `ExtractedField` não é tipado por tipo de
documento — é `{ nome, valor, confianca, origem }`, e a interface renderiza o que
chegar, na ordem em que chegar. Um prompt novo que extraia "data de expedição"
aparece na tela de revisão, editável, sem uma linha de front-end. O que isso
custa — sem validação por campo, sem layout por tipo, e um acoplamento residual
que sobrou no cliente — está no [ADR-0017](docs/adr/ADR-0017.md).

O mock vive em `mocks/` e é servido por route handlers do Next
([ADR-0006](docs/adr/ADR-0006.md)) — o contrato é executável por `curl`:

```bash
curl -X POST localhost:3000/api/documents -F "arquivos=@mocks/exemplos/rg-frente-fake.png"
curl "localhost:3000/api/documents?status=em_conferencia"
```

## O que foi escolhido testar, e por quê

São **137 testes**, e a escolha do que testar seguiu uma regra: **testar o que
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

**Há testes de componente, e eles não testam aparência.** Entraram com o shell de
navegação e custaram **zero dependência nova**: `renderToStaticMarkup`, de
`react-dom/server`, que já é dependência de runtime — o Vitest segue em
`environment: "node"`, sem jsdom e sem Testing Library. Para a pergunta que estes
testes fazem, asserção sobre a string HTML é mais estrita que uma query por
texto: ela enxerga `aria-current`, `aria-label` e `title`, que uma busca por
texto visível não vê.

O que eles fixam é semântica e estrutura, não pixels: que só a rota ativa carrega
`aria-current="page"` **e** a classe de destaque; que `Button` com `href`
renderiza `<a>` e sem `href` renderiza `<button>`; que a barra lateral some no
breakpoint em que a inferior aparece. Um deles trava uma regra de escopo do
`AGENTS.md`: falha se busca ou fila de conferência voltarem para a navegação.

**O que continua sem teste automatizado é a aparência.** Cada tela foi verificada
no navegador, com medição do DOM quando o problema era de layout. Foi assim que
foram achados — com número, não com impressão — o recorte do wordmark no trilho
colapsado (48,7px de texto para 40px úteis) e o fato de que o design system era
importado sem camada de cascata, o que fazia `a { text-decoration: underline }`
vencer o `.no-underline` do Tailwind e deixava os links da barra inestilizáveis.
Nenhum teste de string pegaria os dois. A troca é consciente e tem custo real:
uma regressão visual não quebra o build.

Um caso ilustra o limite dessa escolha: um conflito que deveria devolver 409
devolveu 500 no servidor de desenvolvimento, e **nenhum teste pegaria** — era
identidade de classe quebrada por hot reload, coisa que só existe fora do grafo
de módulos do runner. Foi a verificação manual que achou. Está registrado em
[ADR-0006](docs/adr/ADR-0006.md).

## Decisões

17 ADRs em [`docs/adr/`](docs/adr/README.md), com índice, as cinco emendas onde
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

E as quatro da navegação e do celular:
[0013](docs/adr/ADR-0013.md) (shell lateral, colapsado na revisão),
[0014](docs/adr/ADR-0014.md) (barra inferior no mobile),
[0015](docs/adr/ADR-0015.md) (`Button` com `href`) e
[0016](docs/adr/ADR-0016.md) (`desde` no contrato de listagem).

Mais uma que não se vê na tela e sustenta as outras:
[0017](docs/adr/ADR-0017.md) — campo sem tipo por documento, para que a troca de
versão do modelo não passe pelo front-end.

## Limitações conhecidas

Todas registradas, nenhuma escondida. As três que mais pesam:

1. **Paginação por offset desliza no pico.** A 6,7 documentos/min, quem está na
   página 2 pode ver o mesmo documento duas vezes. Correção: cursor
   ([ADR-0011](docs/adr/ADR-0011.md)).
2. **Sem endpoint de resumo.** As abas do painel não têm contagem, então não se
   vê quantos aguardam conferência sem paginar ([ADR-0011](docs/adr/ADR-0011.md)).
3. **Sem trilha de auditoria.** `origem` diz que um humano corrigiu, não quem nem
   qual era o valor antes ([ADR-0012](docs/adr/ADR-0012.md)).
4. **No celular, a tabela do painel rola em vez de virar cartões.** São 684px de
   largura mínima contra ~311px úteis num telefone; o `overflow-x-auto` é o piso,
   não o alvo ([ADR-0014](docs/adr/ADR-0014.md)).

## O que não foi entregue

O enunciado descreve dois problemas que **foram analisados e têm solução
desenhada, mas não implementada**. Estão aqui porque omiti-los seria pior do que
admiti-los:

| Fato do enunciado                               | Estado                      | O que foi decidido                                                                                         |
| ----------------------------------------------- | --------------------------- | ---------------------------------------------------------------------------------------------------------- |
| **(c)** o mesmo documento chega mais de uma vez | Desenhado, não implementado | Hash SHA-256 do conteúdo no envio, campo `possivelDuplicataDe` apontando para o original, **sem bloquear** |
| **(d)** o conteúdo é dado pessoal sensível      | Desenhado, não implementado | Mascarar em listagem por critério de reidentificação; número do documento revelado por ação explícita      |

Os dois desenhos chegaram a design fechado e pararam antes da implementação. Duas
notas de honestidade sobre eles:

- **Hash exato só pega reenvio do mesmo arquivo.** A mesma carteira fotografada
  de novo gera bytes diferentes e passa direto. Cobrir isso exigiria hash
  perceptual de imagem, que é visão computacional e outra ordem de custo.
- **Mascaramento de exibição não é segurança de dado.** Não protege trânsito nem
  repouso; o valor cheio continua saindo do backend em todo `GET`. Uma
  implementação real precisa do campo não sair sem necessidade, log de acesso a
  quem revelou o quê, cifra em repouso e controle de acesso.

Fora de escopo desde o início, por `AGENTS.md`: fila de conferência completa e
busca textual.

## Stack

Next.js 16.3.3 (App Router, Turbopack) · React 19 · TypeScript strict ·
Tailwind v4 · Vitest · ESLint 9 + Prettier

Design system importado de `claude.ai/design`, vendorizado em
`styles/design-system/`.
