# CLAUDE.md

Instrucoes para o Claude Code neste projeto.

## Projeto

**True Coding** - Plataforma SaaS para criar aplicacoes web profissionais a partir de linguagem natural.

Stack: Next.js 15, React 19, TypeScript, Tailwind, Prisma, Clerk, Claude API.

## Comandos

```bash
npm run dev       # Servidor de desenvolvimento
npm run build     # Build de producao
npm run lint      # Verifica estilo de codigo
npm test          # Roda testes (vitest)
npm run test:watch  # Testes em modo watch
npm run db:generate # Gera Prisma Client
npm run db:push   # Push schema para banco
npm run db:migrate  # Cria migration
npm run db:studio # Abre Prisma Studio
```

## Workflow

1. **Sempre rode `npm test` e `npm run lint` antes de commits**
2. Use convencao de commits: `tipo(escopo): descricao`
3. PRs pequenos (< 400 linhas)
4. Branches curtas (max 2 dias)

Leia `docs/trunk-based-development.md` para detalhes completos.

## Agentes

- `@Code-Reviewer` - Review de PRs seguindo TBD
- `@Coder-TypeScript` - Desenvolvimento de codigo TypeScript

## Estrutura

```
src/
├── app/           # Next.js App Router (paginas, API routes)
├── components/    # Componentes React
│   └── ui/        # shadcn/ui components
├── lib/           # Servicos e utilitarios
│   ├── ai/        # Cliente Claude
│   ├── db/        # Prisma client
│   ├── github/    # Cliente GitHub
│   └── vercel/    # Cliente Vercel
├── hooks/         # Custom hooks
├── stores/        # Zustand stores
├── types/         # TypeScript types
└── test/          # Test setup
prisma/            # Schema e migrations
templates/         # Templates de codigo gerado
tests/             # Testes E2E
docs/              # Documentacao
.github/           # CI/CD workflows
.claude/           # Configuracao Claude Code
```

## Variaveis de Ambiente

Copie `.env.example` para `.env.local` e preencha os valores.

## Specs do Projeto

Leia a pasta `/Spec` para entender a especificacao completa:
- `00-OVERVIEW.md` - Visao geral do projeto
- `01-ARCHITECTURE.md` - Arquitetura tecnica
- `02-DATA-MODEL.md` - Modelo de dados (Prisma)
- `03-API-SPECIFICATION.md` - Endpoints da API
- `04-AI-PROMPTS.md` - Prompts para Claude
- `05-INTEGRATIONS.md` - GitHub, Vercel, Clerk
- `06-IMPLEMENTATION.md` - Plano de implementacao
