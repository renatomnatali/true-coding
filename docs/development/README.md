# Fase de Desenvolvimento de Código (True Coding)

> ⚠️ **CONGELADA NO MVP** (ADR-0009, 2026-04-14)
>
> Toda a documentação desta pasta cobre a Fase de Generation (desenvolvimento autônomo), que foi adiada para v2 após decisão de pivotamento para Spec-as-a-Service. O código permanece no repositório sob feature flag `ENABLE_CODE_GENERATION` (default `false` em produção).
>
> **Quando descongelar**: ver ADR-0009 e Decision Log do Notion. A retomada provavelmente reestruturará o fluxo via **MCP delegation** (delegar geração a IAs externas como Claude Code/Codex/Devin) em vez de reinventar o orquestrador in-process.
>
> A documentação abaixo permanece válida como referência histórica e base técnica para o descongelamento futuro.

## Objetivo
Esta documentação descreve exatamente o que acontece na fase de desenvolvimento autônomo de código do True Coding: desde a criação da run até merge/deploy, incluindo estados, checkpoints, eventos, falhas e recuperação.

Escopo desta pasta: implementação atual do repositório em `src/lib/development`, APIs em `src/app/api/projects/[id]/development` e UI operacional em `src/components/project/DevelopmentActivityPanel.tsx`.

## Princípios Operacionais
- Execução é real. Não existe modo de "simulação" no fluxo atual.
- O fluxo obrigatório da iteração é: `Spec/BDD -> Testes (RED) -> Código -> Testes/Gates (GREEN) -> Release`.
- Run não é retomada automaticamente ao abrir projeto. O usuário confirma retomada.
- Falha recuperável (gates/release) leva para `WAITING_CHECKPOINT` com ação explícita do usuário.

## Mapa de Leitura
1. `docs/development/02-pipeline-detalhado.md`
2. `docs/development/03-maquina-de-estados.md`
3. `docs/development/04-agentes-e-contratos.md`
4. `docs/development/05-quality-gates.md`
5. `docs/development/06-release-git-cli.md`
6. `docs/development/07-api-e-eventos.md`
7. `docs/development/08-runbook-operacional.md`
8. `docs/development/09-troubleshooting.md`
9. `docs/development/10-bdd-tdd-policy.md`
10. `docs/development/11-diagrama-de-sequencia.md`

## Fontes de Verdade no Código
- Orquestração: `src/lib/development/orchestrator.ts`
- Controle de run/checkpoint/retry: `src/lib/development/run-control.ts`
- Gates: `src/lib/development/quality-gates.ts`
- Release real no GitHub: `src/lib/development/git-release-cli.ts`, `src/lib/development/gitops.ts`
- Contratos/tipos: `src/types/development.ts`, `src/lib/development/types.ts`
- Eventos: `src/lib/development/events.ts`, `src/lib/development/retry-boundary.ts`
- UI operacional: `src/components/project/DevelopmentActivityPanel.tsx`
- Rate limiter: `src/lib/ai/rate-limiter.ts`
- Manifest de ficheiros: `src/lib/development/file-manifest.ts`
- Interface map: `src/lib/development/interface-map.ts`
- Configuração de modelos/phases: `src/lib/ai/config.ts`

## Pré-requisitos para Rodar em Ambiente de Dev
- Banco com schema aplicado (`DevelopmentRun`, `IterationRun`, `AgentTaskRun`, `QualityGateRun`, `RunEvent`).
- Feature ligada: `NEXT_PUBLIC_FEATURE_AUTONOMOUS_DEVELOPMENT_V1=true`.
- Execução de gates ligada: `AUTONOMOUS_DEV_EXECUTE_GATES=true`.
- Release mode: `AUTONOMOUS_DEV_RELEASE_MODE=git-cli`.
- Projeto conectado ao GitHub com token válido do usuário.

## Resultado Esperado
Uma run bem-sucedida deve deixar evidências consistentes em 4 lugares:
- Banco: run/iteração em `SUCCEEDED`/`DEPLOYED`.
- Timeline SSE: sequência causal sem regressão de estado.
- GitHub: branch da iteração, commit real, PR e merge em `main`.
- UI: status e barras coerentes com a run ativa.
