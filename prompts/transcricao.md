# Transcrição dos prompts

Literal, em ordem. Ver [`README.md`](README.md) para o contexto.

---

## 1 — Ferramental

```
instale o https://github.com/headroomlabs-ai/headroom
```

---

## 2 — Ferramental

```
intale tambem esse https://github.com/thedotmack/claude-mem
```

---

## 3 — Skill do projeto

```
instale e use essa skill nesse projeto https://github.com/multica-ai/andrej-karpathy-skills
```

---

## 4 — Bootstrap

```
Contexto: estamos construindo o "DOC Intelligence", um serviço de triagem de
documentos para um escritório de advocacia. Este é um projeto de avaliação
técnica — a trilha escolhida é Front-end (Trilha B). Não existe API real: eu
vou definir e servir o contrato via mock.

Sua primeira tarefa é o bootstrap do projeto, não nenhuma tela ainda.

Faça o seguinte, nesta ordem:
1. Inicialize um projeto Next.js 14+ com TypeScript, App Router e Tailwind CSS.( eu ja inicializei porem verifica se ta tudo certo)
2. Configure ESLint + Prettier com regras razoáveis para um projeto real.
3. Crie a estrutura de pastas com separação por camadas: /app (rotas),
   /components (UI pura), /features (lógica de domínio por tela), /lib
   (contratos, tipos, cliente de API), /mocks (dados falsos e simulação de
   latência/erro), /docs/adr (decisões de arquitetura).
4. Crie um arquivo AGENTS.md na raiz com estas instruções permanentes para
   você mesmo neste projeto:
   - O escopo desta entrega é limitado a 3 telas: Envio de documentos, Painel
     de acompanhamento, Revisão e correção. Nunca implemente Fila de
     conferência completa ou Busca sem eu confirmar explicitamente antes.
   - Toda decisão de arquitetura relevante vira um novo arquivo
     /docs/adr/ADR-000X.md, mesmo que eu não peça.
   - Nunca introduza uma biblioteca nova sem antes listar os trade-offs num
     ADR.
   - Se uma instrução minha for ambígua, pergunte antes de assumir — não
     implemente "a versão mais completa possível" por padrão.
5. Crie um commit inicial descrevendo a estrutura. Não crie nenhuma tela
   ainda.

Ao final, me diga quais decisões de estrutura você tomou, por quê, e o que
ficou de fora nesta etapa., quero tambem que você use esse design system nesse projeto Use the claude_design MCP (https://api.anthropic.com/v1/design/mcp, auth via /design-login) to import this project:
https://claude.ai/design/p/8541ef4f-9db6-43f0-a4bc-b87fa37ac7a9

Focus on these files (the whole project is readable):
- `_adherence.oxlintrc.json`
- `_ds_bundle.js`
- `_ds_manifest.json`
- `DOC Intelligence App (offline).html`
- `readme.md`
- `SKILL.md`
- `styles.css`
- `thumbnail.html`

Implement: the selected files
```

---

## 5 — Contrato de API e mock

```
Estamos em develop. Crie a branch feature/api-contract-mock a partir dela.

Escopo: definir e servir (via mock) o contrato de API que a interface vai
consumir. A API real não existe — você está especificando o contrato que um
backend real implementaria depois.

Faça:
1. Defina em TypeScript os tipos: Document, DocumentStatus (enum: recebido,
   processando, pronto, erro, em_conferencia), ExtractedField (nome, valor,
   confianca), UploadResponse, DocumentListResponse.
2. Documente o contrato como se fosse a especificação para o backend seguir
   (openapi.yaml ou markdown em /docs/api-contract.md — escolha e justifique
   num ADR).
3. Implemente a simulação do processamento assíncrono: ao subir um
   documento, ele leva entre 5 e 40 segundos simulados para mudar de status,
   e cerca de 15% das vezes retorna erro — isso simula o modelo de IA de
   terceiro sendo lento e instável.
4. Simule também baixa confiança: cerca de 30% dos documentos processados
   devem sair com confiança baixa em pelo menos um campo, forçando o status
   para em_conferencia.
5. Escreva testes unitários para a lógica do mock (não para UI ainda).
6. Registre em ADR por que você escolheu [MSW / rotas de API do Next.js /
   outra abordagem] para servir o mock, e o que descartou.

Não implemente nenhuma tela nesta demanda — só o contrato e o mock por trás
dele.

Ao final, resuma o que ficou pronto e pergunte se pode seguir para a próxima
branch.
```

---

## 6 — Reenvio do prompt 5

Idêntico ao anterior, reenviado com marcação de citação (`>`). A resposta foi
verificar que o trabalho já estava feito e **não** refazê-lo, para não duplicar
ADRs e sujar o histórico.

