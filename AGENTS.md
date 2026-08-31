<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

<!-- O bloco acima é gerado e reescrito pelo `next dev`. Não edite nem remova. -->

# DOC Intelligence — instruções permanentes

Serviço de triagem de documentos para um escritório de advocacia. Projeto de
avaliação técnica, trilha Front-end (Trilha B). **Não existe API real:** o
contrato é definido em `lib/` e servido por `mocks/`.

Interface em português do Brasil. Documentação e ADRs em português; código e
comentários em inglês.

## Regras que não mudam

### 1. Escopo fechado em 3 telas

Esta entrega se limita a:

- **Envio de documentos**
- **Painel de acompanhamento**
- **Revisão e correção**

**Nunca implemente Fila de conferência completa ou Busca sem confirmação
explícita antes.** O design system importado cobre cinco telas — as duas extras
existem lá, mas estão fora do escopo até que se diga o contrário.

### 2. Toda decisão de arquitetura relevante vira um ADR

Um arquivo novo em `docs/adr/ADR-000X.md`, **mesmo que não seja pedido**.
Numeração sequencial, sem reaproveitar número. Registre a decisão, as
alternativas descartadas e o custo de reverter.

### 3. Nenhuma biblioteca nova sem ADR antes

Antes de instalar qualquer dependência, liste os trade-offs num ADR: o que ela
resolve, o que ela custa (peso, manutenção, lock-in), e o que seria preciso para
não usá-la.

### 4. Ambiguidade se resolve perguntando

Se uma instrução for ambígua, **pergunte antes de assumir**. Não implemente "a
versão mais completa possível" por padrão. Entregar de menos e perguntar é o
comportamento correto; entregar de mais não é.

## Camadas

A dependência corre numa direção só:

```
app/  →  features/  →  lib/  +  components/
                          ↑
                      mocks/ implementa o contrato de lib/
```

- `app/` — rotas. Só composição, sem regra de negócio.
- `components/` — UI pura. Props entram, JSX sai. Não conhece domínio.
- `features/` — lógica de domínio, uma pasta por tela.
- `lib/` — contratos, tipos, cliente de API. A fronteira com o back-end.
- `mocks/` — dados falsos, latência e erro simulados.
- `docs/adr/` — decisões de arquitetura.
- `styles/design-system/` — design system importado, **vendorizado**. Ver abaixo.

Cada pasta tem um `README.md` com a sua fronteira. Leia antes de colocar um
arquivo nela.

## Design system

Importado de `claude.ai/design` (projeto `8541ef4f-9db6-43f0-a4bc-b87fa37ac7a9`)
e vendorizado em `styles/design-system/`.

- **Os arquivos em `styles/design-system/tokens/` são cópias literais. Não edite
  à mão** — re-sincronize da origem e ponha overrides locais fora de `tokens/`.
- Cor, tipo, espaço, forma e movimento sempre por token: `var(--ink-900)` ou o
  utilitário Tailwind `ds-*` equivalente. Nunca hex cru, nunca px solto.
- Regras de aderência do design system rodam no ESLint. Ver `docs/adr/ADR-0003.md`.

Convenções de conteúdo que o design system impõe e que valem para todo texto de
interface: português do Brasil, sentence case, **sem emoji**, fato antes de
tranquilização ("3 documentos enviados", não "Tudo pronto!"), botões são verbos
("Confirmar envio", nunca "OK"), números em fonte mono.

## Verificação

Antes de dizer que algo está pronto, rode e confira a saída:

```bash
npm run typecheck && npm run lint && npm run format:check && npm run build
```
