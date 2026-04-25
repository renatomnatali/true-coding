# Agentes e Contratos

## 1. O que são os agentes no True Coding
No pipeline de desenvolvimento, "agente" é uma unidade especializada que recebe um contexto estruturado e devolve um JSON validado por contrato.

Eles não executam merge/deploy diretamente. O papel deles é gerar e validar artefatos de iteração (spec, testes, código e revisão) para que o orquestrador consiga aplicar gates e avançar com segurança.

## 2. Onde estão implementados
- Definição de comportamento por agente: `src/lib/development/agents.ts`
- Runtime LLM (Claude), parse e validação de JSON: `src/lib/development/agent-runtime.ts`
- Wrapper de execução com persistência e eventos: `src/lib/development/agent-executor.ts`
- Orquestração e ordem de acionamento: `src/lib/development/orchestrator.ts`

## 3. Agentes existentes e responsabilidade real
### `AssessmentAgent`
- Objetivo: calcular complexidade do projeto.
- Implementação atual: heurística determinística em `calculateAssessment(...)`.
- Saída: `AssessmentResult` (`complexityScore`, `complexityLevel`, `factors`, `recommendedIterations`).

### `IterationPlannerAgent`
- Objetivo: converter assessment em backlog de iterações.
- Implementação atual: `buildIterationPlan(...)` com foco em páginas/endpoints do plano técnico.
- Saída: `GeneratedIterationPlan` com lista de `IterationPlanItem`.

### `SpecAgent`
- Objetivo: gerar artefatos de especificação BDD da iteração.
- Saída contratual:
  - `gherkinPath`
  - `featureTags[]`
  - `gherkin`
  - `files[]`

### `TestAgent`
- Objetivo: gerar testes do escopo da iteração (unit + BDD).
- Saída contratual:
  - `redStateConfirmed`
  - `testTargets[]`
  - `command`
  - `files[]`

### `CodeAgent`
- Objetivo: implementar apenas o necessário para atender o escopo da iteração.
- Saída contratual:
  - `appliedChanges[]`
  - `branchStrategy`
  - `commitMessage`
  - `files[]`

### `ReviewAgent`
- Objetivo: validar aderência ao escopo e riscos de regressão/segurança.
- Saída contratual:
  - `approved`
  - `checks[]`
  - `notes`

## 4. Contrato de entrada comum (contexto)
Todos recebem `AgentExecutionContext`:
- `runId`
- `projectId`
- `iterationId?`
- `iterationIndex?`
- `attempt?`
- `snapshot`:
  - `businessPlan`
  - `technicalPlan`
  - `uxPlan`
  - `approvedAssessment?`
  - `approvedIterations?`

Esse contexto evita dependência implícita e permite rastrear exatamente qual versão de plano motivou cada decisão.

## 5. Como os agentes são acionados
## 5.1 Fase de assessment (API dedicada)
Endpoint `POST /api/projects/:id/development/assessment` executa:
1. `runAssessmentAgent(...)`
2. `runIterationPlannerAgent(...)`

Importante: nessa fase o sistema retorna avaliação/plano para aprovação, sem abrir run de desenvolvimento.

## 5.2 Dentro da run de desenvolvimento
No orquestrador (`processRunInternal` + `processIteration`), os agentes são chamados nesta ordem:
1. `SpecAgent`
2. `TestAgent`
3. `CodeAgent`
4. `ReviewAgent`

Se a run não tiver plano aprovado no snapshot, antes disso o orquestrador também roda:
- `AssessmentAgent`
- `IterationPlannerAgent`

## 5.3 Ordem obrigatória por tentativa
Para cada tentativa da iteração:
1. Spec
2. Test
3. Code
4. Review
5. Gates (`BUILD`, `UNIT`, `BDD`, `REVIEW`, `SECURITY`)

Se gates falham, a iteração pode tentar novamente (até 3 vezes) ou pausar em checkpoint (`WAITING_CHECKPOINT`), dependendo da estratégia configurada.

## 6. Wrapper de execução: persistência e observabilidade
Toda chamada de agente passa por `executeAgent(...)` (`src/lib/development/agent-executor.ts`).

O wrapper faz automaticamente:
1. Criar `AgentTaskRun` com `status=RUNNING`, `inputHash`, `startedAt`.
2. Emitir evento `AGENT_TASK` (`started`).
3. Executar o agente real (`run`).
4. Em sucesso: atualizar task com `status=SUCCEEDED`, `output`, `durationMs`, `tokenUsage`, `cost`.
5. Em falha: atualizar task com `status=FAILED`, `errorMessage` e `output` estruturado (quando disponível).
6. Emitir evento `AGENT_TASK` final (`SUCCEEDED`/`FAILED`).

### Campos persistidos mais importantes em `AgentTaskRun`
- `agentName`
- `inputHash`
- `status`
- `output`
- `durationMs`
- `tokenUsage`
- `cost`
- `errorMessage`

Isso permite auditar custo/tempo por agente e depurar regressões por tentativa.

## 7. Runtime LLM e validação de contrato
O runtime de LLM fica em `src/lib/development/agent-runtime.ts`.

