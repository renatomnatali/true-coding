# ADR-0003 — Quick Replies com estrutura short/long como ponte para geração dinâmica

**Status:** Aceito
**Data:** 2026-02
**Referências no código:** `src/types/index.ts` (QuickReply, QUICK_REPLIES_BY_QUESTION), `src/components/project/ChatPanel.tsx`
**Backlog fase 2:** issue #28

---

## Contexto

Os botões de "Respostas Rápidas" no Discovery permitiam o usuário responder sem digitar. Na versão original os textos eram strings únicas (`string[]`) com emojis e sem contexto — ex: `'🎯 Mais focado'`. Isso causava dois problemas:

1. **Ambiguidade:** A IA não conseguia mapear a resposta à pergunta atual e re-perguntava, dessincronizando o progresso (ADR-0002).
2. **Auto-envio:** Click no botão enviava diretamente, sem o usuário revisar. Sem chance de editar ou contextualizar.

Tentativa anterior (PR #27) foi resolver via rollback keyword-based no backend quando a IA re-perguntava. A solução foi frágil (dependia de keyword pairs por pergunta, diacríticos, markdown bold) e causou múltiplos bloqueios no Code-Reviewer e falhas de build.

## Decisão

Estruturar as quick replies como `{ short: string; long: string }`:

- **`short`** — 2-4 palavras que aparecem no botão (ex: `"Pequenas empresas"`)
- **`long`** — frase completa e contextual que vai ao input (ex: `"O problema afeta pequenas empresas que precisam organizar seus processos"`)

Comportamento do click: **preenche o input** com `long`, não envia. O usuário revisa, edita se quiser, e clica Enviar.

## Por que não resolver no backend (rollback)?

O rollback keyword-based (PR #27, fechado) tentava detectar se a IA re-perguntava e desfazer o avanço especulativo. Problemas:
- Dependência de keyword pairs por pergunta — frágil contra rephrasing da IA
- Diacríticos e bold markdown exigiam normalização NFD + strip
- Next.js rejeita exports não-HTTP em route handlers — a função `claudeReAsked` não podia viver no route file
- Não resolveu a ambiguidade na origem

A estrutura `{ short, long }` resolve **na fonte**: o texto enviado é sempre claro e completo, sem precisar de rollback.

## Fase 2 (backlog — issue #28)

A estrutura `{ short, long }` foi escolhida conscientemente como interface estável. Na fase 2, a fonte das sugestões será substituída pela própria API Claude (geração dinâmica via SSE `event: suggestions` no mesmo stream da resposta). O componente ChatPanel não muda — só a fonte dos dados.

## Consequências

- **Positivas:** Elimina ambiguidade na origem; usuário mantém controle; estrutura prepara para fase 2 sem mudança no UI.
- **Negativas:** Textos ainda são estáticos e iguais para todos os usuários. Aceito pra o MVP — fase 2 resolve.
- **Rollback do PR #27:** branch `fix/discovery-question-repeat` foi fechada. O código de rollback keyword-based não foi mergado.
