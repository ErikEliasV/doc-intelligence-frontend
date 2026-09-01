# features — lógica de domínio por tela

Uma pasta por tela do escopo. Cada pasta reúne o estado, as regras e os
componentes que só fazem sentido naquela tela.

Escopo desta entrega (ver `AGENTS.md`):

- `envio/` — envio de documentos ✅
- `acompanhamento/` — painel de acompanhamento ✅
- `revisao/` — revisão e correção ✅

E uma pasta que não é tela:

- `shell/` — a moldura de navegação que as três compartilham. Fica aqui, e não
  em `components/`, porque conhece rotas — e `components/` não pode. Ver
  `docs/adr/ADR-0013.md`.

**Pode:** orquestrar estado, chamar o cliente de API de `lib/`, compor
componentes de `components/`.

**Não pode:** ser importada por `components/`. A dependência é sempre
`app/` → `features/` → `lib/` + `components/`.

Quando um componente de uma feature passa a ser usado por duas telas sem
carregar regra de domínio, ele sobe para `components/`.
