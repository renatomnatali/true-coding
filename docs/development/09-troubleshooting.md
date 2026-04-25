# Troubleshooting da Fase de Desenvolvimento

## 1. "Schema de desenvolvimento autônomo ainda não foi aplicado"
Causa provável:
- tabelas novas não existem no banco alvo.

Ação:
- executar migração/push do Prisma no ambiente correto.

## 2. "AUTONOMOUS_DEV_EXECUTE_GATES is disabled"
Causa provável:
- execução de gates desativada por variável de ambiente.

Ação:
- definir `AUTONOMOUS_DEV_EXECUTE_GATES=true`.

## 3. "An autonomous run is already active for this project"
Causa provável:
- já existe run em `QUEUED|RUNNING|WAITING_CHECKPOINT`.

Ação:
- listar runs ativas.
- retomar/recover em vez de abrir nova run.

## 4. Timeline com eventos antigos após retry/resume
Causa provável:
- cliente não aplicou corretamente o recorte por `retry boundary`.

Ação:
- confirmar evento `RUN_STATUS` com `action=retry|resume|approve|manual_resume`.
- validar se UI está filtrando por `sequence >= boundary`.

## 5. Run em `WAITING_CHECKPOINT` sem ação disponível na tela
Causa provável:
- painel não renderizou botões de recuperação.

Ação:
- validar estado recebido pela UI.
- garantir CTAs de checkpoint habilitados para `WAITING_CHECKPOINT|FAILED`.

## 6. Projeto mostra "Gerando código" mas repositório não muda
Causas prováveis:
- gates falhando antes do release.
- release falhando no passo `clone/checkout/write/commit/push`.

Ação:
- inspecionar `QualityGateRun` e `RunEvent`.
- identificar `failedGateSummary` ou `release step` no `errorSummary`.
- executar retry/checkpoint após correção.

## 7. Falha de release em `push`
Causas prováveis:
- token sem permissão de escrita.
- branch protegida com política incompatível.
- problema de conectividade.

Ação:
- validar escopo do token e permissões do repo.
- validar política de branch/PR.
- observar `GitCliReleaseError.details` sanitizado.

## 8. Status visual contraditório (ex.: "Concluído" com item "RUNNING")
Causa provável:
- regra de composição da UI não está priorizando o último estado causal.

Ação:
- usar `sequence` como ordenação única.
- evitar mistura de eventos antigos sem boundary.
- renderizar badge a partir do `activeRun.status` mais recente.

## 9. Run falha logo na tentativa 1 com BUILD/UNIT/BDD
Causas prováveis:
- workspace incompleto (`package.json` ausente, dependências ausentes).
- bootstrap/fallback insuficiente para stack exigida.

Ação:
- conferir eventos de `workspace bootstrap`.
- conferir instalação de dependências no sandbox.
- corrigir templates base e repetir.
