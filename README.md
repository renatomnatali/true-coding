# True Coding

> Plataforma SaaS que transforma ideias em aplicações web em produção por meio de uma pipeline autônoma de desenvolvimento guiada por IA.

Este documento é uma análise detalhada do produto atual, das decisões técnicas e da jornada do usuário, com o objetivo de servir como base para **análise de viabilidade de modelo de negócio**.

---

## 1. Visão Geral

**True Coding** é uma plataforma que orquestra agentes de IA (Claude) para conduzir um usuário não-técnico desde a ideação de um produto digital até o deploy em produção, entregando código versionado em GitHub e site ao vivo em Netlify.

Diferente de ferramentas "no-code" (que produzem runtime proprietário) ou de copilots (que apenas sugerem trechos de código), o True Coding:

- Executa uma **pipeline multi-agente transparente** (Discovery → Planning → Connection → Generation → Deploy → Live).
- Gera **código real versionado** em repositório próprio do usuário.
- Aplica **quality gates reais** (build, testes unitários, BDD, review, security) com checkpoints de retomada.
- Integra-se a **GitHub e Netlify via OAuth** — o artefato final é um site publicado, com histórico git, PRs e deploys auditáveis.

### Proposta de valor

1. Fundador sem time técnico valida uma ideia em horas, não meses.
2. O produto gerado é **auditável e portável** (não há lock-in em runtime proprietário).
3. Cada etapa é **rastreável** (eventos imutáveis, custos por agente, snapshots de plano).

---

## 2. Stack Tecnológico

### 2.1 Núcleo da aplicação

| Camada | Tecnologia | Versão | Papel |
|---|---|---|---|
| Framework | Next.js | ^15.1 | App Router, API routes, SSR/streaming |
| UI | React | ^19 | Interface reativa |
| Linguagem | TypeScript | ^5.7 | Tipagem estática |
| Estilo | Tailwind CSS | ^3.4 | Utility-first |
| Auth | Clerk (`@clerk/nextjs`) | ^6.9 | Identidade, sessões, middleware |
| ORM | Prisma | ^6.2 | PostgreSQL |
| Estado cliente | Zustand | ^5.0 | Wizard state |
| Estado servidor | TanStack Query | ^5.62 | Cache e revalidação |
| Validação | Zod | ^3.24 | Contratos de agentes e API |
| Templates | Handlebars | ^4.7 | Geração de código por template |

### 2.2 Camada de IA

- **`@anthropic-ai/sdk` ^0.71** — SDK oficial Claude.
- **Configuração por fase** (`src/lib/ai/config.ts`):
  - Discovery: Claude Haiku 3 · 1024 tokens · T=0.7 (conversa leve)
  - Planning: Claude Sonnet 4 · 16.384 tokens · T=0.3 (planos estruturados)
  - Codegen: Claude Sonnet 4 · 4.096 tokens · T=0.2 (código determinístico)
- **Provider routing** (`src/lib/ai/provider-config.ts`): flag `AI_PROVIDER` permite alternar entre Claude e Z.AI (infraestrutura pronta para multi-provedor).
- **Rate limiter próprio** (`rate-limiter.ts`): token-bucket por modelo, evita estouro de cota.
- **Parsers tolerantes** (`parsers.ts`): extração robusta de JSON em respostas LLM (tolera ruído, truncamento).

### 2.3 Integrações externas

| Integração | Cliente | Escopos | Uso |
|---|---|---|---|
| GitHub | `@octokit/rest` ^22 | `repo`, `read:user`, `user:email` | Criar repo, branches, commits, PRs, merge |
| Netlify | Cliente custom | Account access | Criar site, vincular ao repo, polling de deploy |
| Clerk | `@clerk/nextjs` | — | Middleware de auth em `/project`, `/dashboard`, `/api` |

Tokens OAuth são **criptografados com AES-GCM** (`src/lib/crypto.ts`) antes de persistir no banco.

### 2.4 Testes e qualidade

- **Vitest** ^3.0 + **@testing-library/react** ^16 + **jsdom** ^25.
- **45 arquivos de teste** no código da aplicação:
  - API routes (12): chat, auth, projects, development, generation.
  - Pipeline (25+): orchestrator, agentes, gates, retry, file generation.
  - Componentes (6): Workspace, ActivityPanel, ExecutionFeed, Connection, Button, Toast.
  - Bibliotecas: crypto, codegen, rate limiter, parsers.
