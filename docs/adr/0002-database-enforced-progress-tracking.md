# 0002. Database-Enforced Progress Tracking

**Status:** Aceito

**Data:** 2026-01-27

**Decisores:** Engineering Team

**Tags:** `#architecture` `#database` `#discovery`

---

## Contexto

Para implementar o Discovery estruturado com 5 perguntas ([ADR-0001](./0001-discovery-flow-estruturado.md)), precisamos decidir **como rastrear o progresso** do usuário.

**Requisitos:**
- Saber em qual pergunta usuário está (1-5)
- Persistir respostas para reconstruir conversa
- Validar que todas as perguntas foram respondidas antes de gerar plano
- Permitir usuário sair e voltar sem perder progresso
- Dados para analytics (onde usuários abandonam)

**Restrições:**
- Já usamos Prisma + PostgreSQL
- Conversa existe como array de mensagens no Conversation model
- Precisa funcionar com SSE (streaming)

## Decisão

Decidimos **armazenar estado do discovery no banco de dados** usando campos dedicados no modelo `Conversation`, em vez de confiar apenas em marcadores HTML ou inferir do histórico de mensagens.

### Schema Changes:

```prisma
model Conversation {
  // ... campos existentes

  // NOVOS CAMPOS:
  discoveryState     Json?  @db.JsonB  // Estado estruturado completo
  currentQuestion    Int?   @default(1) // Pergunta atual (1-5)
  completedQuestions Int[]  @default([]) // Perguntas já respondidas
}
```

### Estrutura do `discoveryState`:

```json
{
  "questions": {
    "1": {
      "asked": true,
      "answered": true,
      "userResponse": "App de gestão de tarefas",
      "extractedData": {
        "problem": "Organizar tarefas de times remotos",
        "audience": "Times pequenos de 5-15 pessoas"
      },
      "timestamp": "2026-01-27T10:30:00Z"
    },
    "2": { ... }
  },
  "metadata": {
    "startedAt": "2026-01-27T10:25:00Z",
    "lastActivity": "2026-01-27T10:32:00Z",
    "totalTimeSeconds": 420
  }
}
```

### Fluxo de Execução:

1. Frontend envia mensagem → `/api/chat`
2. Backend lê `Conversation.currentQuestion` do banco
3. Valida que resposta corresponde à pergunta atual
4. Extrai dados estruturados da resposta (via AI)
5. Atualiza `discoveryState.questions[N]`
6. Adiciona N ao `completedQuestions[]`
7. Incrementa `currentQuestion` (se N < 5)
8. Se `currentQuestion > 5` → gera BusinessPlan
9. Retorna próxima pergunta via SSE

## Consequências

### Positivas

- ✅ **100% confiável** - Não depende de AI incluir marcadores corretamente
- ✅ **Reconstrução perfeita** - Usuário recarrega página, volta exatamente onde parou
- ✅ **Validação forte** - Impossível pular perguntas ou inverter ordem
- ✅ **Analytics precisos** - Saber exatamente onde usuários abandonam
- ✅ **Debugging fácil** - Banco mostra estado exato da conversa
- ✅ **Retry inteligente** - Se geração falha, retry com contexto completo
- ✅ **Versionamento natural** - `discoveryState` já estruturado para tracking
- ✅ **Base para features futuras** - Templates, branching, AI suggestions

### Negativas

- ⚠️ **Migration necessária** - 1 migration (simples, ~5 min)
- ⚠️ **+150 linhas de código** - Lógica de validação e state management
- ⚠️ **+2-3 dias desenvolvimento** - Mas economiza semanas de debugging
- ⚠️ **Acoplamento maior** - UI depende do backend para controle de fluxo
- ⚠️ **JSONB queries** - Mais complexo que campos simples (mas PostgreSQL lida bem)

### Riscos

- 🔴 **Migração quebra conversas existentes** - Mitigação: Default null, preencher gradualmente
- 🟡 **JSONB fica grande** - Mitigação: Limite de 5 perguntas, dados estruturados pequenos
- 🟡 **Concorrência** - Mitigação: Optimistic locking com `updatedAt`

## Alternativas Consideradas

### Opção A: Prompt-Only (AI controla tudo)

**Descrição:** AI decide quando perguntar cada questão, sem tracking no banco.

**Prós:**
- Zero mudanças no schema
- Implementação rápida (~1 dia)
- Flexível (AI pode adaptar)