---

## 7 — Tela de envio

```
Branch develop já tem feature/api-contract-mock mergeada. Crie
feature/upload-screen a partir de develop.

Escopo: a tela de Envio de documentos.

Requisitos:
- Selecionar/arrastar múltiplos arquivos (imagem ou PDF) de uma vez.
- Mostrar preview em miniatura de cada arquivo antes/durante o envio.
- Indicador de status de envio por arquivo (enviando, enviado, erro de
  envio) — isso é sobre o envio em si, não sobre o processamento
  (assíncrono, pertence à próxima tela).
- Usar o mock de API da demanda anterior.
- Tratar falha de envio de forma visível — nunca falhar silenciosamente.

Restrições explícitas:
- Não implemente validação de tipo de documento (é trabalho da IA, fora do
  escopo do front).
- Não implemente crop, rotação ou edição de imagem.
- Não acesse a câmera do dispositivo — só seleção de arquivos.

Registre em ADR qualquer biblioteca usada para upload/drag-and-drop, com
alternativas descartadas.

Escreva testes para seleção múltipla e tratamento de erro de envio.

Ao final, aponte explicitamente qualquer fato do ambiente (do documento da
avaliação) que esta tela ainda não trata, e por quê.
```

---

## 8 — Correção de rumo: Tailwind

```
não pode você não fez a implementação usando tailwind css, quero que o sistema inteiro seja em tailwind
```

---

## 9 — Bug: tamanho do arquivo vazando

```
quando seleciona uma arquivo em quando ele ta no processo aguardando o texto do tamanho do arquivo as vezes ta saindo no elemento
```

---

## 10 — Tooltip + painel de acompanhamento

```
não precisa mostrar o nome inteiro porem seria legal quando a pessoa colocar o mouse em cima conseguir ver o nome do arquivo, Crie feature/tracking-panel a partir de develop.

Escopo: lista de documentos com status.

Requisitos:
- Listar documentos enviados com status atual (recebido, processando,
  pronto, erro, em_conferencia).
- Atualizar status periodicamente enquanto houver itens em processamento
  (escolha polling ou outra estratégia e registre em ADR — inclusive por
  que não WebSocket, dado o volume e a simplicidade do escopo).
- Paginar ou virtualizar a lista — em dias de pico chegam 800 documentos,
  não pode renderizar tudo de uma vez.
- Ao clicar num documento em_conferencia, navegar para a tela de revisão
  (pode ser rota placeholder por enquanto).

Restrições explícitas:
- Não implemente filtros avançados combinados.
- Não implemente busca textual (é escopo de outra tela, fora da fatia
  vertical).
- Não implemente exportação de dados.

Escreva testes para a lógica de paginação/atualização de status.

Ao final, explique como sua escolha de atualização se comporta no pico de
800 documentos em 2 horas — é uma limitação conhecida ou algo resolvido?
```

---

## 11 — Bug: pill encostando na confiança

Acompanhado de uma captura de tela da linha do painel.

```
quand esta no status de EM CONFERENCIA podemos ver que o elemento encosta na porcentagem de confiança
```

---

## 12 — Decisão de contrato

Resposta a uma pergunta sobre como a revisão deveria fechar o documento.

```
PATCH + confirmação explícita separada, não PATCH que já fecha o status sozinho.
```

---

## 13 — Tela de revisão e correção

```
Crie feature/review-correction a partir de develop.

Escopo: a tela mais crítica da entrega — fecha a fatia vertical do envio até
a correção de um campo.

Requisitos:
- Layout lado a lado: documento original (imagem/PDF) de um lado, campos
  extraídos do outro.
- Campos editáveis, com indicação visual de confiança (destaque nos de
  baixa confiança).
- Botão salvar que chama o mock e muda o status do documento para pronto.
- Trate o fato de que duas pessoas do atendimento podem abrir o mesmo item
  de conferência ao mesmo tempo: implemente uma simulação de lock otimista
  ou um aviso de "este item já está sendo revisado por outra pessoa" no
  mock. Documente a estratégia em ADR, incluindo o que seria feito em
  produção real (ex: lock no backend, conflito 409).

Restrições explícitas:
- Foque em um único tipo de documento (ex: identidade, com os campos nome,
  filiação, data de nascimento, número, órgão emissor) — não tente suportar
  todos os tipos possíveis.
- Não implemente zoom, rotação ou anotação avançada da imagem — um
  visualizador simples basta.

Escreva ao menos um teste cobrindo o fluxo completo: carregar item em
conferência, editar campo, salvar, verificar status pronto.

Ao final, escreva o parágrafo obrigatório sobre onde você (o agente) errou
nesta demanda especificamente — algo que precisou de correção ou
redirecionamento, mesmo que pareça pequeno.
```