- **ESLint** ^9 com config customizada.

---

## 3. Arquitetura

### 3.1 Estrutura de diretórios

```
src/
├── app/                    # App Router: páginas + API
│   ├── api/
│   │   ├── auth/           # OAuth GitHub, Netlify
│   │   ├── chat/           # Discovery (SSE streaming)
│   │   ├── projects/[id]/
│   │   │   ├── approve/            # Aprovação dos 3 planos
│   │   │   ├── connect/            # Callback OAuth + criação de recursos
│   │   │   └── development/
│   │   │       ├── assessment/     # Análise de complexidade
│   │   │       └── runs/[runId]/   # CRUD + recover + retry + cancel + events
│   │   └── user/github-status/
│   ├── dashboard/          # Lista e gestão de projetos
│   └── project/[id]/       # Workspace principal
├── components/
│   ├── chat/               # ChatWindow, MessageBubble, MessageInput
│   ├── dashboard/          # DashboardContent, ProjectCard, Stats
│   ├── project/
│   │   ├── phases/         # IdeationPhase, ConnectionPhase, ...
│   │   ├── WorkspacePanel, DevelopmentActivityPanel, ExecutionFeedPanel
│   │   └── PlanGenerationOverlay, ProgressStepper, DiscoveryProgressBar
│   ├── wizard/             # PlanReview, DiscoveryWizard
│   └── ui/                 # Design system (Button, Toast)
├── lib/
│   ├── ai/                 # claude.ts, config.ts, provider-config.ts, prompts/
│   ├── development/        # Orquestrador (50+ arquivos)
│   ├── github/             # oauth.ts, client.ts
│   ├── netlify/            # oauth.ts, client.ts
│   ├── codegen/            # Template-based fallback
│   ├── db/                 # Prisma client
│   └── crypto.ts           # AES-GCM
├── config/features.ts      # Feature flags
├── stores/                 # Zustand (wizard state)
└── types/                  # Tipos compartilhados
prisma/                     # Schema + migrations
docs/                       # ADRs, specs Gherkin, runbooks
mockups/                    # Protótipos HTML navegáveis por fase
```

### 3.2 API — rotas principais

| Método | Rota | Propósito |
|---|---|---|
| POST | `/api/chat` | Conversa Discovery (SSE) |
| POST | `/api/projects` | Criar projeto |
| GET/PUT | `/api/projects/[id]` | Ler/atualizar projeto |
| POST | `/api/projects/[id]/approve` | Aprovar plano (business/technical/ux) |
| POST | `/api/projects/[id]/connect` | Callback OAuth + criação de repo/site |
| GET | `/api/auth/github` / `callback` | OAuth GitHub |
| GET | `/api/auth/netlify` / `callback` | OAuth Netlify |
| POST | `/api/projects/[id]/development/assessment` | Análise de complexidade e plano de iterações |
| POST/GET | `/api/projects/[id]/development/runs` | Criar/listar runs |
| GET | `/api/projects/[id]/development/runs/[runId]` | Detalhes do run |
| GET | `.../runs/[runId]/events` | Stream SSE de eventos |
| POST | `.../runs/[runId]/recover` | Retomar run travado |
| POST | `.../runs/[runId]/retry` | Re-executar iteração falha |
| POST | `.../runs/[runId]/cancel` | Cancelar run |
| POST | `.../runs/[runId]/checkpoints/[iteration]` | Retomar checkpoint |

---

## 4. Modelo de Dados (Prisma)

Modelos centrais e o papel de cada um:

- **User** — vinculado ao Clerk; armazena tokens OAuth (GitHub, Netlify) criptografados.
- **Project** — ciclo de vida em 6 fases (`IDEATION → PLANNING → CONNECTING → GENERATING → DEPLOYING → LIVE | FAILED`). Guarda 3 planos em JSON (`businessPlan`, `technicalPlan`, `uxPlan`), flags de aprovação, dados do repo e site.
- **Conversation** + **Message** — histórico da Discovery; fase (DISCOVERY/PLANNING/ITERATION), pergunta atual (1–5), tokens e modelo usados por mensagem.
- **DevelopmentRun** — entidade-mãe da execução autônoma; status (`QUEUED → RUNNING → WAITING_CHECKPOINT | SUCCEEDED | FAILED | CANCELED`), snapshot dos planos, sandbox do worker, iteração atual.
- **IterationRun** — iteração individual (branch própria, escopo, status `PENDING → RUNNING → GATED → MERGED → DEPLOYED | FAILED`).
- **AgentTaskRun** — execução de um agente específico (nome, input hash, output JSON, duração, tokens, **custo em USD**).
- **QualityGateRun** — execução de um gate (`BUILD | UNIT | BDD | REVIEW | SECURITY`) com `passed`, `report`, `logsRef`.
- **RunEvent** — **timeline imutável** indexada por sequência (tipos: RUN_STATUS, ITERATION_STATUS, AGENT_TASK, QUALITY_GATE, DEPLOY_STATUS, ERROR, INFO).
- **GeneratedFile** — arquivos commitados (path, conteúdo, SHA).
- **Deployment** — status do deploy Netlify/Vercel.

O schema foi desenhado para **auditoria e rastreabilidade total**: cada decisão do LLM, cada gate e cada transição ficam registradas. Isso é crucial tanto para debugging quanto para viabilidade regulatória (LGPD, contratos enterprise).

---

## 5. Features Implementadas por Fase

O projeto trata a jornada como **6 fases sequenciais**, cada uma com estado persistido, eventos próprios e specs Gherkin de comportamento.

### Fase 1 — Ideação (Discovery)

Fonte de verdade: `docs/specifications/discovery.feature` (279 linhas).

- Conversa estruturada de **5 perguntas** (problema/público → features core → diferenciais → nice-to-have → monetização).
- **Barra de progresso** deriva do campo `currentQuestion` (1–5) → 0%, 20%, 40%, 60%, 80%, 100%.
- **Quick replies** contextuais com emojis por pergunta (ex.: `📱 App de gestão`).
- Geração do **Business Plan** via Claude (streaming SSE).
- **Restauração de estado** ao recarregar a página.
- Tratamento de erros: timeout, falha de API, provider mal configurado.

### Fase 2 — Planejamento

- Geração sequencial de **3 planos**: Business → Technical → UX.
- **Technical Plan**: páginas, componentes, endpoints, schema de banco, integrações.
- **UX Plan**: wireframes, fluxos, design tokens.
- **Aprovação obrigatória dos 3** antes de avançar para Connection.
- Edição e regeneração de cada plano.
- Extração robusta de JSON (ADR-0006).

### Fase 3 — Conexão

Fonte: `docs/specifications/connection.feature` (353 linhas).

- Checkpoint "Você tem GitHub?" com ramificações Sim/Não.
- OAuth GitHub → criação automática de repo privado (com README, .gitignore, package.json).
- OAuth Netlify → criação de site **já vinculado** ao repo (auto-deploy no merge).
- **Assessment**: `AssessmentAgent` pontua complexidade (1–25); `IterationPlannerAgent` quebra o plano em N iterações.
- Estados intermediários: `github → repo-created → netlify → site-created → connected`.
- Recuperação de falhas OAuth com paths alternativos.

### Fase 4 — Geração (núcleo técnico do produto)

Fonte: `docs/specifications/generation.feature` (401 linhas).

Pipeline por iteração, orquestrada em `src/lib/development/orchestrator.ts`:

```
SpecAgent → TestAgent → CodeAgent → ReviewAgent
                           ↓
           Quality Gates: BUILD → UNIT → BDD → REVIEW → SECURITY
                           ↓
                    Release (git-cli real)
                           ↓
                     Netlify auto-deploy
```

Capacidades:

- **Modos de retomada**: resume manual, checkpoint pause (`WAITING_CHECKPOINT`), baby-steps (pausa no primeiro gate que falhar).
- **Retry classification**: transiente vs persistente, até 3 tentativas por iteração.
- **Geração incremental de arquivos** (PIPELINE_V2): quando o manifest > 4000 tokens, gera arquivo-a-arquivo com recuperação de truncamento.
- **Diagnósticos de falha** (`gate-diagnostics.ts`): extrai causa-raiz de logs e enriquece eventos.
- **Release real**: clone → branch → commit → push → PR → merge squash (`git-release-cli.ts`).

