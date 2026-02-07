# True Coding - Arquitetura Técnica

## 1. Diagrama de Arquitetura

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENTE (Browser)                              │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                    Next.js Frontend (App Router)                      │  │
│  │                                                                       │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │  │
│  │  │   Landing   │  │  Dashboard  │  │   Wizard    │  │   Project   │  │  │
│  │  │    Page     │  │    Page     │  │    Page     │  │   Detail    │  │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘  │  │
│  │                                                                       │  │
│  │  ┌─────────────────────────────────────────────────────────────────┐  │  │
│  │  │                    Shared Components                            │  │  │
│  │  │  ChatWindow │ WizardSteps │ ProjectCard │ DeployStatus │ ...   │  │  │
│  │  └─────────────────────────────────────────────────────────────────┘  │  │
│  │                                                                       │  │
│  │  ┌─────────────────────────────────────────────────────────────────┐  │  │
│  │  │                    State Management                             │  │  │
│  │  │         Zustand (local) + React Query (server state)           │  │  │
│  │  └─────────────────────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      │ HTTPS / WebSocket (streaming)
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         BACKEND (Next.js API Routes)                        │
│                                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐│
│  │  /api/auth  │  │ /api/chat   │  │/api/projects│  │    /api/generate    ││
│  │             │  │             │  │             │  │                     ││
│  │ - GitHub    │  │ - Stream    │  │ - CRUD      │  │ - Create repo       ││
│  │   OAuth     │  │ - Discovery │  │ - List      │  │ - Generate files    ││
│  │ - Vercel    │  │ - Planning  │  │ - Status    │  │ - Commit & push     ││
│  │   OAuth     │  │             │  │             │  │                     ││
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────────────┘│
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │                           /api/deploy                                   ││
│  │                                                                         ││
│  │  - Import project to Vercel    - Trigger deployment                     ││
│  │  - Configure environment vars   - Get deployment status                 ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │                         Service Layer                                   ││
│  │                                                                         ││
│  │  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────────────────┐││
│  │  │    AI     │  │  GitHub   │  │  Vercel   │  │       Project         │││
│  │  │  Service  │  │  Service  │  │  Service  │  │       Service         │││
│  │  └───────────┘  └───────────┘  └───────────┘  └───────────────────────┘││
│  └─────────────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────────┘
         │                │                │                │
         ▼                ▼                ▼                ▼
┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│   Claude    │  │  PostgreSQL │  │   GitHub    │  │   Vercel    │
│    API      │  │   (Neon)    │  │    API      │  │    API      │
│             │  │             │  │             │  │             │
│ - chat      │  │ - users     │  │ - repos     │  │ - projects  │
│ - complete  │  │ - projects  │  │ - contents  │  │ - deploys   │
│ - stream    │  │ - messages  │  │ - commits   │  │ - domains   │
└─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘
                       │
                       ▼
                ┌─────────────┐
                │    Redis    │
                │  (Upstash)  │
                │             │
                │ - sessions  │
                │ - rate limit│
                │ - cache     │
                └─────────────┘
