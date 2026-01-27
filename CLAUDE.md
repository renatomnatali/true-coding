# CLAUDE.md

Instrucoes para o Claude Code neste projeto.

---

## ⚠️ WORKFLOW OBRIGATÓRIO - LEIA ANTES DE COMMITAR

**NUNCA commite direto na `main`. SEMPRE siga este fluxo:**

```bash
# 1. Crie feature branch
git checkout -b feat/sua-feature

# 2. Faça commits na branch
git commit -m "feat: sua mudança"

# 3. Crie PR
gh pr create --title "..." --body "..."

# 4. Rode Code-Reviewer em BACKGROUND
# (Use Task tool com subagent_type: general-purpose)

# 5. AGUARDE resultado do review (OBRIGATÓRIO!)

# 6. Corrija TODOS os blockers encontrados

# 7. Merge somente após aprovação
gh pr merge --squash
```

**Proteção técnica**: Git hook bloqueará commits diretos na `main` automaticamente.

**Detalhes**: Ver `docs/WORKFLOW-ENFORCEMENT.md` para enforcement completo.

---

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

## Fluxo de PR (OBRIGATORIO)

1. Criar branch e fazer commits
2. Criar PR via `gh pr create`
3. **Rodar Code-Reviewer em background**
4. **AGUARDAR o resultado do review antes de prosseguir**
5. Se houver **blockers**: corrigir ANTES de fazer merge
6. Somente apos blockers resolvidos: `gh pr merge --squash`

**IMPORTANTE**: NUNCA fazer merge de PR enquanto o Code-Reviewer estiver rodando ou tiver retornado blockers nao resolvidos. O resultado do review DEVE ser aguardado e considerado.

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