### Fase 5 — Deploy

- Polling do Netlify a cada 10s, timeout de 5min.
- Estados: `new → building → ready | error`.
- URL de produção atribuída automaticamente ao sucesso.

### Fase 6 — Online

- Projeto marcado `LIVE`, URL pública disponível.
- Possibilidade de iniciar **novo run** para iterações seguintes (roadmap).

---

## 6. Agentes e Contratos

Definidos em `src/lib/development/agents.ts` e executados via `agent-runtime.ts`.

| Agente | Entrada | Saída | Modelo |
|---|---|---|---|
| AssessmentAgent | Technical plan | Score de complexidade + categoria | Sonnet |
| IterationPlannerAgent | Plan + score | Lista de iterações (nome, escopo, deps) | Sonnet |
| SpecAgent | Iteração | Gherkin (`.feature`) | Sonnet |
| TestAgent | Spec | Código de testes (RED) | Sonnet |
| CodeAgent | Spec + testes | Implementação (GREEN) — suporta manifest | Sonnet |
| ReviewAgent | Diff | Feedback estruturado | Sonnet |

Validação de contrato por **Zod** em toda saída. Truncamento é detectado e retry é feito reduzindo escopo.

---

## 7. Jornada do Usuário (Mockups Navegáveis)

Protótipos HTML em `mockups/project/phase-*/`:

- **Phase 1 — Ideação** (6 telas): start, perguntas 2–4, confirmação, gerando.
- **Phase 2 — Planning** (9 telas): 3 planos × [view, edit, confirm].
- **Phase 3 — Connection** (5 telas): GitHub OAuth, repo criado, Netlify, análise de complexidade, plano de iterações.
- **Phase 4 — Generation** (10+ telas): geração, pipeline rodando, arquivos, completo, falha, retry, checkpoint, paused, chat com execution feed.
- **Phase 5 — Deploy** (2 telas): deploying, deployed.
- **Phase 6 — Live** (1 tela): project-live.

Componentes-chave:

- **WorkspacePanel**: roteia a fase atual para o componente certo.
- **DevelopmentActivityPanel**: timeline de iterações e gates em tempo real.
- **ExecutionFeedPanel**: stream verboso de eventos com filtros Summary/Technical.
- **ProjectSidebar**: indicadores de fase, status de integrações, progresso global.

---

## 8. Qualidade, Observabilidade e Resiliência

- **BDD/TDD policy** (`docs/development/10-bdd-tdd-policy.md`): Gherkin é fonte de verdade; regra explícita no `CLAUDE.md`.
- **Eventos imutáveis**: toda transição vira `RunEvent`, permitindo reconstrução da timeline.
- **Checkpoints**: runs podem pausar em qualquer gate; recovery reanexa stream sem perda de estado.
- **Sandbox por run**: cada execução tem diretório isolado, limpo no final.
- **Custo por agente**: `AgentTaskRun.cost` permite análise financeira fina por projeto/fase.

### Feature flags

- `NEXT_PUBLIC_FEATURE_AUTONOMOUS_DEVELOPMENT_V1`
- `AUTONOMOUS_DEV_EXECUTE_GATES`
- `AUTONOMOUS_DEV_RELEASE_MODE` (`git-cli` para releases reais)
- `AUTONOMOUS_DEV_BABY_STEPS`
- `PIPELINE_V2` (geração incremental)
- `AI_PROVIDER` (claude/z-ai)

---

## 9. Documentação Interna

### Arquitetura (`docs/development/`)
`02-pipeline-detalhado`, `03-maquina-de-estados`, `04-agentes-e-contratos`, `05-quality-gates`, `06-release-git-cli`, `07-api-e-eventos`, `08-runbook-operacional`, `09-troubleshooting`, `10-bdd-tdd-policy`, `11-diagrama-de-sequencia`.

### ADRs (`docs/adr/`)
1. Fluxo de Discovery estruturado
2. Progress tracking da Discovery
3. Quick replies estruturadas
4. Substatus da Connection
5. Cookie-based project routing no OAuth
6. Extração de JSON do Planning
7. Execução in-process da pipeline
8. Stack única no MVP

