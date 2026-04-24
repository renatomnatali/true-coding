# Pipeline de Generation (v2 — congelada)

**Status:** Congelada. Código preservado, não executado em produção.
**Contexto do pivô:** [ADR-0008 Stack Única MVP](../adr/ADR-0008-stack-unica-mvp.md) documentou a stack original; o pivô para Spec-as-a-Service (TRC-ADR-008 no Notion) removeu Generation da proposta de valor do MVP.
**Protocolo de preservação:** [ADR-0026](../adr/ADR-0026-protocolo-congelamento-generation.md).

---

## Objetivo deste documento

Permitir que uma pessoa nova no projeto entenda, em menos de 15 minutos, o que é a pipeline de Generation, quais arquivos a compõem, por que está congelada e como retomar no futuro via MCP delegation.

---

## O que é a pipeline de Generation

A pipeline de Generation era o núcleo do produto v2. A partir de um plano aprovado (business + técnico + UX), o orquestrador executava agentes de IA (Assessment, IterationPlanner, Spec, Test, Code, Review), gerava arquivos TypeScript/Next.js, rodava quality gates (install, build, unit, BDD) e escrevia o resultado em um repositório Git remoto + entrega via Netlify.

O pivô para Spec-as-a-Service (TRC-ADR-008) redireciona o produto para **exportar** um bundle de especificação para o usuário consumir em seu próprio ambiente (via MCP delegation, por exemplo). A pipeline de Generation deixou de ser feature ativa, mas o investimento técnico (≈1.000 linhas de código + ≈200 testes) continua com valor estratégico caso a delegação via MCP se mostre insuficiente e seja necessário voltar a executar geração internamente.

---

## Máquina de estados

Em `prisma/schema.prisma` (`enum ProjectStatus`):

```
IDEATION → PLANNING → CONNECTING → GENERATING → DEPLOYING → LIVE
                                                              → FAILED
```

- **IDEATION / PLANNING:** descoberta conversacional e planejamento técnico/UX. Continua ativo (faz parte da fase Especificação do MVP).
- **CONNECTING:** vincula o projeto ao GitHub do usuário (OAuth + escolha de repositório).
- **GENERATING:** orquestrador executa agentes de IA e gera código.
- **DEPLOYING:** entrega o código em ambiente Netlify.
- **LIVE:** projeto com entrega ativa.

As transições CONNECTING → GENERATING → DEPLOYING → LIVE são exclusivas da pipeline de Generation e ficam **dormentes** sob a flag `ENABLE_CODE_GENERATION=false` (implementação concreta em TRC-05.1).

---

## Arquivos principais

### Orquestração (`src/lib/development/`)

| Arquivo | Papel |
|---|---|
| `orchestrator.ts` (~1.000 linhas) | `processDevelopmentRun` e `enqueueDevelopmentRun`; coordena agentes, gates e release |
| `agents.ts` (~600 linhas) | `runAssessmentAgent`, `runIterationPlannerAgent`, `runSpecAgent`, `runTestAgent`, `runCodeAgent`, `runReviewAgent` |
| `agent-runtime.ts` / `agent-executor.ts` | Invocação via Claude API com cache e retry |
| `quality-gates.ts` (~430 linhas) | Executa `npm install/build/test` + BDD em sandbox |
| `gate-diagnostics.ts` | Resumo legível de falhas de gate |
| `gitops.ts` / `git-release-cli.ts` (~380 linhas) | Clone + commit + push do código gerado |
| `deploy.ts` | Integração com Netlify |
| `workspace.ts` (~420 linhas) | Sandbox de arquivos, bootstrap, merge |
| `file-manifest.ts` + `file-generator.ts` | Modo single-shot vs. iterativo para gerar arquivos |
| `plan-snapshot.ts` / `run-control.ts` (~400 linhas) | Snapshot do plano aprovado, retry, checkpoints, cancel |
| `retry-strategy.ts` / `retry-boundary.ts` / `retry-classification.ts` | Baby-step mode, classificação de falhas determinísticas |
| `worker-registry.ts` | Registro in-process (ver ADR-0007) |

### Templates e codegen (`src/lib/codegen/`)

| Arquivo | Papel |
|---|---|
| `generator.ts` (~320 linhas) | `sanitizeGeneratedFiles`, normalização de paths |
| `templates.ts` | Templates base Next.js |
| `validator.ts` | Validação estática dos arquivos gerados |

### Prompts de IA (`src/lib/ai/prompts/`)

