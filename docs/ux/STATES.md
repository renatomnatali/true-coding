# Matriz de Estados - Discovery & Planning Phases

> **Princípio:** O estado do banco de dados é a FONTE DA VERDADE.
> A UI deve SEMPRE refletir o estado do banco, não manter estado local inconsistente.

---

## 1. Modelo de Dados Relevante

```
Project
├── status: ProjectStatus (IDEATION | PLANNING | CONNECTING | ...)
├── businessPlan: Json | null
├── technicalPlan: Json | null
├── uxPlan: Json | null (a ser adicionado)
├── planningSubPhase: String | null ("BUSINESS" | "TECHNICAL" | "UX")
└── conversations[]
    └── Conversation (phase: DISCOVERY | PLANNING)
        ├── status: ConversationStatus (ACTIVE | COMPLETED | ABANDONED)
        ├── currentQuestion: Int | null (1-5)
        ├── completedQuestions: Int[] (ex: [1, 2, 3])
        ├── discoveryState: Json (detalhes das respostas)
        └── messages[]
```

---

## 2. Matriz Principal: Estado do Banco → UI Esperada

| project.status | project.businessPlan | conversation.status | conversation.currentQuestion | conversation.completedQuestions | **Chat Exibe** | **Workspace Exibe** | **Progress Bar** | **Quick Replies** |
|----------------|---------------------|---------------------|------------------------------|--------------------------------|----------------|--------------------|-----------------|--------------------|
| IDEATION | null | (não existe) | - | - | Mensagem inicial + Q0 | Card Discovery | 20% "Pergunta 1 de 5" | Q0 (tipos de app) |
| IDEATION | null | ACTIVE | null | [] | Mensagem inicial + Q0 | Card Discovery | 20% "Pergunta 1 de 5" | Q0 |
| IDEATION | null | ACTIVE | 1 | [] | Histórico + aguardando resposta Q1 | Card Discovery | 20% "Pergunta 1 de 5" | Q1 |
| IDEATION | null | ACTIVE | 2 | [1] | Histórico + aguardando resposta Q2 | Card Discovery | 40% "Pergunta 2 de 5" | Q2 |
| IDEATION | null | ACTIVE | 3 | [1,2] | Histórico + aguardando resposta Q3 | Card Discovery | 60% "Pergunta 3 de 5" | Q3 |
| IDEATION | null | ACTIVE | 4 | [1,2,3] | Histórico + aguardando resposta Q4 | Card Discovery | 80% "Pergunta 4 de 5" | Q4 |
| IDEATION | null | ACTIVE | 5 | [1,2,3,4] | Histórico + aguardando resposta Q5 | Card Discovery | 100% "Pergunta 5 de 5" | Q5 |
| IDEATION | null | ACTIVE | 5 | [1,2,3,4,5] | Histórico + aguardando confirmação | Card Discovery | 100% "Pergunta 5 de 5" | **NENHUM** |
| PLANNING | existe | COMPLETED | 5 | [1,2,3,4,5] | "Plano gerado!" | Business Plan + botões | 100% | **NENHUM** |

---

## 2.1 Matriz: Planning Phase (Sub-fases)

| project.status | businessPlan | technicalPlan | uxPlan | planningSubPhase | **Workspace Exibe** | **Sidebar Destaca** | **Botões** |
|----------------|--------------|---------------|--------|------------------|---------------------|---------------------|------------|
| PLANNING | existe | null | null | BUSINESS | Business Plan | "Plano de Negócio" | Pedir Ajustes, Aprovar |
| PLANNING | existe | existe | null | TECHNICAL | Technical Plan | "Plano Técnico" | Ajustar Stack, Aprovar Stack |
| PLANNING | existe | existe | existe | UX | UX Plan | "Plano de UX" | Pedir Ajustes, Aprovar e Continuar |
| CONNECTING | existe | existe | existe | (concluído) | Tela GitHub | "Conexão" | Conectar GitHub |

### Transições de Sub-fase

```
IDEATION (Discovery completo)
    │
    ▼ [businessPlan gerado]
PLANNING/BUSINESS
    │
    ▼ [Aprovar] → gera technicalPlan
PLANNING/TECHNICAL
    │
    ▼ [Aprovar Stack] → gera uxPlan
PLANNING/UX
    │
    ▼ [Aprovar e Continuar]
CONNECTING
```

---

## 3. Regras de Derivação de Estado da UI

### 3.1 Estado do Chat