---

## 14 — Publicação

```
suba todas as alterações feitas
```

---

## 15 — Integração da fatia vertical

```
Crie chore/vertical-slice-integration a partir de develop, após o merge das
três telas.

Escopo: amarrar o caminho de ponta a ponta e provar que a fatia vertical
funciona de verdade.

Faça:
1. Confirme o caminho completo funcionando manualmente: enviar documento
   fictício → aparece processando no painel → após latência simulada, se
   cair em baixa confiança, some pra fila de conferência → abrir, corrigir
   campo, salvar → volta ao painel como pronto.
2. Escreva um teste de integração (ou e2e leve, ex: Playwright, se der
   tempo) cobrindo esse caminho.
3. Consolide todos os ADRs criados até aqui num índice único em
   /docs/adr/README.md.
4. Gere de 3 a 5 documentos fictícios de teste (nunca dados reais):
   caminho feliz, baixa confiança, erro de processamento simulado.

Não adicione nenhuma funcionalidade nova nesta etapa — só integração e prova
de que a fatia funciona.

Ao final, me dê um relatório: o que funciona de ponta a ponta, o que é
mock/simulado versus o que seria real, e o que você recomendaria como
próximo passo se o projeto continuasse.
```

---

## 16 — Fechamento da entrega

```
Estamos prontos para fechar a entrega. Crie a branch release/v1 a partir de
develop.

Faça:
1. Escreva o README.md final: como subir o projeto localmente, quais
   comandos rodar, o que está mockado versus real, e um parágrafo explicando
   o que foi escolhido testar e por quê.
2. Confirme que todos os prompts usados ao longo do projeto estão salvos, na
   íntegra e em ordem, em /prompts/ — não me deixe esquecer isso, é item
   obrigatório da entrega.
3. Confirme que AGENTS.md e qualquer skill/comando/hook configurado estão
   versionados no repositório.
4. Rode uma checagem final: build limpo, lint sem erros, testes passando.
5. Não adicione nenhuma funcionalidade nova aqui — só documentação e
   finalização.
```

---

## 17 — Detecção de duplicidade

```
Crie a branch feature/duplicate-detection a partir de develop.

Contexto: o documento da avaliação registra que o mesmo documento físico
costuma chegar mais de uma vez — o cliente reenvia por insegurança, o
atendimento reenvia por precaução (fato c). Isso ficou registrado como
pendência desde a Demanda 1 e ainda não foi tratado.

Escopo:
1. No upload, calcule um hash de conteúdo (ex: SHA-256) de cada arquivo
   recebido.
2. Ao registrar um novo documento, compare o hash contra os documentos já
   existentes (qualquer status). Se houver coincidência exata, marque o
   novo documento com um campo possivelDuplicataDe apontando para o id do
   documento original, sem bloquear o envio.
3. Na tela de envio, mostre um aviso não bloqueante quando um arquivo for
   identificado como possível duplicata ("este arquivo já foi enviado
   antes, em [data/hora]").
4. No painel de acompanhamento, sinalize visualmente documentos marcados
   como possível duplicata (um selo discreto), sem removê-los da lista — a
   decisão de descartar ou não é humana.

Restrições explícitas:
- Não implemente detecção por similaridade de conteúdo (mesma foto tirada
  duas vezes, ângulos diferentes) — exigiria visão computacional e está
  fora do escopo. Documente essa limitação: hash exato só captura reenvio
  do mesmo arquivo, não do mesmo documento físico fotografado de novo.
- Não bloqueie ou rejeite automaticamente um envio duplicado — a
  conferência humana decide o que fazer.

Atualize types.ts e o openapi.yaml com o novo campo, e registre a decisão
inteira (hash exato, não bloquear, limitação da abordagem) em um ADR novo.

Escreva testes: mesmo arquivo enviado duas vezes é marcado; arquivos
diferentes não são; a marcação não impede o processamento normal.

Ao final, deixe explícito no relatório que esta é uma solução parcial para
o fato (c), e o que ficaria pendente numa versão futura (ex: hash
perceptual de imagem).
```

---

## 18 — Mascaramento de dado sensível

