# components — UI pura

Componentes de apresentação. Recebem tudo por props e devolvem JSX.

**Pode:** receber props, emitir callbacks, usar tokens do design system.

**Não pode:** buscar dados, conhecer rotas, importar de `features/` ou `mocks/`,
guardar regra de negócio. Se um componente precisa saber o que é um documento em
triagem, ele pertence a `features/`.

O teste: um componente daqui deve renderizar isolado, sem nenhum mock, só com props.

Estilo é **sempre Tailwind**, nunca `style={{}}`. Os tokens do design system em
`styles/design-system/` chegam como utilitários — `bg-ink-900`, `type-body-sm`,
`shadow-hard` — declarados em `app/globals.css`. Ver `docs/adr/ADR-0010.md`.

Os componentes não definem padding nem layout: isso é do chamador, via
`className`. É o que dispensa `tailwind-merge` — ver `components/cn.ts`.
