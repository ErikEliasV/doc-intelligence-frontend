# mocks — dados falsos e simulação de rede

Não existe API real neste projeto. O contrato definido em `lib/api/types.ts` e
especificado em `docs/api/openapi.yaml` é servido daqui.

```
simulation/config.ts    taxas e janelas de tempo
simulation/fixtures.ts  campos e mensagens de erro plausíveis
simulation/engine.ts    o motor — estado, transições, sorteios
simulation/*.test.ts    testes do motor
store.ts                a instância única que os route handlers compartilham
```

O transporte HTTP fica em `app/api/documents/` e é adaptador fino: sem regra de
negócio. Ver `docs/adr/ADR-0006.md`.

**Regra:** o mock implementa o contrato declarado em `lib/`, nunca o contrário.
Nenhum arquivo fora desta pasta importa fixtures diretamente.

## O motor não usa timers

O destino de um documento — duração, falhar ou não, confiança de cada campo — é
sorteado uma vez, no upload. Toda leitura depois é função pura do tempo
decorrido. Por isso um teste consegue adiantar 40 segundos sem esperar, e ler
duas vezes devolve exatamente o mesmo documento.

Se for mexer aqui: **não introduza `setTimeout`**. O relógio e o gerador
aleatório entram por `EngineDeps`, e é isso que mantém os testes determinísticos.