```

## 2. Stack Tecnológico Detalhado

### 2.1 Frontend

| Tecnologia | Versão | Uso | Justificativa |
|------------|--------|-----|---------------|
| **Next.js** | 15.x | Framework | App Router, Server Components, API Routes |
| **React** | 19.x | UI Library | Concurrent features, Suspense |
| **TypeScript** | 5.x | Linguagem | Type safety, melhor DX |
| **Tailwind CSS** | 4.x | Estilização | Utility-first, rápido |
| **shadcn/ui** | latest | Componentes | Acessível, customizável, não é dependência |
| **Zustand** | 5.x | Estado local | Simples, sem boilerplate |
| **TanStack Query** | 5.x | Estado servidor | Cache, refetch, mutations |
| **Zod** | 3.x | Validação | Runtime validation, type inference |
| **Lucide React** | latest | Ícones | Consistente, tree-shakeable |

### 2.2 Backend

| Tecnologia | Versão | Uso | Justificativa |
|------------|--------|-----|---------------|
| **Next.js API Routes** | 15.x | API | Mesmo deploy, simplicidade |
| **tRPC** | 11.x | Type-safe API | End-to-end type safety |
| **Prisma** | 6.x | ORM | Type-safe, migrations |
| **Zod** | 3.x | Validação | Schemas compartilhados |

### 2.3 Banco de Dados

| Tecnologia | Uso | Justificativa |
|------------|-----|---------------|
| **PostgreSQL (Neon)** | Banco principal | Serverless, branching, escalável |
| **Redis (Upstash)** | Cache/Sessions | Serverless, rate limiting |

### 2.4 Autenticação

| Tecnologia | Uso | Justificativa |
|------------|-----|---------------|
| **Clerk** | Auth principal | OAuth pronto, webhooks, fácil |

### 2.5 Serviços Externos

| Serviço | Uso | Documentação |
|---------|-----|--------------|
| **Anthropic Claude API** | LLM principal | https://docs.anthropic.com |
| **GitHub API v3/GraphQL** | Repos, commits | https://docs.github.com |
| **Vercel API** | Deploy | https://vercel.com/docs/rest-api |

### 2.6 DevOps

| Ferramenta | Uso |
|------------|-----|
| **Vercel** | Hosting |
| **GitHub Actions** | CI/CD |
| **Sentry** | Error tracking |
| **PostHog** | Analytics |

## 3. Estrutura de Pastas

```
/true-coding
├── .github/
│   └── workflows/
│       └── ci.yml                    # CI/CD pipeline
├── prisma/
│   ├── schema.prisma                 # Schema do banco
│   └── migrations/                   # Migrations
├── public/
│   └── ...                           # Assets estáticos
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── (auth)/                   # Grupo de rotas autenticadas
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx
│   │   │   └── project/
│   │   │       ├── new/
│   │   │       │   └── page.tsx      # Wizard
│   │   │       └── [id]/
│   │   │           └── page.tsx      # Detalhes
│   │   ├── (marketing)/              # Grupo de rotas públicas
│   │   │   └── page.tsx              # Landing
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   │   ├── github/
│   │   │   │   │   ├── route.ts      # Inicia OAuth
│   │   │   │   │   └── callback/
│   │   │   │   │       └── route.ts  # Callback OAuth
│   │   │   │   └── vercel/
│   │   │   │       ├── route.ts
│   │   │   │       └── callback/
│   │   │   │           └── route.ts
│   │   │   ├── chat/
│   │   │   │   └── route.ts          # Streaming chat
│   │   │   ├── projects/
│   │   │   │   ├── route.ts          # List/Create
│   │   │   │   └── [id]/
│   │   │   │       └── route.ts      # Get/Update/Delete
│   │   │   ├── generate/
│   │   │   │   └── route.ts          # Code generation
│   │   │   ├── deploy/
│   │   │   │   └── route.ts          # Deploy trigger
│   │   │   └── trpc/
│   │   │       └── [trpc]/
│   │   │           └── route.ts      # tRPC handler
│   │   ├── layout.tsx                # Root layout
│   │   └── globals.css               # Global styles
│   ├── components/
│   │   ├── chat/
│   │   │   ├── ChatWindow.tsx
│   │   │   ├── MessageBubble.tsx
│   │   │   ├── MessageInput.tsx
│   │   │   └── StreamingMessage.tsx
│   │   ├── wizard/
│   │   │   ├── DiscoveryWizard.tsx
│   │   │   ├── WizardStep.tsx
│   │   │   ├── PlanReview.tsx
│   │   │   └── StepIndicator.tsx
│   │   ├── project/
│   │   │   ├── ProjectCard.tsx
│   │   │   ├── ProjectList.tsx
│   │   │   ├── DeployStatus.tsx
│   │   │   └── GenerationProgress.tsx
│   │   ├── layout/
│   │   │   ├── Header.tsx
│   │   │   ├── Footer.tsx
│   │   │   └── Sidebar.tsx
│   │   └── ui/                       # shadcn components
│   │       ├── button.tsx
│   │       ├── card.tsx
│   │       ├── input.tsx
│   │       └── ...
│   ├── lib/
│   │   ├── ai/
│   │   │   ├── claude.ts             # Cliente Claude
│   │   │   ├── prompts/
│   │   │   │   ├── discovery.ts      # Prompts discovery
│   │   │   │   ├── planning.ts       # Prompts planning
│   │   │   │   └── codegen.ts        # Prompts code gen
│   │   │   └── parsers.ts            # Parse respostas AI
│   │   ├── github/
│   │   │   ├── client.ts             # Cliente GitHub
│   │   │   ├── oauth.ts              # OAuth helpers
│   │   │   └── templates.ts          # File templates
│   │   ├── vercel/
│   │   │   ├── client.ts             # Cliente Vercel
│   │   │   └── oauth.ts              # OAuth helpers
│   │   ├── db/
│   │   │   └── prisma.ts             # Prisma client
│   │   ├── trpc/
│   │   │   ├── client.ts             # tRPC client
│   │   │   ├── server.ts             # tRPC server
│   │   │   └── routers/
│   │   │       ├── project.ts
│   │   │       └── index.ts
│   │   └── utils/
│   │       ├── validation.ts         # Validação de código
│   │       └── helpers.ts
│   ├── hooks/
│   │   ├── useChat.ts
│   │   ├── useProject.ts
│   │   └── useWizard.ts
│   ├── stores/
│   │   └── wizard.ts                 # Zustand store
│   └── types/
│       ├── project.ts
│       ├── chat.ts
│       └── index.ts
├── templates/                        # Templates de código
│   └── nextjs-basic/
│       ├── package.json.template
│       ├── tsconfig.json.template
│       ├── .github/
│       │   └── workflows/
│       │       └── ci.yml.template
│       └── src/
│           └── ...
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── .env.example
├── .env.local
├── .eslintrc.js
├── next.config.ts
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── vitest.config.ts
```

## 4. Fluxo de Dados

### 4.1 Discovery Flow

```
┌──────────────────────────────────────────────────────────────────────────┐
│                            DISCOVERY FLOW                                │
└──────────────────────────────────────────────────────────────────────────┘