- `codegen.ts` (~190 linhas) — prompts dos agentes Spec/Test/Code/Review.
- `planning.ts` / `discovery.ts` continuam ativos na fase de Especificação.

### Rotas HTTP (`src/app/api/projects/[id]/`)

- `connect/route.ts` — inicia CONNECTING (OAuth GitHub).
- `development/assessment/route.ts` — assessment inicial.
- `development/runs/route.ts` e `runs/[runId]/{cancel,checkpoints,events,recover,retry}` — controle de execução.
- `approve/route.ts` — já contém lógica de bypass para a fase Especificação (parte do pivô).

### CLI de release

`src/lib/development/git-release-cli.ts` expõe `executeGitCliRelease` (clone/checkout/write/commit/push) com checkpoints e `spawn` em `node:child_process`.

---

## O que está dormente vs. ativo

**Dormente sob a flag (a implementar em TRC-05.1):**
- Transições de status CONNECTING, GENERATING, DEPLOYING, LIVE.
- Endpoints em `development/` e `connect/`.
- Todo `src/lib/development/*` exceto leitura de snapshots.
- `src/lib/codegen/*`.
- Prompts em `src/lib/ai/prompts/codegen.ts`.
- Integrações Netlify (`src/lib/netlify/*`) e GitHub-release (`src/lib/github/*`).

**Ativo e imprescindível:**
- Descoberta conversacional (`discovery.ts`, fase IDEATION).
- Planejamento técnico/UX (`planning.ts`, fase PLANNING).
- Modelo de dados (`prisma/schema.prisma`) — a enum `ProjectStatus` permanece para preservar compatibilidade de dados e testes.
- Rota `approve/route.ts` (com bypass do pivô).

---

## Suites de teste relevantes

Executadas em CI mesmo com a flag off (SLO: 100% verde — ver ADR-0026):

- `src/lib/development/orchestrator.files.test.ts`
- `src/lib/development/orchestrator.recovery.test.ts`
- `src/lib/development/agents.test.ts`
- `src/lib/development/agents.runtime.test.ts`
- `src/lib/development/agents.pipeline-v2.test.ts`
- `src/lib/development/agent-runtime.test.ts`
- `src/lib/development/agent-runtime.caching.test.ts`
- `src/lib/development/quality-gates.test.ts`
- `src/lib/development/quality-gates.workspace-sync.test.ts`
- `src/lib/development/gate-diagnostics.test.ts`
- `src/lib/development/deploy.test.ts`
- `src/lib/development/gitops.test.ts`
- `src/lib/development/git-release-cli.test.ts`
- `src/lib/development/file-generator.test.ts`
- `src/lib/development/file-manifest.test.ts`
- `src/lib/development/interface-map.test.ts`
- `src/lib/development/retry-boundary.test.ts`
- `src/lib/development/retry-classification.test.ts`
- `src/lib/development/retry-strategy.test.ts`
- `src/lib/development/code-scanner.test.ts`
- `src/lib/codegen/generator.test.ts`
- `src/lib/codegen/templates.test.ts`
- `src/lib/codegen/validator.test.ts`

Status verificado em 2026-04-24: **23 arquivos, 155 testes, todos verdes**.

---

## Como retomar no futuro

Gatilhos esperados para descongelar (detalhados em ADR-0026 e no ADR-008 do Notion):

1. Base legal LGPD resolvida para executar código em nome do usuário.
2. Sinal de mercado de que MCP delegation não atende a um nicho relevante.
3. Decisão de produto de oferecer Generation como feature premium.

Caminho sugerido para retomada:

1. Ligar a flag `ENABLE_CODE_GENERATION=true` em ambiente controlado.
2. Rodar os testes listados acima e cobrir integrações Netlify/GitHub em staging.
3. Revisar ADRs 0006, 0007, 0008 para detectar premissas quebradas (ex.: modelos de IA, limites de tokens, provedor de entrega).
4. Estabilizar prompts em `src/lib/ai/prompts/codegen.ts` contra a versão atual dos modelos antes de reabilitar em produção.

---

## Referências

- [ADR-0008 Stack Única MVP](../adr/ADR-0008-stack-unica-mvp.md)
- [ADR-0007 Execução In-Process](../adr/ADR-0007-in-process-pipeline-execution.md)
- [ADR-0026 Protocolo de Congelamento](../adr/ADR-0026-protocolo-congelamento-generation.md)
- TRC-ADR-008 no Notion (pivô Spec-as-a-Service).
- TRC-07 épico pai deste documento.
