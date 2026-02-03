# Plano de Implementação - True Coding

> **Metodologia:** Mockup → Gherkin → TDD → Implementação → PR

---

## Fases do Projeto (baseado nos mockups)

| Fase | Nome | Mockups | Gherkin | Status |
|------|------|---------|---------|--------|
| 1 | Ideation (Discovery) | `phase-1-ideation/` | `discovery.feature` | 🟡 Parcial |
| 2 | Planning | `phase-2-planning/` | `planning.feature` | 🔴 Pendente |
| 3 | Connection | `phase-3-connection/` | TODO | 🔴 Pendente |
| 4 | Assessment + Generation | `phase-4-*/` | TODO | 🔴 Pendente |
| 5 | Deploy | `phase-5-deploy/` | TODO | 🔴 Pendente |
| 6 | Online | `phase-6-online/` | TODO | 🔴 Pendente |

---

## Ciclo de Desenvolvimento (BDD/TDD)

```
1. Mockup existe? → Se não, criar primeiro
         ↓
2. Escrever Gherkin (.feature)
         ↓
3. Escrever testes (TDD) baseados no Gherkin
         ↓
4. Rodar testes → FALHAM (red)
         ↓
5. Implementar código
         ↓
6. Rodar testes → PASSAM (green)
         ↓
7. Refatorar se necessário
         ↓
8. Criar PR → Code Review → Merge
```

**Nota:** Os arquivos `.feature` são especificações em prosa (Gherkin), não executáveis diretamente. Os testes TDD em `tests/e2e/steps/` são escritos baseados nos cenários Gherkin.

---

## Estrutura de Arquivos

```
docs/specifications/
├── discovery.feature      ← Fase 1
├── planning.feature       ← Fase 2
├── connection.feature     ← Fase 3 (TODO)
├── generation.feature     ← Fase 4 (TODO)
├── deploy.feature         ← Fase 5 (TODO)
└── online.feature         ← Fase 6 (TODO)

tests/e2e/
├── steps/
│   ├── discovery.steps.tsx   ← Testes TDD da Fase 1
│   └── planning.steps.tsx    ← Testes TDD da Fase 2 (TODO)
└── support/
    └── test-utils.ts         ← Helpers para testes
```

---

## Regra de Progresso (Discovery)

**Fonte de verdade:** `progress% = currentQuestion / total * 100`

| Estado | currentQuestion | completedQuestions | Progress |
|--------|-----------------|-------------------|----------|
| Início | 1 | [] | 20% |
| Após Q1 | 2 | [1] | 40% |
| Após Q2 | 3 | [1,2] | 60% |
| Após Q3 | 4 | [1,2,3] | 80% |
| Após Q4 | 5 | [1,2,3,4] | 100% |
| Após Q5 | 5 | [1,2,3,4,5] | 100% + "Plano pronto" |

---

## Sprint 1: Completar Discovery

- [x] Gherkin `discovery.feature`
- [ ] Revisar testes existentes em `discovery.steps.tsx`
- [ ] Implementar cenários faltantes

## Sprint 2: Planning - Business Plan

- [x] Gherkin `planning.feature` (Business Plan)
- [ ] Testes TDD para visualização do Business Plan
- [ ] Testes TDD para edição do Business Plan
- [ ] Testes TDD para aprovação do Business Plan
- [ ] Implementar componentes

## Sprint 3: Planning - Technical + UX Plan

- [ ] Testes TDD para Technical Plan
- [ ] Testes TDD para UX Plan
- [ ] Implementar componentes
- [ ] Navegação entre planos

## Sprint 4: Connection

- [ ] Gherkin `connection.feature`
- [ ] GitHub OAuth flow
- [ ] Vercel connect flow

## Sprint 5: Generation

- [ ] Gherkin `generation.feature`
- [ ] Code generation flow
- [ ] Iteration management

## Sprint 6: Deploy + Online

- [ ] Gherkin `deploy.feature` + `online.feature`
- [ ] Deploy flow
- [ ] Celebração

---

**Criado:** 03 Fev 2026
