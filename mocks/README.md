# mocks — dados falsos e simulação de rede

Não existe API real neste projeto. O contrato definido em `lib/` é servido daqui.

Conteúdo previsto:

- fixtures de documentos cobrindo os cinco status do design system
  (`received`, `processing`, `ready`, `review`, `error`)
- simulação de latência e de falha, com taxa de erro configurável
- avanço de estado no tempo, para o painel de acompanhamento ter o que mostrar

**Regra:** o mock implementa a interface declarada em `lib/`, nunca o contrário.
Nenhum arquivo fora desta pasta importa fixtures diretamente.

A forma exata (MSW, route handlers em `app/api/`, ou módulo em memória) ainda não
foi decidida e vira um ADR quando for — ver `AGENTS.md`.