```typescript
function derivarEstadoChat(project: Project, conversation: Conversation | null): ChatState {
  // REGRA 1: Se tem businessPlan, está em "plano pronto"
  if (project.businessPlan !== null) {
    return {
      fase: 'plano_pronto',
      exibirQuickReplies: false,
      mensagemPrincipal: 'Plano gerado com sucesso!',
      progressPercent: 100
    }
  }

  // REGRA 2: Se não tem conversação, é início
  if (!conversation) {
    return {
      fase: 'inicio',
      exibirQuickReplies: true,
      quickRepliesQuestion: 0,
      mensagemPrincipal: 'Olá! O que você gostaria de criar?',
      progressPercent: 20
    }
  }

  // REGRA 3: Se todas perguntas completadas, aguardando confirmação
  if (conversation.completedQuestions.length >= 5) {
    return {
      fase: 'confirmacao',
      exibirQuickReplies: false,
      mensagemPrincipal: 'Confirma essas informações?',
      progressPercent: 100
    }
  }

  // REGRA 4: Em alguma pergunta do fluxo
  const currentQ = conversation.currentQuestion || 1
  return {
    fase: `pergunta_${currentQ}`,
    exibirQuickReplies: true,
    quickRepliesQuestion: currentQ,
    progressPercent: (currentQ / 5) * 100
  }
}
```

### 3.2 Estado do Workspace

```typescript
function derivarEstadoWorkspace(project: Project): WorkspaceState {
  // REGRA 1: Status IDEATION
  if (project.status === 'IDEATION') {
    return {
      tipo: 'discovery_welcome',
      exibirCard: true,
      exibirDica: true
    }
  }

  // REGRA 2: Status PLANNING - determinar sub-fase
  if (project.status === 'PLANNING') {
    // Sub-fase 1: Business Plan (tem businessPlan, não tem technicalPlan)
    if (project.businessPlan && !project.technicalPlan) {
      return {
        tipo: 'business_plan_view',
        subFase: 'BUSINESS',
        exibirBotoes: true,
        botoes: ['Pedir Ajustes', 'Aprovar e Continuar']
      }
    }

    // Sub-fase 2: Technical Plan (tem technicalPlan, não tem uxPlan)
    if (project.technicalPlan && !project.uxPlan) {
      return {
        tipo: 'technical_plan_view',
        subFase: 'TECHNICAL',
        exibirBotoes: true,
        botoes: ['Ajustar Stack', 'Aprovar Stack']
      }
    }

    // Sub-fase 3: UX Plan (tem todos os planos)
    if (project.uxPlan) {
      return {
        tipo: 'ux_plan_view',
        subFase: 'UX',
        exibirBotoes: true,
        botoes: ['Pedir Ajustes', 'Aprovar e Continuar']
      }
    }
  }

  // REGRA 3: Status CONNECTING
  if (project.status === 'CONNECTING') {
    return {
      tipo: 'github_connect',
      exibirBotoes: true,
      botoes: ['Conectar GitHub']
    }
  }

  // Demais status...
  return derivarPorStatus(project.status)
}
```

### 3.3 Quick Replies

```typescript
function derivarQuickReplies(project: Project, conversation: Conversation | null): string[] {
  // REGRA 1: Nunca mostrar se plano existe
  if (project.businessPlan !== null) {
    return []
  }

  // REGRA 2: Nunca mostrar se todas perguntas completadas
  if (conversation && conversation.completedQuestions.length >= 5) {
    return []
  }

  // REGRA 3: Determinar pergunta atual
  const currentQ = conversation?.currentQuestion || 0
  return QUICK_REPLIES_BY_QUESTION[currentQ] || []
}
```

---

## 4. Invariantes (DEVEM SER SEMPRE VERDADE)

### 4.1 Invariantes de Consistência

| ID | Invariante | Violação Indica |
|----|-----------|-----------------|
| INV-01 | Se `project.businessPlan` existe, então `project.status` NÃO é 'IDEATION' | Bug na transição de estado |
| INV-02 | Se `conversation.status` é 'COMPLETED', então `project.businessPlan` existe | Conversação marcada prematuramente |
| INV-03 | `conversation.currentQuestion` sempre está em `completedQuestions` ou é o próximo | Dessincronização de progresso |
| INV-04 | `completedQuestions` é sempre ordenado e sem duplicatas | Corrupção de estado |
| INV-05 | Chat progress % = (max(completedQuestions) / 5) * 100 | UI dessincronizada |