User                    Frontend                   Backend                 Claude
 │                         │                          │                       │
 │  "Quero um site..."     │                          │                       │
 │────────────────────────>│                          │                       │
 │                         │                          │                       │
 │                         │  POST /api/chat          │                       │
 │                         │  {message, projectId}    │                       │
 │                         │─────────────────────────>│                       │
 │                         │                          │                       │
 │                         │                          │  messages.create()    │
 │                         │                          │──────────────────────>│
 │                         │                          │                       │
 │                         │                          │  <stream>             │
 │                         │                          │<──────────────────────│
 │                         │                          │                       │
 │                         │  <stream SSE>            │                       │
 │                         │<─────────────────────────│                       │
 │                         │                          │                       │
 │  Renderiza mensagem     │                          │                       │
 │<────────────────────────│                          │                       │
 │                         │                          │                       │
 │  ... múltiplas trocas ...                          │                       │
 │                         │                          │                       │
 │                         │  POST /api/chat          │                       │
 │                         │  {message: "confirmo"}   │                       │
 │                         │─────────────────────────>│                       │
 │                         │                          │                       │
 │                         │                          │  Detect: plan ready   │
 │                         │                          │──────────────────────>│
 │                         │                          │                       │
 │                         │                          │  BusinessPlan JSON    │
 │                         │                          │<──────────────────────│
 │                         │                          │                       │
 │                         │                          │  Save to DB           │
 │                         │                          │─────────┐             │
 │                         │                          │         │             │
 │                         │                          │<────────┘             │
 │                         │                          │                       │
 │                         │  {businessPlan, done}    │                       │
 │                         │<─────────────────────────│                       │
 │                         │                          │                       │
 │  Mostra PlanReview      │                          │                       │
 │<────────────────────────│                          │                       │
```

### 4.2 Code Generation Flow

```
┌──────────────────────────────────────────────────────────────────────────┐
│                         CODE GENERATION FLOW                             │
└──────────────────────────────────────────────────────────────────────────┘

