# Ambiente do agente

O que estava configurado enquanto o projeto foi construído. Registrado aqui
porque parte disso influenciou o resultado, e nada disso é prompt.

## Comandos de barra usados

| Comando         | Efeito                                                                           |
| --------------- | -------------------------------------------------------------------------------- |
| `/model`        | Sonnet 5, depois Opus 5 a partir do bootstrap                                    |
| `/effort`       | `medium`, depois `max` a partir do bootstrap                                     |
| `/plugin`       | Instalou `claude-code-setup`, `frontend-design`, `superpowers`, `typescript-lsp` |
| `/design-login` | Autorizou o acesso ao projeto de design system em `claude.ai/design`             |

## Instruções permanentes

`AGENTS.md` na raiz, versionado. Contém as quatro regras que o prompt 4 pediu
(escopo de 3 telas, ADR para toda decisão, ADR antes de biblioteca nova,
perguntar em vez de assumir) mais as convenções que foram surgindo.

`CLAUDE.md` na raiz apenas referencia `AGENTS.md` com `@AGENTS.md`.

O bloco no topo do `AGENTS.md`, entre os marcadores `nextjs-agent-rules`, **é
gerado pelo próprio `next dev`** e obriga a ler `node_modules/next/dist/docs/`
antes de escrever código. Foi preservado de propósito: removê-lo só faz o
`next dev` recriá-lo como alteração não commitada.

## Skill

`.claude/skills/karpathy-guidelines/SKILL.md`, versionada.

Instalada no prompt 3, de `github.com/multica-ai/andrej-karpathy-skills`. Quatro
princípios: pensar antes de codar, simplicidade primeiro, mudanças cirúrgicas,
execução guiada por critério de sucesso verificável.

Foi instalada como **skill de projeto** (em `.claude/skills/`) e não como plugin
de marketplace, para ficar versionada junto com o repositório e valer para
qualquer pessoa que trabalhe nele.

## Hooks

Nenhum hook configurado. Não há `.claude/settings.json` versionado.

## O que não está versionado, de propósito

`.claude/settings.local.json` — preferências pessoais da máquina (quais plugins
estão ativos). Está no `.gitignore`, como manda a convenção do sufixo `.local`.

## MCP

O design system foi lido pelo MCP `DesignSync`, do projeto
`8541ef4f-9db6-43f0-a4bc-b87fa37ac7a9` em `claude.ai/design`. Os tokens foram
vendorizados em `styles/design-system/` (ADR-0003); os componentes foram
portados sob demanda (ADR-0009). Nada depende do MCP em tempo de execução — o
projeto compila e roda sem ele.
