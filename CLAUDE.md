# CLAUDE.md

Instrucoes para o Claude Code neste projeto.

## Projeto

**True Coding** - Plataforma SaaS para criar aplicacoes web profissionais a partir de linguagem natural.

Stack: Next.js 15, React 19, TypeScript, Tailwind, Prisma, Clerk, Claude API.

## Papéis e camadas

Quatro papéis distintos que o Claude Code deve manter separados ao raciocinar sobre este projeto:

1. **Renato** é quem gerencia TC.
2. **Notion + Claude Code** são ferramentas que Renato usa pra exercer essa gestão.
3. **TC** é o produto em construção — não gerencia nada, nem a si mesmo.
4. **Usuário-final** (ex.: Maria/Cafeteria Beta, no mockup `/Spec`) vai usar TC pra gerenciar o próprio produto.

Conteúdo no Notion (ADRs, Risks, Policies, Playbooks) é autoria de Renato sobre como TC deve operar — não é TC se documentando. **Policies são invariantes, não sugestões**: antes de desenhar UI de captura (Risk/Decision/Discovery), consultar as Policies relevantes.

Para detalhe: memórias `project_four_layer_model.md` e `project_current_state.md`, e página Notion True Coding (ver `notion_truecoding.md` pra IDs dos databases).

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

**Regra 1 — Ordem canônica de especificação: Story → Jornada → Gherkin.**
Ao especificar comportamento do sistema, seguir esta ordem:

1. **User Story** — objetivo (o quê, para quem, porquê)
2. **Jornada detalhada / Critérios de aceite** — passo a passo do fluxo, com microcopy, estados, exceções, canal de interação e ações por tela/feature
3. **Gherkin** — tradução formal/testável em `docs/specifications/*.feature` (Dado/Quando/Então)

Jornada é a fonte de entendimento. Gherkin é a tradução testável. Ambos devem permanecer alinhados: quando a jornada mudar, o Gherkin correspondente deve ser atualizado no mesmo ciclo (sem deixar drift prolongado).

Para correção de código que **não** muda comportamento: código reflete o Gherkin existente. Se há drift (Gherkin desatualizado vs produto real), primeiro alinhar Jornada + Gherkin, depois mexer no código. Exemplo do que não fazer: remover emojis das quick replies sem verificar que `discovery.feature` os exigia.

*Atualizada em 2026-04-15. Substitui versão anterior "Gherkin é a fonte de verdade" (Gherkin-first), que não refletia a prática real de UX e criava conflito com o trabalho em jornada que precede qualquer formalização. Ver Decision Log no Notion.*

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

**Regra 7 — Story-Goals-Antigoals + rigor de prioridade em Epic/Story.**
Formalizada em TRC-307 ([CHORE] Revisar épicos SPEDITE com Story-Goals-Antigoals). Três sub-regras obrigatórias:

1. **Nenhum Epic ou Story novo entra no board sem Story-Goals-Antigoals preenchido.** Exceção: épico puramente técnico pode ser marcado `⚙ Tech-only epic (no user story)` com callout explícito + justificativa de por que é "não-derivável". Formato do bloco em `docs/story-goals-antigoals.md`.

2. **Status SPEDITE exige link explícito para impacto no usuário.** Épico tech-only SPEDITE só se justifica como "habilitador" de épicos SPEDITE com user story real — dizer isso no corpo. SPEDITE sem impacto de usuário = priority errada.

3. **Sub-task referencia o épico pai via campo `Épico`.** Task órfã (sem épico associado) = red flag em review. Sub-task Chore que faz parte de épico tech-only pode não ter user story individual, mas tem que estar linkada ao épico.

Regra aplicável a **todo PR que cria novo Epic/Story** a partir de 2026-04-24. Epics pré-existentes (ex: TRC-05/06/07) foram retrofitados no mesmo ticket TRC-307.

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

## Notion — repositório externo de produto

**Página oficial**: https://www.notion.so/True-Coding-3420d9578db3804cb33bcdae2e802a22

Convenção **repo vs Notion**:

- **No repo (`docs/`)**: documentação técnica viva — ADRs, specs Gherkin, runbooks, contratos de agentes, políticas de engenharia. Código e docs técnicos andam juntos.
- **No Notion (página True Coding)**: documentação de **produto, estratégia e negócio** — roadmap, pricing, modelo financeiro, personas, pesquisa de mercado, decision log de produto, risk log, feature registry.

Ao receber instruções do tipo "leva isso para o Notion", usar as ferramentas MCP Notion para criar/atualizar páginas sob True Coding, escolhendo o database apropriado:
- **Document Hub** / **Engineering Docs** → documentos longos
- **Decision Log** → decisões de produto
- **Risk Log** → riscos mapeados
- **Feature Registry** → backlog de features

## Fontes de verdade

Não existe mais um documento mestre de especificação. Cada tipo de informação tem seu lugar:

- **Comportamento do sistema** → `docs/specifications/*.feature` (Gherkin, regra 1)
- **Decisões arquiteturais** → `docs/adr/*.md`
- **Como a pipeline funciona hoje** → `docs/development/*.md`
- **Modelo de dados** → `prisma/schema.prisma`
- **Endpoints e contratos** → código em `src/app/api/**` + testes
- **Prompts de IA** → `src/lib/ai/prompts/`
- **Estratégia, roadmap, riscos, features de produto** → Notion (ver seção acima)
