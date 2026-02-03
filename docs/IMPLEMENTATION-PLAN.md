# Plano de Implementação - True Coding

> **Metodologia:** Mockup → Gherkin → TDD → Implementação → PR

---

## Fases do Projeto (baseado nos mockups)

| Fase | Nome | Mockups | Status |
|------|------|---------|--------|
| 1 | Ideation (Discovery) | `phase-1-ideation/` (6 telas) | 🟡 Parcial |
| 2 | Planning | `phase-2-planning/` (9 telas) | 🔴 Pendente |
| 3 | Connection | `phase-3-connection/` (3 telas) | 🔴 Pendente |
| 4 | Assessment + Generation | `phase-4-*/` (10 telas) | 🔴 Pendente |
| 5 | Deploy | `phase-5-deploy/` (3 telas) | 🔴 Pendente |
| 6 | Online | `phase-6-online/` (1 tela) | 🔴 Pendente |

---

## Fase 1: Ideation (Discovery) - 🟡 PARCIAL

### O que já temos:
- ✅ ChatPanel com progress tracking
- ✅ Quick replies por pergunta
- ✅ State restoration (PR #15)
- ✅ BDD tests básicos

### O que falta:
- [ ] Gherkin completo para todas as telas
- [ ] Testes para fluxo completo (Q1→Q5→Gerar Plano)
- [ ] Loading overlay durante geração

### Mockups:
```
01-start.html         → Pergunta inicial
02-question-2.html    → Features principais
03-question-3.html    → Público-alvo
04-question-4.html    → Diferenciais
05-confirm.html       → Confirmação antes de gerar
06-generating.html    → Loading de geração
```

---

## Fase 2: Planning - 🔴 PENDENTE

### Sub-fases:
```
Business Plan → Technical Plan → UX Plan → (próxima fase)
```

### Mockups:
```
01-business-plan.html         → Visualizar plano gerado
02-business-plan-edit.html    → Editar plano
03-business-plan-confirm.html → Aprovar plano

04-technical-plan.html        → Visualizar stack/arquitetura
05-technical-plan-edit.html   → Selecionar tecnologias
06-technical-plan-confirm.html→ Aprovar stack

07-ux-plan.html               → Visualizar design tokens
08-ux-plan-edit.html          → Customizar UX
09-ux-plan-confirm.html       → Aprovar UX
```

### Gherkin necessário: `docs/specifications/planning.feature`

---

## Fase 3: Connection - 🔴 PENDENTE

### Mockups:
```
01-github-oauth.html          → Conectar GitHub
02-repository-created.html    → Repo criado
03-vercel-connect.html        → Conectar Vercel
```

### Gherkin necessário: `docs/specifications/connection.feature`

---

## Fase 4: Assessment + Generation - 🔴 PENDENTE

### Mockups Assessment:
```
01-complexity-analysis.html   → Análise de complexidade
02-iteration-plan.html        → Plano de iterações
```

### Mockups Generation:
```
01-generating-code.html       → Gerando código (loading)
02-code-generated.html        → Código gerado
03-review-code.html           → Review do código
04-commit-confirm.html        → Confirmar commit
05-iteration-progress.html    → Progresso da iteração
06-iteration-complete.html    → Iteração completa
07-project-paused.html        → Projeto pausado
08-iteration-error.html       → Erro na iteração
```

### Gherkin necessário: `docs/specifications/generation.feature`

---

## Fase 5: Deploy - 🔴 PENDENTE

### Mockups:
```
01-deploying.html             → Deploy em progresso
02-deployed.html              → Deploy concluído
03-environment-vars.html      → Configurar env vars
```

### Gherkin necessário: `docs/specifications/deploy.feature`

---

## Fase 6: Online - 🔴 PENDENTE

### Mockups:
```
01-project-live.html          → Projeto publicado! 🎉
```

### Gherkin necessário: `docs/specifications/online.feature`

---

## Ordem de Implementação

### Sprint 1: Completar Discovery + Iniciar Planning
1. [ ] Completar Gherkin `discovery.feature` (todas as telas)
2. [ ] Implementar testes TDD para fluxo completo
3. [ ] Criar `planning.feature` (Business Plan)
4. [ ] Implementar visualização do Business Plan

### Sprint 2: Planning Completo
5. [ ] Technical Plan (Gherkin + TDD + Implementação)
6. [ ] UX Plan (Gherkin + TDD + Implementação)

### Sprint 3: Connection
7. [ ] GitHub OAuth (Gherkin + TDD + Implementação)
8. [ ] Vercel Connect (Gherkin + TDD + Implementação)

### Sprint 4: Generation
9. [ ] Assessment (complexidade + plano de iterações)
10. [ ] Code Generation (Gherkin + TDD + Implementação)

### Sprint 5: Deploy + Online
11. [ ] Deploy flow
12. [ ] Celebração + projeto live

---

## Estrutura de Arquivos Gherkin

```
docs/specifications/
├── discovery.feature      ← Fase 1 (parcial)
├── planning.feature       ← Fase 2 (criar)
├── connection.feature     ← Fase 3 (criar)
├── generation.feature     ← Fase 4 (criar)
├── deploy.feature         ← Fase 5 (criar)
└── online.feature         ← Fase 6 (criar)
```

---

## Próximo Passo Imediato

**Criar `docs/specifications/planning.feature`** com cenários para:
- Visualizar Business Plan gerado
- Editar Business Plan
- Aprovar Business Plan
- Transição para Technical Plan
- (repetir para Technical e UX Plan)

---

## Ciclo de Desenvolvimento (por feature)

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

---

**Criado:** 03 Fev 2026
**Última atualização:** 03 Fev 2026