## 7.1 Quando o runtime Claude é usado
`isClaudeAgentRuntimeEnabled()` exige:
- `AUTONOMOUS_DEV_LLM_AGENTS=true`
- provedor IA configurado via `AI_PROVIDER`:
  - `anthropic` (default) exige `ANTHROPIC_API_KEY`
  - `zai` exige `ZAI_API_KEY` e usa endpoint Anthropic-compatível (`ZAI_ANTHROPIC_BASE_URL`, default `https://api.z.ai/api/anthropic`)

Sem isso, os agentes de geração podem usar fallback determinístico apenas em contexto permitido (principalmente `NODE_ENV=test`). Fora desse contexto, o agente falha com `AGENT_RUNTIME_DISABLED:<AgentName>`.

## 7.2 Como a saída é validada
Fluxo em `runClaudeAgent(...)`:
1. envia prompt para `chat(...)` (Claude)
2. extrai JSON com `extractJSON(...)`
3. valida o JSON com `zod` (schema do agente)
4. se inválido, lança erro `AGENT_CONTRACT_INVALID:<agent>:<path>:<reason>`
5. calcula/estima `tokenUsage` e `cost`

Ou seja: texto livre fora do contrato não passa. Só JSON válido e aderente ao schema segue adiante.

## 7.3 Runtime com cache (Pipeline V2)
`runClaudeAgentWithCache(...)` em `agent-runtime.ts`:
- Usa `chatWithCache(...)` em vez de `chat(...)`.
- Aceita `systemBlocks: TextBlockParam[]` com `cache_control: { type: 'ephemeral' }`.
- Retorna texto raw (conteúdo direto do ficheiro), sem wrapper JSON.
- Usa phase `filegen` (maxTokens: 4.096) por defeito.

Isso permite reutilizar o system prompt + snapshot no cache do Claude entre chamadas consecutivas do file-by-file generator.

## 8. Segurança dos artefatos gerados
Os agentes são proibidos de produzir paths inseguros. O contrato força:
- sem path absoluto
- sem `..`
- sem caractere nulo (`\0`)

Além disso, antes de gravar em sandbox, o fluxo normaliza e revalida paths (`sanitizeWorkspacePath`), bloqueando path traversal.

## 9. Como agentes se conectam ao restante do pipeline
- Agentes produzem artefatos e decisão técnica da iteração.
- Gates validam se o resultado é executável e seguro.
- Release (git CLI + PR/merge) só roda após gates passarem.

Observação importante: hoje não existe um `ReleaseAgent` formal na camada de contratos de agentes. A etapa de release é tratada como fase operacional do orquestrador (`executeIterationGitRelease`) com checkpoints estruturados na timeline.

## 10. Sequência resumida (execução real)
1. run inicia (`QUEUED -> RUNNING`)
2. iteração entra em `RUNNING`
3. `SpecAgent` gera Gherkin/artefatos
4. `TestAgent` gera testes
5. `CodeAgent` implementa
6. `ReviewAgent` revisa
7. gates executam
8. se tudo verde: release real (commit/push/PR/merge)
9. iteração `MERGED -> DEPLOYED`
10. última iteração concluída: run `SUCCEEDED`

## 11. Módulos de suporte ao Pipeline V2 (incremental)

### `OutputTokenRateLimiter` (`src/lib/ai/rate-limiter.ts`)
Token bucket com sliding window de 60s. Rastreia output tokens por minuto e aplica backoff quando se aproxima do limite (8K tokens/min no tier atual). Expõe `waitForCapacity(requiredTokens)` para uso antes de cada call LLM.

### `FileManifest` (`src/lib/development/file-manifest.ts`)
`buildManifestFromSnapshot(snapshot, iteration)` produz lista determinística de ficheiros a gerar, em ordem topológica (types → schema → components → pages → api → tests → spec), com estimativa de tokens por ficheiro. Se `totalEstimatedTokens < 4.000`, `shouldUseSingleShot()` retorna `true` e o pipeline V1 é usado como fallback.

### `InterfaceMap` (`src/lib/development/interface-map.ts`)
Extrai exports de ficheiros TypeScript gerados (interfaces, types, function signatures) via regex. `serializeInterfaceMap()` produz resumo compacto para inclusão no prompt de calls seguintes, garantindo coerência de tipos entre ficheiros gerados separadamente.

### `FileGenerator` (`src/lib/development/file-generator.ts`) *(PR 3)*
Loop de geração ficheiro-a-ficheiro. Itera o manifest em ordem topológica, chama LLM por ficheiro via `runClaudeAgentWithCache`, acumula interface map, respeita rate limiter.

### Tipos adicionados (`src/lib/development/types.ts`)
- `FileManifestEntry` — path, kind, dependsOn, estimatedTokens
- `FileManifest` — entries[], totalEstimatedTokens

### Phase `filegen` (`src/lib/ai/config.ts`)
Configuração de modelo dedicada para geração ficheiro-a-ficheiro: `maxTokens: 4096`, `temperature: 0.2`, modelo Sonnet.

## 12. Referências diretas no código
- `src/lib/development/agents.ts`
- `src/lib/development/agent-runtime.ts`
- `src/lib/development/agent-executor.ts`
- `src/lib/development/orchestrator.ts`
- `src/lib/development/quality-gates.ts`
- `src/lib/ai/rate-limiter.ts`
- `src/lib/ai/config.ts`
- `src/lib/development/file-manifest.ts`
- `src/lib/development/interface-map.ts`
