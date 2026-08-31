# lib — contratos, tipos e cliente de API

A fronteira com o back-end. É aqui que o contrato vive, e é a única camada que
sabe como uma requisição é feita.

Conteúdo previsto:

- tipos e schemas do domínio (documento, status, campo extraído, confiança)
- o cliente de API — uma superfície de funções tipadas
- erros de domínio normalizados

**Regra que sustenta o mock:** `features/` importa o cliente daqui e nunca sabe
se por trás existe um mock ou uma API real. Trocar `mocks/` por HTTP real não
pode exigir mudança em nenhuma tela.

**Não pode:** importar de `features/`, `components/` ou `app/`.
