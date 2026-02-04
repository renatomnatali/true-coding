# ADR-0001 — Structured Discovery Flow com 5 Perguntas

**Status:** Aceito
**Data:** 2026-01
**Referências no código:** `src/config/features.ts`, `prisma/schema.prisma` (Conversation), `src/types/index.ts`

---

## Contexto

A fase inicial do produto permite que o usuário descreva sua ideia para a IA. Na versão original (V1) isso era uma conversa livre — sem estrutura, sem validação de completude. Usuários chegavam ao fim da fase sem ter fornecido informações suficientes para gerar um Business Plan útil.

## Decisão

Implementar um fluxo estruturado com **5 perguntas obrigatórias sequenciais**, cada uma focada em um aspecto critical do produto:

| # | Pergunta | Objetivo |
|---|----------|----------|
| 1 | Qual problema você quer resolver e para quem? | Problema + público-alvo |
| 2 | Quais são as 3-5 funcionalidades principais (must-have)? | Scope do MVP |
| 3 | O que vai diferenciar seu projeto dos concorrentes? | Proposição de valor |
| 4 | Quais features seriam nice-to-have para o futuro? | Roadmap pós-MVP |
| 5 | Como pretende monetizar o projeto? | Modelo de negócio |

A IA faz **uma pergunta por mensagem** e aguarda a resposta antes de avançar. Controle via feature flag `STRUCTURED_DISCOVERY` permite rollback instantâneo para a conversa livre.

## Consequências

- **Positivas:** Dados estruturados garantem BusinessPlan completo; progresso rastreável via barra de progresso; experiência mais guidada.
- **Negativas:** Menos flexibilidade para o usuário; se a IA re-perguntar uma pergunta já respondida, o progresso pode dessincronizar (ver ADR-0003).
- **Campos no banco:** `Conversation.currentQuestion` e `Conversation.completedQuestions[]` rastreiam estado (ver ADR-0002).