```
Crie a branch feature/sensitive-data-masking a partir de develop.

Contexto: o conteúdo dos documentos é dado pessoal, parte dele sensível
(fato d). Hoje o painel de acompanhamento e a tela de revisão exibem os
campos extraídos sem nenhum tratamento de exposição.

Escopo:
1. Defina quais campos são sensíveis o suficiente para mascarar em contexto
   de listagem (o número do documento é o candidato óbvio; decida sobre os
   demais e justifique).
2. No painel de acompanhamento, nenhum campo de documento deve aparecer em
   texto pleno — se algum resumo de campo for mostrado na lista, mascare
   (ex: "•••.•••.•••-12").
3. Na tela de revisão, o campo completo pode ser mostrado (é o propósito da
   tela), mas avalie se o número completo deveria exigir uma ação explícita
   para revelar (ex: campo mascarado por padrão com botão "mostrar").
4. Não altere os dados no mock/contrato — o mascaramento é só de exibição.

Restrições explícitas:
- Não implemente controle de acesso/autenticação real — fora do escopo
  desta entrega.
- Não mascare o nome da pessoa (é dado pessoal, mas necessário para o
  trabalho de conferência de identidade).

Registre em ADR os campos escolhidos e o critério usado para decidir o que
mascarar, citando o fato (d) do enunciado como motivação.

Escreva testes garantindo que o dado sensível não aparece em texto pleno
nos componentes de listagem.

Ao final, deixe explícito que esta é uma medida de exibição, não de
segurança de dados em trânsito/repouso — e o que uma implementação real
precisaria além disso (ex: campo nunca sair do backend sem necessidade, log
de acesso).
```

---

## 19 — Shell de navegação lateral

```
Crie a branch feature/navigation-sidebar a partir de develop.

Escopo: um shell de navegação lateral compartilhado pelas 3 telas (Envio,
Acompanhamento, Revisão).

Faça:
1. Crie um layout compartilhado com uma barra lateral fixa contendo links
   para /envio e /acompanhamento. A tela de revisão é acessada a partir do
   painel, não precisa de item próprio na barra — mas deve indicar de
   algum jeito (breadcrumb ou botão voltar) como retornar ao painel.
2. Destaque visualmente a rota ativa na barra lateral.
3. Use componentes de navegação do design system já portado, se existir
   algum adequado; senão, porte o componente necessário sob demanda (não o
   pacote inteiro) e registre em ADR, seguindo o mesmo processo das
   demandas anteriores.

Restrições explícitas:
- Não adicione itens de navegação para Busca ou Fila de conferência
  completas — não fazem parte do escopo desta entrega.
- Avalie se a barra lateral cabe na tela de revisão sem comprometer o
  espaço da visualização lado a lado do documento. Se comprometer, decida
  entre colapsar a barra nessa rota ou deixá-la fora do shell, e documente
  a decisão — não force o layout só para manter consistência visual.

Escreva testes de que a rota ativa é destacada corretamente.

Ao final, aponte qualquer trade-off de espaço que a barra lateral criou na
tela de revisão, já que ela é a mais apertada das três.
```

---

## 20 — Aprovação do desenho

```
pode
```

---

## 21 — Celular e ações de header

```
Eu quero que você ajeite a sitedebar na versão de celular, faça uma sidebar
compativel, e tambem tem uns botoes no designs system no "header" da pagina,
na tela de envio de "ir para painel" que leva para a tela de acompanhamento,
e a tela de aconpanhamento tem um botão de "enviar mais" que vou para a tela
de envio e ao lado dele tem um nomero que fala o total de documentos enviados
hoje
```

---

## 22 — Aprovação do desenho

```
pode
```

---

## 23 — Publicação

```
suba as alterações
```

---

## 24 — Remoção da atribuição

```
tire essas duas contribuicoes no commit do cluade
```

---

## 25 — Reafirmação

```
eu quero que não tenha contribuicão
```

---

## 26 — Publicação, de novo

```
suba
```

---

## 27 — Fechamento da entrega, revisado

```
Estamos prontos para fechar a entrega. Crie a branch release/v1 a partir de
develop.

Faça:
1. Escreva o README.md final: como subir o projeto localmente, quais
   comandos rodar, o que está mockado versus real, e um parágrafo explicando
   o que foi escolhido testar e por quê.
2. Confirme que todos os prompts usados ao longo do projeto estão salvos, na
   íntegra e em ordem, em /prompts/ — não me deixe esquecer isso, é item
   obrigatório da entrega.
3. Confirme que AGENTS.md e qualquer skill/comando/hook configurado estão
   versionados no repositório.
4. Rode uma checagem final: build limpo, lint sem erros, testes passando.
5. Não adicione nenhuma funcionalidade nova aqui — só documentação e
   finalização. Item adicional: confirme que o README, o índice de ADRs e a especificação
cobrem também a detecção de duplicidade, o mascaramento de dados sensíveis,
a navegação lateral e a responsividade — não só as 3 telas originais.
```
