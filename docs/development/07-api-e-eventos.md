# APIs e Eventos da Fase de Desenvolvimento

## 1. Endpoints HTTP
### 1.1 Análise de complexidade
`POST /api/projects/:id/development/assessment`

Retorna:
- `assessment`
- `iterations`
- metadados de execução de agentes (`durationMs`, `tokenUsage`, `cost`)

### 1.2 Runs
`POST /api/projects/:id/development/runs`

Request mínimo:
```json
{
  "assessmentConfirmed": true
}
```

Request com plano aprovado:
```json
{
  "assessmentConfirmed": true,
  "approvedAssessment": { "...": "..." },
  "approvedIterations": [{ "...": "..." }]
}
```

Resposta:
- `201` run criada
- `200` run já ativa (`alreadyActive=true`)

`GET /api/projects/:id/development/runs`
- lista últimas runs
- inclui `isStale` para runs ativas sem worker observado recentemente

`GET /api/projects/:id/development/runs/:runId`
- status consolidado da run com iterações, tasks e gates

### 1.3 Eventos SSE
`GET /api/projects/:id/development/runs/:runId/events?after=<sequence>`

Eventos enviados:
- `run_status`
- `iteration_status`
- `agent_task`
- `quality_gate`
- `deploy_status`
- `error`
- `info`
- `done` (quando run terminal)

### 1.4 Checkpoints e recuperação
`POST /api/projects/:id/development/runs/:runId/checkpoints/:iteration`

Body:
```json
{ "action": "pause|resume|approve" }
```

`POST /api/projects/:id/development/runs/:runId/retry`
- reinicia iteração falha e volta run para `RUNNING`

`POST /api/projects/:id/development/runs/:runId/recover`
- retoma run `QUEUED|RUNNING` sem worker ativo

`POST /api/projects/:id/development/runs/:runId/cancel`
- cancela run ativa

## 2. Tipos Públicos
`DevelopmentRunStatus`:
- `QUEUED | RUNNING | WAITING_CHECKPOINT | FAILED | CANCELED | SUCCEEDED`

`IterationStatus`:
- `PENDING | RUNNING | GATED | MERGED | DEPLOYED | FAILED`

`QualityGateType`:
- `BUILD | UNIT | BDD | REVIEW | SECURITY`

## 3. Contrato de Evento
Exemplo de evento de gate:
```json
{
  "id": "evt_123",
  "runId": "run_123",
  "sequence": 78,
  "eventType": "quality_gate",
  "message": "BUILD gate failed",
  "payload": {
    "gateType": "BUILD",
    "passed": false,
    "durationMs": 945,
    "summary": "Missing dependency"
  },
  "createdAt": "2026-02-15T20:10:00.000Z"
}
```

Exemplo de checkpoint de release:
```json
{
  "eventType": "info",
  "payload": {
    "phase": "release",
    "step": "push",
    "summary": "origin/iter/run-1-fundacao",
    "durationMs": 832,
    "attempt": 1
  }
}
```

## 4. Retry Boundary na SSE
Quando a run reentra em `RUNNING` por `resume/retry/approve`, a UI usa `retry boundary` para recortar timeline da tentativa atual e esconder eventos antigos.
