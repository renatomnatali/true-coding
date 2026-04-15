# Máquina de Estados

## 1. `DevelopmentRunStatus`
Estados públicos:
- `QUEUED`
- `RUNNING`
- `WAITING_CHECKPOINT`
- `FAILED`
- `CANCELED`
- `SUCCEEDED`

Transições principais:
- `QUEUED -> RUNNING`: worker inicia processamento.
- `RUNNING -> WAITING_CHECKPOINT`: falha recuperável (gates/release) ou pausa manual.
- `RUNNING -> SUCCEEDED`: todas as iterações concluídas.
- `RUNNING -> FAILED`: erro não tratado no orquestrador.
- `RUNNING -> CANCELED`: cancelamento explícito.
- `WAITING_CHECKPOINT -> RUNNING`: `resume`, `approve`, `retry` ou `recover`.

## 2. `IterationStatus`
Estados públicos:
- `PENDING`
- `RUNNING`
- `GATED`
- `MERGED`
- `DEPLOYED`
- `FAILED`

Transições principais:
- `PENDING -> RUNNING`: início da iteração.
- `RUNNING -> GATED`: gates aprovados.
- `GATED -> MERGED`: release concluído e PR mergeado.
- `MERGED -> DEPLOYED`: deploy/status final da iteração.
- `RUNNING -> FAILED`: falha após tentativas ou falha de release.
- `FAILED -> PENDING`: retry/resume reseta tentativa.

## 3. Mapeamento para `Project.status`
No fluxo autônomo:
- run `QUEUED|RUNNING` tende a refletir `Project.status=GENERATING`.
- durante release/deploy, há transição pontual para `DEPLOYING`.
- run `SUCCEEDED` leva projeto para `LIVE`.
- run `WAITING_CHECKPOINT|FAILED|CANCELED` leva projeto para `FAILED` na UI operacional.

## 4. Eventos de Estado
Cada transição relevante gera `RunEvent`:
- `RUN_STATUS`
- `ITERATION_STATUS`
- `AGENT_TASK`
- `QUALITY_GATE`
- `DEPLOY_STATUS`
- `ERROR`
- `INFO`

A UI usa esses eventos para timeline e barra de progresso.

## 5. Retry Boundary (limpeza lógica de timeline)
A timeline não deve misturar tentativas antigas com a atual.

`getRetryBoundarySequence` define novo início lógico quando encontra `RUN_STATUS` com:
- `status=RUNNING` e `action` em `resume|approve|retry|manual_resume`, ou
- mensagem de retry, ou
- transição `WAITING_CHECKPOINT/FAILED -> RUNNING`.

Com isso, eventos antigos deixam de aparecer no recorte principal da timeline.