### Specs Gherkin (`docs/specifications/`)
`discovery.feature`, `planning.feature`, `connection.feature`, `generation.feature`, `deploy.feature`.

---

## 10. Análise de Viabilidade — Modelo de Negócio

### 10.1 Ativos de produto já construídos

- Pipeline autônoma end-to-end **funcional** com integrações reais (GitHub + Netlify).
- Modelo de dados preparado para **cobrança por uso** (custo granular por agente).
- Máquina de estados resiliente (checkpoints, retry, recovery) — requisito para produção em escala.
- UX fase-a-fase desenhada e prototipada (mockups + componentes React).
- Documentação técnica madura (ADRs, specs, runbooks).

### 10.2 Economia unitária

Cada projeto tem custos variáveis bem mapeados:

| Fase | Modelo | Ordem de grandeza |
|---|---|---|
| Discovery | Haiku | Baixo (conversação, ~5k tokens totais) |
| Planning | Sonnet × 3 planos | Médio (até 16k tokens por plano) |
| Assessment | Sonnet | Baixo-médio |
| Generation | Sonnet × N iterações × 6 agentes | Alto (depende da complexidade) |
| Deploy | — | Custo fixo Netlify |

O campo `AgentTaskRun.cost` já registra custo real em USD por execução — base pronta para **preço por crédito** ou **pacote de projetos**.

### 10.3 Hipóteses de monetização

1. **Freemium com limite de projetos/mês** (Discovery grátis, Generation paga).
2. **Pacotes de créditos** atrelados a iterações ou tokens.
3. **Planos por complexidade** (score do AssessmentAgent determina tier).
4. **White-label / API** para agências que queiram embarcar a pipeline.
5. **Markup em hosting** (revenda Netlify ou tier próprio).

### 10.4 Diferenciais competitivos

- **vs. No-code (Bubble, Webflow)**: código portável, sem lock-in.
- **vs. Copilots (Cursor, Copilot)**: guia completo do não-técnico, não apenas autocomplete.
- **vs. Freelancers / agências**: 10–100× mais rápido na fase de MVP; auditável.
- **vs. Concorrentes de geração autônoma (Lovable, v0, Bolt)**: pipeline com **quality gates reais**, git real, checkpoints — e não apenas preview "mockado".

### 10.5 Riscos e limitações atuais

- **Stack única no MVP** (Next.js + Tailwind + Prisma) — ADR-0008 assumiu essa restrição deliberadamente.
- **Qualidade do código gerado** depende fortemente do Sonnet; custos podem variar com mudanças de preço da Anthropic.
- **Gates síncronos param na primeira falha** — cria boa UX de recuperação, mas limita throughput.
- **Ainda não há logs de deploy em streaming** (polling).
- **Sem multi-tenancy/team features** — limita entrada em B2B.

### 10.6 Roadmap sugerido para viabilidade comercial

1. Medir **taxa de conclusão projeto → LIVE** nos primeiros N usuários (métrica-chave).
2. Registrar **custo médio por projeto** e comparar ao pricing hipotético.
3. Implementar **paywall entre Planning e Generation** (momento de maior valor percebido).
4. Adicionar **templates curados** para casos de uso de alta conversão (landing, CRUD básico, catálogo).
5. Abrir **multi-stack** apenas após validar unit economics no stack único.

---

## 11. Comandos

```bash
npm run dev            # Dev server
npm run build          # Build produção
npm run lint           # ESLint
npm test               # Vitest
npm run test:watch     # Vitest watch
npm run db:generate    # Prisma Client
npm run db:push        # Push schema
npm run db:migrate     # Nova migration
npm run db:studio      # Prisma Studio
```

Variáveis de ambiente em `.env.example`.

---

## 12. Conclusão

O True Coding está em um estágio maduro para validação comercial: a pipeline autônoma é **real** (não simulada), integra-se a serviços de mercado e produz artefatos portáveis. O modelo de dados, a observabilidade e a máquina de estados foram desenhados com **rigor de produto de produção**, não de protótipo.

O próximo passo estratégico não é técnico — é **validar disposição a pagar** com o funil já implementado, usando o custo granular já instrumentado para calibrar pricing e margem. A fundação técnica suporta tanto um modelo freemium quanto um modelo B2B enterprise com pequenas extensões (team, SSO, on-prem deploy).
