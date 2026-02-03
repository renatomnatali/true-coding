# Regras de Comportamento - Discovery Phase

> Este documento define as regras de comportamento que DEVEM ser seguidas.
> Para cenários detalhados, veja: `docs/specifications/discovery.feature`
> Para matriz de estados, veja: `docs/ux/STATES.md`

---

## 1. Regras Fundamentais

### R1: Estado do Banco é a Fonte da Verdade

```
❌ ERRADO: ChatPanel inicializa questionProgress = null
✅ CERTO:  ChatPanel deriva questionProgress do conversation.currentQuestion
```

### R2: UI Deve Refletir Estado Persistido

```
❌ ERRADO: Manter estado local que pode divergir do banco
✅ CERTO:  Sempre sincronizar UI com dados do servidor
```

### R3: Transições São Unidirecionais

```
❌ ERRADO: Permitir voltar de Q5 para Q1 automaticamente
✅ CERTO:  Progresso só avança, correções são via chat
```

---

## 2. Regras por Componente

### ChatPanel

| Regra | Condição | Comportamento |
|-------|----------|---------------|
| CP-01 | `project.businessPlan` existe | NÃO mostrar quick replies |
| CP-02 | `project.businessPlan` existe | Mostrar "Plano gerado com sucesso!" |
| CP-03 | `conversation.completedQuestions.length >= 5` | NÃO mostrar quick replies |
| CP-04 | `conversation.completedQuestions.length >= 5` | Mostrar resumo + confirmação |
| CP-05 | Ao carregar | Buscar mensagens do banco, NÃO iniciar vazio |
| CP-06 | Ao carregar | Progress = banco, NÃO default 20% |

### WorkspacePanel

| Regra | Condição | Comportamento |
|-------|----------|---------------|
| WP-01 | `status === 'IDEATION' && !businessPlan` | Mostrar card Discovery |
| WP-02 | `status === 'PLANNING' && businessPlan` | Mostrar Business Plan formatado |
| WP-03 | `status === 'PLANNING'` | Mostrar botões "Pedir Ajustes" e "Aprovar" |
| WP-04 | "Aprovar e Continuar" clicado | Mudar status para CONNECTING |

### Sidebar

| Regra | Condição | Comportamento |
|-------|----------|---------------|
| SB-01 | Sempre | Refletir `project.status` atual |
| SB-02 | Status muda | Atualizar fase destacada |
| SB-03 | Journey dots | Refletir progresso real |

---

## 3. Regras de Quick Replies

### Quando Mostrar

```typescript
const deveExibirQuickReplies =
  project.businessPlan === null &&
  conversation.completedQuestions.length < 5;
```

### Qual Conjunto Mostrar

```typescript
const questionNumber = conversation?.currentQuestion || 0;
const quickReplies = QUICK_REPLIES_BY_QUESTION[questionNumber];
```

### Mapeamento

| Situação | Quick Replies |
|----------|--------------|
| Projeto novo (sem conversa) | Q0: tipos de app |
| currentQuestion = 1 | Q1: público-alvo |
| currentQuestion = 2 | Q2: features |
| currentQuestion = 3 | Q3: diferenciais |
| currentQuestion = 4 | Q4: nice-to-have |
| currentQuestion = 5, completed < 5 | Q5: monetização |
| completed = [1,2,3,4,5] | NENHUM |
| businessPlan existe | NENHUM |

---

## 4. Regras de Progress Bar

### Cálculo

```typescript
const progressPercent =
  project.businessPlan !== null
    ? 100
    : Math.max(20, (conversation.currentQuestion / 5) * 100);
```

### Texto

```typescript
const progressText =
  `Pergunta ${conversation.currentQuestion || 1} de 5`;
```

---

## 5. Regras de Restauração de Estado

### Ao Abrir Página do Projeto

1. **Buscar dados do servidor:**
   ```typescript
   const project = await getProject(id); // inclui businessPlan, status
   const conversation = await getConversation(projectId, 'DISCOVERY');
   ```

2. **Derivar estado inicial:**
   ```typescript
   const chatState = derivarEstadoChat(project, conversation);
   const workspaceState = derivarEstadoWorkspace(project);
   ```

3. **Renderizar com estado derivado:**
   - NÃO usar valores default
   - NÃO assumir que é projeto novo
   - NÃO inicializar em pergunta 1

### Checklist de Restauração

- [ ] Mensagens anteriores são carregadas do banco
- [ ] Progress bar reflete `currentQuestion` do banco
- [ ] Quick replies refletem pergunta atual do banco
- [ ] Se `businessPlan` existe, chat mostra estado "plano pronto"
- [ ] Se `completedQuestions.length >= 5`, não mostra quick replies

---

## 6. Regras de Transição de Fase

### Discovery → Planning

**Trigger:** Usuário confirma após Q5

**Pré-condições:**
- `completedQuestions` = [1, 2, 3, 4, 5]
- Usuário enviou confirmação ("sim", "confirmo", etc.)

**Ações:**
1. IA gera Business Plan JSON
2. Salvar `businessPlan` no projeto
3. Mudar `project.status` para PLANNING
4. Marcar `conversation.status` como COMPLETED

**Pós-condições:**
- Workspace mostra Business Plan
- Chat mostra "Plano gerado!"
- Quick replies desaparecem

### Planning → Connecting

**Trigger:** Usuário clica "Aprovar e Continuar"

**Pré-condições:**
- `project.businessPlan` existe
- `project.status` é PLANNING

**Ações:**
1. Chamar API PATCH `/api/projects/{id}` com `status: 'CONNECTING'`
2. Atualizar estado local

**Pós-condições:**
- Workspace mostra tela de conexão GitHub
- Sidebar destaca fase "Conexão"

---

## 7. Validação de Implementação

### Perguntas para Code Review

1. O componente está lendo estado do banco ou usando default?
2. Se o usuário reabrir a página, o estado será restaurado?
3. Quick replies podem aparecer quando não deveriam?
4. Progress bar pode mostrar valor diferente do banco?

### Testes Obrigatórios

```gherkin
# Cada PR que modifica Discovery DEVE passar:

Cenário: Restauração de estado ao reabrir projeto
Cenário: Quick replies corretos para cada pergunta
Cenário: Progress bar reflete estado real
Cenário: Plano gerado não mostra quick replies
```
