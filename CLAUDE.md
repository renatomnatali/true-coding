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

### Regras obrigatorias (aprendidas na prática)

**Regra 1 — Gherkin é a fonte de verdade para comportamento.**
Antes de implementar ou alterar qualquer comportamento, ler o `.feature` correspondente em `docs/specifications/`. Se o codigo diverge do Gherkin, o Gherkin define o que está correto. Se o Gherkin está outdated, atualizar o Gherkin PRIMEIRO, depois o codigo. Exemplo do que não fazer: remover emojis das quick replies sem verificar que `discovery.feature` os exigia.

**Regra 2 — Não trocar de branch no meio de uma tarefa.**
Se um PR externo precisa de atencao (review pendente, CI falhou), anotar e voltar depois. Nunca fazer stash → checkout outra branch → trabalho → push → voltar. Isso multiplica contexto e gasta creditos sem valor.

**Regra 3 — Sugestoes do Code-Reviewer são para avaliar, não aplicar cegamente.**
Quando o reviewer diz "suggestion", avaliar contra: (a) o que o Gherkin diz, (b) a intent do usuario. Se houver conflito, o usuario decide. Nunca aplicar sugestao que muda comportamento sem validar contra as specs.

**Regra 4 — Testes devem cobrir as assertions do Gherkin.**
Se o Gherkin diz que o botao mostra `📱 App de gestão`, deve existir um teste que verifica `screen.getByText('📱 App de gestão')`. Testes que verificam apenas "nao crashou" nao protegem contra regressoes de comportamento. Antes de mergear um PR, cruzar-referenciar as assertions dos testes com os cenarios do `.feature` relevante.

**Regra 5 — Uma tarefa por vez.**
Nao abrir PR B enquanto PR A nao esta mergado, a menos que sejam verdadeiramente independentes. Isso reduz branches ativos e evita merge conflicts e confusao de contexto.

**Regra 6 — Todo texto visível ao utilizador deve estar em português brasileiro com acentuação correta.**
Nunca gerar texto em português sem acentos (ex: "Nao" em vez de "Não", "voce" em vez de "você"). Isso inclui: conteúdo HTML, strings de UI, mensagens de chat, labels, placeholders, títulos e botões. Nomes de arquivos, classes CSS, variáveis JS e URLs podem permanecer sem acentos (ASCII-safe).

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