**Contras:**
- Não confiável (AI pode errar)
- Sem dados para analytics
- Impossível reconstruir progresso ao recarregar
- Difícil debugar problemas

**Por que rejeitada:**
Fundação fraca. Economiza 2 dias agora, mas custará semanas depois.

### Opção B: Híbrida (Prompt + Marcadores HTML)

**Descrição:** AI inclui `<!--Q:N-->` nas respostas, backend extrai e valida.

**Prós:**
- Sem migration
- Implementação média (~2 dias)
- Melhor que prompt-only

**Contras:**
- Confiabilidade ~85% (AI pode esquecer marcador)
- Analytics imprecisos
- Reconstrução estimada (não exata)
- Debugging médio

**Por que rejeitada:**
Meio-termo que não resolve problemas fundamentais. Se vamos investir, que seja na solução robusta.

### Opção C: Client-Side State (React/Zustand)

**Descrição:** Armazenar progresso no frontend (localStorage/Zustand).

**Prós:**
- Sem mudanças no backend
- Rápido de implementar
- Estado reativo

**Contras:**
- Perde estado ao trocar de dispositivo
- Dificulta analytics (precisa enviar eventos)
- Sem fonte única de verdade
- Problemas de sincronização

**Por que rejeitada:**
Estado crítico do sistema não pode viver apenas no cliente.

## Implementação

### Fase 1: Migration (30 min)

```sql
-- Add discovery tracking fields
ALTER TABLE "Conversation"
  ADD COLUMN "discoveryState" JSONB,
  ADD COLUMN "currentQuestion" INTEGER DEFAULT 1,
  ADD COLUMN "completedQuestions" INTEGER[] DEFAULT '{}';

-- Index para queries eficientes
CREATE INDEX idx_conversation_current_question
  ON "Conversation" ("currentQuestion")
  WHERE "currentQuestion" IS NOT NULL;
```

### Fase 2: Types (30 min)

```typescript
// src/types/discovery.ts
export interface DiscoveryState {
  questions: Record<string, QuestionData>;
  metadata: DiscoveryMetadata;
}

export interface QuestionData {
  asked: boolean;
  answered: boolean;
  userResponse: string;
  extractedData: Record<string, any>;
  timestamp: string;
}
```

### Fase 3: Backend Logic (4 horas)

```typescript
// src/app/api/chat/route.ts

// 1. Load current state
const conversation = await prisma.conversation.findUnique({
  where: { id },
  select: { currentQuestion, completedQuestions, discoveryState }
});

// 2. Validate response
if (!completedQuestions.includes(conversation.currentQuestion)) {
  // Process answer for current question
  const extracted = await extractDataFromResponse(userMessage);

  // 3. Update state
  await prisma.conversation.update({
    where: { id },
    data: {
      discoveryState: {
        ...discoveryState,
        questions: {
          ...discoveryState.questions,
          [currentQuestion]: {
            asked: true,
            answered: true,
            userResponse: userMessage,
            extractedData: extracted,
            timestamp: new Date().toISOString()
          }
        }
      },
      completedQuestions: [...completedQuestions, currentQuestion],
      currentQuestion: currentQuestion + 1
    }
  });
}

// 4. Check if ready to generate plan
if (currentQuestion > 5) {
  generateBusinessPlan(discoveryState);
}
```

## Métricas de Sucesso

**Confiabilidade:**
- Taxa de reconstrução correta: **>99%**
- Taxa de validação bem-sucedida: **>95%**

**Performance:**
- Query JSONB: **<50ms** (p95)
- Update state: **<100ms** (p95)

**Analytics:**
- Taxa de abandono por pergunta: **rastreável**
- Tempo médio por pergunta: **rastreável**
- Padrões de resposta: **analisáveis**

## Referências

- [ADR-0001: Discovery Flow Estruturado](./0001-discovery-flow-estruturado.md)
- [PostgreSQL JSONB Performance](https://www.postgresql.org/docs/current/datatype-json.html)
- [Prisma JSONB Support](https://www.prisma.io/docs/concepts/components/prisma-client/working-with-json)

## Notas

- JSONB em PostgreSQL é muito eficiente para este caso de uso
- Índices GIN podem ser adicionados depois se queries JSONB ficarem lentas
- Estrutura permite fácil adição de features (branching, skipping, etc)

---

**Histórico de Mudanças:**

- 2026-01-27: Criado (Status: Proposto)
- 2026-01-27: Aceito após análise de trade-offs