### 4.2 Invariantes de UI

| ID | Invariante | Componente |
|----|-----------|------------|
| UI-01 | Se `businessPlan` existe → Chat NÃO mostra quick replies | ChatPanel |
| UI-02 | Se `businessPlan` existe → Chat mostra "Plano gerado!" | ChatPanel |
| UI-03 | Se `businessPlan` existe → Workspace mostra plano formatado | WorkspacePanel |
| UI-04 | Progress bar % = estado do banco, NÃO estado local | ChatPanel |
| UI-05 | Quick replies = pergunta atual do banco, NÃO estado local | ChatPanel |

---

## 5. Transições de Estado Permitidas

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│  INÍCIO                                                                     │
│    │                                                                        │
│    ▼                                                                        │
│  ┌─────────┐  user_msg   ┌─────────┐  user_msg   ┌─────────┐               │
│  │   Q0    │ ──────────► │   Q1    │ ──────────► │   Q2    │               │
│  │ (tipos) │             │(problema)│             │(features)│              │
│  └─────────┘             └─────────┘             └─────────┘               │
│                                                       │                     │
│                                                       ▼ user_msg            │
│                          ┌─────────┐             ┌─────────┐               │
│                          │   Q4    │ ◄────────── │   Q3    │               │
│                          │(nice2hav)│  user_msg  │(diferenc)│              │
│                          └─────────┘             └─────────┘               │
│                               │                                             │
│                               ▼ user_msg                                    │
│                          ┌─────────┐                                        │
│                          │   Q5    │                                        │
│                          │(monetiz)│                                        │
│                          └─────────┘                                        │
│                               │                                             │
│                               ▼ user_msg                                    │
│                          ┌─────────────┐                                    │
│                          │ CONFIRMAÇÃO │                                    │
│                          │(sem q.reply)│                                    │
│                          └─────────────┘                                    │
│                               │                                             │
│                               ▼ user_confirma                               │
│                          ┌─────────────┐                                    │
│                          │  GERANDO    │                                    │
│                          │   PLANO     │                                    │
│                          └─────────────┘                                    │
│                               │                                             │
│                               ▼ plano_gerado                                │
│                          ┌─────────────┐                                    │
│                          │PLANO PRONTO │                                    │
│                          │(sem q.reply)│                                    │
│                          └─────────────┘                                    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Transições Proibidas

| De | Para | Motivo |
|----|------|--------|
| Q3 | Q1 | Não pode voltar automaticamente |
| CONFIRMAÇÃO | Q1 | Não pode reiniciar sem ação explícita |
| PLANO PRONTO | Q1 | Plano já gerado, precisa criar novo projeto |

---

## 6. Checklist de Implementação

### Ao carregar a página do projeto:

- [ ] Buscar `project` com `businessPlan` e `status`
- [ ] Buscar `conversation` com `currentQuestion`, `completedQuestions`, `messages`
- [ ] Derivar estado do Chat usando regras acima
- [ ] Derivar estado do Workspace usando regras acima
- [ ] NÃO usar estado local para `questionProgress` - derivar do banco
- [ ] NÃO inicializar chat em "pergunta 1" - verificar banco primeiro

### Ao receber resposta da API:

- [ ] Atualizar estado local com dados retornados pela API
- [ ] API deve retornar `questionProgress` no evento SSE
- [ ] UI atualiza progress bar baseado no evento
- [ ] Quick replies atualizam baseado no evento

### Ao reabrir página:

- [ ] Restaurar TODAS as mensagens do histórico
- [ ] Restaurar progresso do banco
- [ ] Restaurar quick replies corretos
- [ ] NÃO mostrar pergunta 1 se já passou dela

---

## 7. Casos de Teste Derivados

| Caso | Estado Inicial | Ação | Estado Final Esperado |
|------|---------------|------|----------------------|
| TC-01 | Projeto novo | Abrir página | Chat Q0, Workspace Discovery |
| TC-02 | currentQuestion=3, completed=[1,2] | Abrir página | Chat Q3, progress 60% |
| TC-03 | businessPlan existe | Abrir página | Chat "Plano pronto", sem quick replies |
| TC-04 | completed=[1,2,3,4,5] | Abrir página | Chat confirmação, sem quick replies |
| TC-05 | Chat Q2 | Responder | Chat Q3, progress 60%, quick replies Q3 |
| TC-06 | Chat confirmação | Confirmar | Overlay loading → Plano pronto |
