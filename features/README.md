# features — lógica de domínio por tela

Uma pasta por tela do escopo. Cada pasta reúne o estado, as regras e os
componentes que só fazem sentido naquela tela.

Escopo desta entrega (ver `AGENTS.md`):

- `envio/` — envio de documentos ✅
- `acompanhamento/` — painel de acompanhamento ✅
- `revisao/` — revisão e correção ✅

**Pode:** orquestrar estado, chamar o cliente de API de `lib/`, compor
componentes de `components/`.

**Não pode:** ser importada por `components/`. A dependência é sempre
`app/` → `features/` → `lib/` + `components/`.

Quando um componente de uma feature passa a ser usado por duas telas sem
carregar regra de domínio, ele sobe para `components/`.
