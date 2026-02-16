# ADR-0007 — Execução In-Process do Pipeline de Desenvolvimento

**Status:** Aceito
**Data:** 2026-02
**Referências no código:** `src/lib/development/orchestrator.ts` (enqueueDevelopmentRun),
`src/lib/development/worker-registry.ts`

---

## Contexto

O pipeline de desenvolvimento autônomo precisa executar tarefas de longa duração
(agentes IA, quality gates, git release) de forma assíncrona. A questão é onde
e como executar essas tarefas.

Opções consideradas:
1. Job queue externo (Redis + BullMQ, Inngest, QStash)
2. Edge functions com durabilidade (Vercel Cron, Durable Objects)
3. Execução in-process via setTimeout(0) com worker registry em memória

## Decisão

Adotar a opção 3 (in-process) para o MVP, com mecanismos de recuperação:

- `setTimeout(0)` dispara `processDevelopmentRun()` no mesmo processo Node.js
- `worker-registry.ts` usa `Set<string>` em memória para evitar workers duplicados
- Detecção de runs stale: RUNNING/QUEUED sem worker ativo há >60s
- Endpoint de recover (`POST .../recover`) permite retomar runs orphaned
- Checkpoint model com confirmação explícita do usuário

## Consequências

- **Positivas:** Zero dependências externas, deploy simples, sem custo de infra adicional
- **Negativas:** Runs não sobrevivem a restart do servidor; em serverless (Vercel),
  `setTimeout` pode ser cortado pelo runtime; um pipeline longo pode impactar
  o event loop para requests HTTP
- **Mitigação:** Sistema de detecção de stale + recover + checkpoint garante
  que nenhuma run fica presa permanentemente
- **Evolução planejada:** Migrar para job queue (Inngest ou QStash) quando o
  volume de runs justificar, mantendo a mesma interface pública em `run-control.ts`
