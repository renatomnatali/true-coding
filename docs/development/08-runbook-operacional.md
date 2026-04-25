# Runbook Operacional

## 1. Antes de Iniciar
Checklist:
1. Projeto conectado ao GitHub.
2. Planos Business/Technical/UX presentes.
3. DB com schema atualizado.
4. Flags:
   - `NEXT_PUBLIC_FEATURE_AUTONOMOUS_DEVELOPMENT_V1=true`
   - `AUTONOMOUS_DEV_EXECUTE_GATES=true`
   - `AUTONOMOUS_DEV_RELEASE_MODE=git-cli`

## 2. Fluxo Operacional Recomendado
1. Rodar análise de complexidade (`/development/assessment`).
2. Revisar resultado e confirmar plano de iterações.
3. Iniciar run (`/development/runs` com `assessmentConfirmed=true`).
4. Acompanhar timeline SSE e estado dos agentes.
5. Em falha recuperável, escolher ação de checkpoint.

## 3. Ações de Checkpoint
Quando a run está em `WAITING_CHECKPOINT`:
- `Retomar checkpoint` (`resume`): retoma iteração atual do checkpoint.
- `Tentar novamente iteração` (`retry`): reseta tentativas da iteração.
- `Cancelar execução` (`cancel`): finaliza run.

## 4. Run em Estado Stale
Se a UI indicar run ativa sem worker:
- usar endpoint `recover`.
- isso limpa sandbox, reativa status e recoloca run na fila do worker.

## 5. Como Validar que Funcionou de Verdade
Após iteração bem-sucedida, validar:
1. Timeline mostra gates aprovados + checkpoints de release.
2. `IterationStatus` vai para `MERGED`/`DEPLOYED`.
3. GitHub contém branch da iteração.
4. PR existe (novo ou reutilizado).
5. Merge commit aparece em `main`.

## 6. Encerramento da Run
Critério de sucesso completo:
- run em `SUCCEEDED`
- projeto em `LIVE`
- `lastDeployAt` preenchido

## 7. Procedimento Rápido de Auditoria
- Ver run: `GET /api/projects/:id/development/runs/:runId`
- Ver timeline: `GET /api/projects/:id/development/runs/:runId/events`
- Ver repositório: branch/PR/merge no GitHub
