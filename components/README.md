# components — UI pura

Componentes de apresentação. Recebem tudo por props e devolvem JSX.

**Pode:** receber props, emitir callbacks, usar tokens do design system.

**Não pode:** buscar dados, conhecer rotas, importar de `features/` ou `mocks/`,
guardar regra de negócio. Se um componente precisa saber o que é um documento em
triagem, ele pertence a `features/`.

O teste: um componente daqui deve renderizar isolado, sem nenhum mock, só com props.

Estilo vem do design system em `styles/design-system/` — tokens via `var(--token)`
ou utilitários Tailwind `ds-*`. Ver `docs/adr/ADR-0003.md`.
