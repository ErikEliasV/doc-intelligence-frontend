# Documentos fictícios de teste

Cinco arquivos gerados por código, para exercitar a fatia vertical à mão.

**Nenhum contém dado real.** São retângulos coloridos e um PDF de uma página em
branco — não há foto de pessoa, nome, CPF ou número de documento verdadeiro em
lugar nenhum. Os nomes dos arquivos descrevem o papel que cada um cumpre no
teste, não o que está desenhado dentro.

| arquivo                 | tipo | papel no teste                                                |
| ----------------------- | ---- | ------------------------------------------------------------- |
| `rg-frente-fake.png`    | PNG  | caminho feliz — imagem exibe no visualizador da revisão       |
| `rg-verso-fake.png`     | PNG  | segundo arquivo do mesmo lote, para testar envio múltiplo     |
| `rg-desbotado-fake.png` | PNG  | nome sugere baixa qualidade; serve para a fila de conferência |
| `rg-rasurado-fake.png`  | PNG  | idem, e para o caso de erro de processamento                  |
| `procuracao-fake.pdf`   | PDF  | exercita o painel rotulado — PDF não tem miniatura (ADR-0008) |

## O desfecho não vem do arquivo

Importante, e é a parte que costuma confundir: **o mock não olha o conteúdo do
arquivo.** Ele sorteia o desfecho no momento do envio — 15% erro, e dos
processados com sucesso 30% caem em conferência (ADR-0006).

Ou seja: subir `rg-desbotado-fake.png` **não garante** baixa confiança. O nome é
uma convenção para quem lê o teste, não um gatilho.

Para exercitar os três cenários:

- **À mão:** suba os cinco de uma vez, algumas vezes. Com 5 documentos por lote,
  a chance de nenhum cair em conferência é de ~0,85⁵ ≈ 44%, então dois ou três
  lotes bastam. O painel em `/acompanhamento` mostra os três desfechos lado a
  lado.
- **De forma determinística:** é o que o teste de integração faz. Ele fixa
  `Math.random` e o relógio, e assim escolhe o desfecho de cada documento —
  ver `mocks/integracao.test.ts`.

## Regerar

```bash
node mocks/exemplos/gerar.mjs
```
