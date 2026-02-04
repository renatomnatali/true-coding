# ADR-0002 — Rastreamento de Progresso do Discovery no modelo Conversation

**Status:** Aceito
**Data:** 2026-01
**Referências no código:** `prisma/schema.prisma` (model Conversation), `src/app/api/chat/route.ts`

---

## Contexto

Com o fluxo estruturado do ADR-0001, precisamos rastrear em qual pergunta o usuário está e quais já foram completadas. Isso permite: (a) mostrar barra de progresso no UI, (b) restaurar estado quando o usuário recarrega a página, (c) validar que todas as 5 perguntas foram respondidas antes de gerar o BusinessPlan.

## Alternativas Consideradas

| Opção | Pros | Contras |
|-------|------|---------|
| Derivar do histórico de mensagens | Sem campo extra no banco | Lento, frágil, exige parse das mensagens |
| Estado no cliente (localStorage) | Rápido | Perde ao limpar cache; não sincroniza entre dispositivos |
| **Campos no modelo Conversation** | Persistente, consistente, restaurável | Avanço especulativo pode dessincronizar (tratado no ADR-0003) |

## Decisão

Adicionar dois campos ao modelo `Conversation`:

```prisma
currentQuestion    Int   @default(1)
completedQuestions Int[] @default([])
```

O backend avança `currentQuestion` **especulativamente** quando o usuário envia uma resposta, antes de aguardar a resposta da IA. Isso garante que a barra de progresso atualiza sem espera.

## Consequências

- **Positivas:** Restauração de estado perfeita; UI reativo (sem delay na barra de progresso); fonte de verdade única.
- **Negativas:** Avanço especulativo pode ficar fora de sync se a IA re-perguntar. Tratado via rollback — ver ADR-0003.
