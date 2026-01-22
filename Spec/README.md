# True Coding - Especificação Técnica

> "Esqueça o Vibe Coding, use o True Coding"

## Documentos

| # | Documento | Descrição |
|---|-----------|-----------|
| 00 | [OVERVIEW](./00-OVERVIEW.md) | Visão geral do projeto, problema, solução, MVP |
| 01 | [ARCHITECTURE](./01-ARCHITECTURE.md) | Arquitetura técnica, stack, estrutura de pastas |
| 02 | [DATA-MODEL](./02-DATA-MODEL.md) | Schema Prisma, tipos TypeScript, migrations |
| 03 | [API-SPECIFICATION](./03-API-SPECIFICATION.md) | Endpoints, contratos, erros, rate limiting |
| 04 | [AI-PROMPTS](./04-AI-PROMPTS.md) | System prompts para discovery, planning, codegen |
| 05 | [INTEGRATIONS](./05-INTEGRATIONS.md) | Claude, GitHub, Vercel, Clerk, Neon, Redis |
| 06 | [IMPLEMENTATION](./06-IMPLEMENTATION.md) | Fases, tarefas, critérios de aceite |
| 07 | [TEMPLATES](./07-TEMPLATES.md) | Templates de código, Handlebars, geração |

## Quick Start para Devs

### 1. Entenda o Projeto
- Leia [00-OVERVIEW](./00-OVERVIEW.md) para contexto
- Veja [01-ARCHITECTURE](./01-ARCHITECTURE.md) para stack e estrutura

### 2. Configure o Ambiente
- Siga Fase 0 em [06-IMPLEMENTATION](./06-IMPLEMENTATION.md)

### 3. Implemente
- Siga as fases em ordem
- Cada tarefa tem responsável, duração e critérios

## Resumo do MVP

**Objetivo**: Usuário descreve ideia → IA refina → Código gerado → Deploy automático

**Stack**:
- Next.js 15 + React 19 + TypeScript
- Tailwind + shadcn/ui
- Prisma + PostgreSQL (Neon)
- Clerk (auth)
- Claude API (IA)
- GitHub API (código)
- Vercel API (deploy)

**Timeline**: 8-9 semanas

**Custo**: ~$70-240/mês

## Decisões Técnicas

| Decisão | Escolha | Alternativa Descartada | Motivo |
|---------|---------|------------------------|--------|
| Framework | Next.js 15 | Remix, SvelteKit | Ecossistema, Vercel integration |
| IA | Claude | GPT-4 | Melhor para código, streaming |
| Auth | Clerk | NextAuth | OAuth pronto, menos código |
| DB | Neon | Supabase, PlanetScale | Serverless PostgreSQL, branching |
| State | Zustand | Redux, Jotai | Simples, sem boilerplate |

## Contato

Dúvidas sobre a spec? Abra uma issue ou entre em contato com o PM.