Frontend                  Backend                 GitHub API            Claude
   │                         │                        │                    │
   │  POST /api/generate     │                        │                    │
   │  {projectId}            │                        │                    │
   │────────────────────────>│                        │                    │
   │                         │                        │                    │
   │                         │  1. Get project        │                    │
   │                         │─────────┐              │                    │
   │                         │<────────┘              │                    │
   │                         │                        │                    │
   │                         │  2. Create repo        │                    │
   │                         │───────────────────────>│                    │
   │                         │                        │                    │
   │                         │  {repo_url, ...}       │                    │
   │                         │<───────────────────────│                    │
   │                         │                        │                    │
   │  <stream: repo created> │                        │                    │
   │<────────────────────────│                        │                    │
   │                         │                        │                    │
   │                         │  3. Generate files     │                    │
   │                         │────────────────────────────────────────────>│
   │                         │                        │                    │
   │                         │  {files: [...]}        │                    │
   │                         │<────────────────────────────────────────────│
   │                         │                        │                    │
   │                         │  4. Validate code      │                    │
   │                         │─────────┐              │                    │
   │                         │<────────┘              │                    │
   │                         │                        │                    │
   │  <stream: generating>   │                        │                    │
   │<────────────────────────│                        │                    │
   │                         │                        │                    │
   │                         │  5. Create commits     │                    │
   │                         │───────────────────────>│                    │
   │                         │                        │                    │
   │                         │  {commit_sha}          │                    │
   │                         │<───────────────────────│                    │
   │                         │                        │                    │
   │  <stream: committed>    │                        │                    │
   │<────────────────────────│                        │                    │
   │                         │                        │                    │
   │                         │  6. Update project     │                    │
   │                         │─────────┐              │                    │
   │                         │<────────┘              │                    │
   │                         │                        │                    │
   │  {status: ready}        │                        │                    │
   │<────────────────────────│                        │                    │
```

## 5. Componentes Principais

### 5.1 ChatWindow

```typescript
// src/components/chat/ChatWindow.tsx

interface ChatWindowProps {
  projectId: string;
  phase: 'discovery' | 'planning';
  onComplete: (result: BusinessPlan | TechnicalPlan) => void;
}

// Responsabilidades:
// - Renderizar histórico de mensagens
// - Capturar input do usuário
// - Fazer streaming de respostas
// - Detectar conclusão de fase
```

### 5.2 DiscoveryWizard

```typescript
// src/components/wizard/DiscoveryWizard.tsx

interface DiscoveryWizardProps {
  onComplete: (businessPlan: BusinessPlan) => void;
}

// Steps:
// 1. Descrição inicial da ideia
// 2. Chat de refinamento
// 3. Revisão do BusinessPlan
// 4. Confirmação

// State (Zustand):
// - currentStep
// - messages[]
// - businessPlan (draft)
// - isLoading
```

### 5.3 GenerationProgress

```typescript
// src/components/project/GenerationProgress.tsx

interface GenerationProgressProps {
  projectId: string;
}

// Stages:
// 1. Creating repository
// 2. Generating code
// 3. Validating
// 4. Committing
// 5. Configuring CI/CD
// 6. Ready for deploy

// Updates via WebSocket/SSE
```

## 6. Segurança

### 6.1 Autenticação

- **Clerk** para auth principal
- **JWT** para tokens de sessão
- **OAuth 2.0** para GitHub e Vercel

### 6.2 Autorização

```typescript
// Middleware de autorização
export async function authorize(req: Request, projectId: string) {
  const user = await getUser(req);
  const project = await db.project.findUnique({ where: { id: projectId } });

  if (project.userId !== user.id) {
    throw new ForbiddenError();
  }
}
```

### 6.3 Tokens OAuth

- Encriptados em repouso (AES-256)
- Rotação automática antes de expirar
- Armazenados no banco, não em cookies

### 6.4 Rate Limiting

```typescript
// Via Upstash Redis
const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '1 m'), // 10 req/min
});
```

### 6.5 Validação de Código Gerado

- Parse AST antes de commit
- ESLint check
- Sem execução de código no servidor

## 7. Performance

### 7.1 Streaming

- Respostas da IA via SSE (Server-Sent Events)
- Renderização incremental no frontend

### 7.2 Caching

- React Query para cache de dados
- Redis para cache de respostas similares da IA

### 7.3 Code Splitting

- Next.js automatic code splitting
- Lazy loading de componentes pesados

## 8. Monitoramento

### 8.1 Logs

- Structured logging (JSON)
- Request ID para tracing
- Níveis: debug, info, warn, error

### 8.2 Métricas

- Tempo de resposta de APIs
- Taxa de sucesso de geração
- Uso de tokens de IA

### 8.3 Alertas

- Erros de geração > 20%
- Latência > 10s
- Rate limit hit > 100/hora
