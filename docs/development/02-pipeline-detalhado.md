# Pipeline Detalhado da Fase de Desenvolvimento

## 1. Entrada da Fase
A fase de desenvolvimento é iniciada via `POST /api/projects/:id/development/runs`.

Validações de entrada:
- Usuário autenticado e dono do projeto.
- `assessmentConfirmed=true` obrigatório.
- Planos base existentes (`businessPlan`, `technicalPlan`, `uxPlan`).
- Schema Prisma aplicado (`assertAutonomousDevelopmentSchemaReady`).
- `AUTONOMOUS_DEV_EXECUTE_GATES=true`.

Se já existir run ativa (`QUEUED|RUNNING|WAITING_CHECKPOINT`), a API retorna a run existente (`alreadyActive=true`) em vez de abrir uma segunda run.

## 2. Criação da Run
`createDevelopmentRun`:
- cria registro em `DevelopmentRun` com `status=QUEUED`.
- congela snapshot dos planos em `plansSnapshot`.
- emite evento `RUN_STATUS` com `status=QUEUED`.
- enfileira processamento assíncrono (`enqueueDevelopmentRun`).

## 3. Inicialização no Orquestrador
`processDevelopmentRun`:
- marca run ativa no `worker-registry`.
- muda run para `RUNNING`.
- muda `Project.status` para `GENERATING`.
- cria sandbox efêmero por run (`ensureSandbox`).
- gera bootstrap de workspace (`ensureWorkspaceBootstrap`).

## 4. Definição do Plano de Iterações
`ensureIterations`:
- se `approvedAssessment + approvedIterations` existem no snapshot, usa plano aprovado.
- se não existem, executa `AssessmentAgent` e `IterationPlannerAgent`.
- cria `IterationRun` com branch curta por iteração.
- atualiza `totalIterations` e `currentIteration`.

## 5. Loop da Iteração
Para cada `IterationRun` não finalizada:
- seta iteração para `RUNNING`.
- emite `ITERATION_STATUS: RUNNING`.
- roda tentativas até `MAX_ITERATION_ATTEMPTS=3`.

### 5.1 Pipeline V1 (single-shot, legado)
Fluxo por tentativa (ordem fixa):
1. `SpecAgent` gera/atualiza Gherkin e artefatos de spec.
2. `TestAgent` gera testes (estado RED esperado no contrato).
3. `CodeAgent` implementa mínimo necessário.
4. Artefatos dos agentes são gravados no sandbox.
5. `ReviewAgent` executa revisão de qualidade.
6. Gates executam em sequência: `BUILD -> UNIT -> BDD -> REVIEW -> SECURITY`.

### 5.2 Pipeline V2 (incremental file-by-file)
Ativado por `PIPELINE_V2=true`. Resolve truncamento (`AGENT_RESPONSE_TRUNCATED`) e rate limit (429) ao gerar ficheiros um a um em vez de tudo numa única chamada LLM.

Fluxo por tentativa:
1. **Manifest** — `buildManifestFromSnapshot(snapshot, iteration)` gera lista determinística de ficheiros a criar, em ordem topológica, com estimativa de tokens.
2. **Types** — gera ficheiro de tipos/interfaces partilhados (1 call LLM, ~1.200 tokens output).
3. **Spec** — `SpecAgent` gera apenas Gherkin (sem ficheiros de código).
4. **Generate** — `file-generator` itera o manifest em ordem topológica. Cada ficheiro é gerado numa call LLM separada (~1.500 tokens output). O interface map acumula exports dos ficheiros já gerados para contexto das calls seguintes.
5. **Review** — `ReviewAgent` recebe interface map + manifest compacto (não ficheiros completos).
6. **Gates** — sem mudanças: `BUILD -> UNIT -> BDD -> REVIEW -> SECURITY`.

Benefícios:
- Cada call fica abaixo de 4.096 tokens output → sem truncamento.
- Rate limit de 8K output/min é respeitado via `OutputTokenRateLimiter`.
- System prompt + snapshot são cached via `cache_control: { type: 'ephemeral' }`, economizando ~85% em input tokens.

Fallback: se `manifest.totalEstimatedTokens < 4.000`, usa o path single-shot (não há risco de truncamento para apps pequenos).

## 6. Resultado dos Gates
- Se algum gate falhar:
  - evento `INFO` com resumo da falha.
  - se modo baby-steps ligado, pausa em checkpoint antes de consumir 3 tentativas.
  - ao atingir 3 tentativas, run vai para `WAITING_CHECKPOINT`.
- Se todos passarem:
  - iteração vira `GATED`.
  - segue para release real no GitHub.

## 7. Release Real
`executeIterationGitRelease`:
- commit/push via `git CLI` no sandbox de release.
- criação/reuso de PR por API GitHub.
- merge squash por API GitHub.

Checkpoints emitidos durante release (timeline):
- `clone`
- `checkout`
- `write`
- `commit`
- `push`

Depois do push:
- PR criado/reusado.
- merge executado.
- iteração vira `MERGED` e depois `DEPLOYED`.

## 8. Finalização da Run
Quando todas as iterações terminam:
- `DevelopmentRun.status = SUCCEEDED`
- `Project.status = LIVE`
- `Project.lastDeployAt` atualizado
- evento `RUN_STATUS: SUCCEEDED`

## 9. Tratamento de Falhas Recuperáveis
Falhas de gate ou release não precisam matar a run imediatamente.

Comportamento atual:
- iteração falha: `IterationRun.status = FAILED`
- run pausa: `DevelopmentRun.status = WAITING_CHECKPOINT`
- `errorSummary` preenchido com diagnóstico
- UI mostra CTAs: `Retomar checkpoint`, `Tentar novamente iteração`, `Cancelar execução`

## 10. Limpeza de Sandbox
Sandbox é limpo quando run entra em estado terminal ou `WAITING_CHECKPOINT`.
Isso evita contaminar tentativas futuras e mantém isolamento por run.
