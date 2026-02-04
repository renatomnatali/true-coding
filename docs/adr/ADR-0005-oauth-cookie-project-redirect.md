# ADR-0005 — OAuth GitHub: cookie para redirect de volta ao projeto

**Status:** Aceito
**Data:** 2026-02
**Referências no código:** `src/app/api/auth/github/route.ts`, `src/app/api/auth/github/callback/route.ts`
**PR:** #26

---

## Contexto

O fluxo OAuth do GitHub redireciona o usuário para `github.com/login/oauth/authorize` e depois para um callback neste servidor. O callback original sempre redirecionava para `/dashboard?github=connected`. Com a introdução da fase Connection por projeto, precisamos voltar para `/project/[id]?github=connected` — ou seja, manter o contexto do projeto durante o redirect externo.

## Alternativas Consideradas

| Opção | Pros | Contras |
|-------|------|---------|
| Query param no `state` OAuth | Um campo só | `state` já usado pra CSRF; misturar dados aumenta risco |
| localStorage no cliente | Sem servidor | Não disponível durante redirect externo |
| Session server-side | Funciona | Adiciona complexidade de sessão |
| **Cookie httpOnly com projectId** | Simple, seguro, scoped | TTL curto (10min) — se OAuth demorar mais, perde |

## Decisão

Antes de redirecionar para o GitHub:

1. `GET /api/auth/github?projectId=<id>` salva um cookie `github_oauth_project_id` (httpOnly, secure, sameSite lax, TTL 10 min)
2. O callback lê esse cookie, constrói o redirect para `/project/[id]?github=connected`
3. Cookie é deletado em todos os exit paths do callback (sucesso, erro, catch)

Se o cookie não existe no callback (TTL expirou ou primeiro uso sem projeto), o comportamento original (`/dashboard`) é mantido como fallback.

## Consequências

- **Positivas:** Sem mudança no fluxo OAuth do GitHub; sem estado no cliente; cookie deletado após uso (não acumula).
- **Negativas:** Se o usuário demorar mais que 10 min no flow OAuth, volta para o dashboard ao invés do projeto. Aceito — OAuth raramente leva mais que 1 min.
- **Nota:** `GET` do route handler recebe `request: Request` (não opcional) — Next.js rejeita primeiro argumento opcional em exports de route.
