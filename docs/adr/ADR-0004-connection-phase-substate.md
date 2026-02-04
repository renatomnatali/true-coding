# ADR-0004 — Connection Phase: sub-estados derivados de campos do banco

**Status:** Aceito
**Data:** 2026-02
**Referências no código:** `src/components/project/phases/ConnectionPhase.tsx`, `src/app/api/projects/[id]/connect/route.ts`
**PR:** #26

---

## Contexto

A fase Connection guia o usuário pela integração GitHub + Vercel. Há três estados visuais distintos:

1. OAuth não feito ainda → mostrar CTA de login GitHub
2. Repo criado, Vercel não conectado → mostrar info do repo + botão Vercel
3. Tudo conectado → mostrar pipeline de deploy

Precisamos de uma forma de derivar qual tela mostrar sem manter um enum de estado paralelo no cliente.

## Alternativas Consideradas

| Opção | Pros | Contras |
|-------|------|---------|
| Enum `ConnectionStatus` no banco | Explícito | Sincronização manual entre campos e enum; migração extra |
| State machine no cliente | Clara transição | Duplica lógica; dessincroniza com banco |
| **Derivar de campos existentes** | Sem estado extra; fonte de verdade única | Lógica de derivação deve estar clara |

## Decisão

Os sub-estados são derivados diretamente de dois campos no modelo `Project`:

```
githubRepoUrl === null                              → "github"        (tela 01)
githubRepoUrl !== null && productionUrl === null    → "repo-created"  (tela 02)
productionUrl !== null                              → "connected"     (tela 03)
```

Estado de erro (`hasOAuthError`) é derivado do URL param `?error=github_auth_failed` após callback OAuth.

## Consequências

- **Positivas:** Zero estado paralelo; restauração de página é automática; sem migração de schema.
- **Negativas:** A lógica de derivação deve ser documentada (aqui) para evitar que um dev adicione um campo intermediário que quebra a derivação.
- **Guarda de idempotência:** `connectGitHub` retorna dados do repo já existente se `githubRepoUrl` já estiver preenchido — evita criação dupla em race condition.
