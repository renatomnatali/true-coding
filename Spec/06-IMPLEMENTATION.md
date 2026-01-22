# True Coding - Plano de Implementação

## Visão Geral

Este documento detalha as fases e tarefas para implementação do True Coding MVP.

**Duração Total Estimada**: 8-9 semanas
**Equipe Recomendada**: 2-3 desenvolvedores fullstack

---

## Fase 0: Setup do Projeto (1 semana)

### Objetivo
Configurar toda a infraestrutura e ferramentas de desenvolvimento.

### Tarefas

#### 0.1 Criar Repositório
- [ ] Criar repo `true-coding` no GitHub
- [ ] Configurar branch protection para `main`
- [ ] Criar `.gitignore` apropriado
- [ ] Criar `README.md` inicial

**Responsável**: Dev 1
**Duração**: 1 hora

#### 0.2 Inicializar Projeto Next.js
```bash
npx create-next-app@latest true-coding --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
```

- [ ] Executar comando acima
- [ ] Configurar `next.config.ts`
- [ ] Atualizar `tsconfig.json` para strict mode
- [ ] Configurar `eslint.config.mjs`

**Responsável**: Dev 1
**Duração**: 2 horas

#### 0.3 Configurar shadcn/ui
```bash
npx shadcn@latest init
npx shadcn@latest add button card input form label textarea dialog alert tabs
```

- [ ] Inicializar shadcn
- [ ] Adicionar componentes base
- [ ] Criar `src/components/ui/` com componentes iniciais

**Responsável**: Dev 1
**Duração**: 1 hora

#### 0.4 Configurar Prisma + Neon
- [ ] Criar banco no Neon Console
- [ ] `npm install prisma @prisma/client`
- [ ] `npx prisma init`
- [ ] Criar schema inicial (users, projects)
- [ ] Configurar `DATABASE_URL` e `DIRECT_URL`
- [ ] `npx prisma migrate dev --name init`
- [ ] Criar `src/lib/db/prisma.ts`

**Responsável**: Dev 2
**Duração**: 2 horas

#### 0.5 Configurar Clerk
- [ ] Criar aplicação no Clerk Dashboard
- [ ] `npm install @clerk/nextjs`
- [ ] Configurar `middleware.ts`
- [ ] Criar `src/app/layout.tsx` com ClerkProvider
- [ ] Adicionar SignIn/SignUp pages
- [ ] Configurar webhook para sync de usuários
- [ ] Testar fluxo de autenticação

**Responsável**: Dev 2
**Duração**: 3 horas

#### 0.6 Configurar Vitest
```bash
npm install -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/dom
```

- [ ] Instalar dependências
- [ ] Criar `vitest.config.ts`
- [ ] Criar `src/test/setup.ts`
- [ ] Adicionar scripts `test` e `test:watch` no package.json
- [ ] Criar teste de exemplo

**Responsável**: Dev 1
**Duração**: 1 hora

#### 0.7 Configurar CI/CD
- [ ] Criar `.github/workflows/ci.yml`
- [ ] Jobs: lint, typecheck, test, build
- [ ] Configurar cache de node_modules
- [ ] Testar pipeline

**Responsável**: Dev 1
**Duração**: 2 horas

#### 0.8 Configurar Ambiente de Deploy
- [ ] Criar projeto no Vercel
- [ ] Conectar ao repositório
- [ ] Configurar variáveis de ambiente
- [ ] Testar deploy inicial

**Responsável**: Dev 2
**Duração**: 1 hora

#### 0.9 Documentação
- [ ] Criar `CLAUDE.md` com convenções do projeto
- [ ] Criar `.env.example` com todas as variáveis
- [ ] Atualizar `README.md` com instruções de setup

**Responsável**: Dev 1
**Duração**: 1 hora

### Entregáveis Fase 0
- Projeto Next.js funcionando localmente
- CI/CD configurado e passando
- Deploy inicial no Vercel
- Autenticação funcionando

### Critérios de Aceite
- [ ] `npm run dev` funciona
- [ ] `npm run lint` passa
- [ ] `npm run test` passa
- [ ] `npm run build` passa
- [ ] Login/logout funcionando
- [ ] CI verde no GitHub
- [ ] Deploy automático no Vercel

---

## Fase 1: Core AI Chat (2 semanas)

### Objetivo
Implementar o sistema de chat com IA para discovery de requisitos.

### Semana 1.1: Backend do Chat

#### 1.1.1 Integrar Claude API
- [ ] `npm install @anthropic-ai/sdk`
- [ ] Criar `src/lib/ai/claude.ts` com funções:
  - `streamChat()` - para streaming
  - `chat()` - para resposta completa
- [ ] Criar tipos em `src/types/chat.ts`
- [ ] Adicionar `ANTHROPIC_API_KEY` ao env
- [ ] Criar testes unitários

**Responsável**: Dev 1
**Duração**: 4 horas

```typescript
// Estrutura esperada
// src/lib/ai/claude.ts

export async function* streamChat(
  messages: ChatMessage[],
  options: ChatOptions
): AsyncGenerator<string>;

export async function chat(
  messages: ChatMessage[],
  options: ChatOptions
): Promise<string>;
```

#### 1.1.2 Criar System Prompts
- [ ] Criar `src/lib/ai/prompts/discovery.ts`
- [ ] Implementar prompt de discovery conforme spec
- [ ] Criar few-shot examples
- [ ] Testar qualidade das respostas

**Responsável**: Dev 1
**Duração**: 4 horas

#### 1.1.3 Implementar API Route de Chat
- [ ] Criar `src/app/api/chat/route.ts`
- [ ] Implementar streaming via SSE
- [ ] Validar input com Zod
- [ ] Salvar mensagens no banco
- [ ] Detectar quando plano está pronto
- [ ] Parsear BusinessPlan do JSON

**Responsável**: Dev 1
**Duração**: 6 horas

```typescript
// src/app/api/chat/route.ts

export async function POST(req: Request) {
  // 1. Validar autenticação
  // 2. Validar input (projectId, message, phase)
  // 3. Buscar histórico de mensagens
  // 4. Chamar Claude com streaming
  // 5. Salvar mensagem do usuário
  // 6. Stream resposta
  // 7. Salvar resposta do assistant
  // 8. Se plan_ready, salvar BusinessPlan
}
```

#### 1.1.4 Criar Endpoints de Projeto
- [ ] Criar `src/app/api/projects/route.ts` (GET, POST)
- [ ] Criar `src/app/api/projects/[id]/route.ts` (GET, PATCH, DELETE)
- [ ] Implementar validação e autorização
- [ ] Criar testes de integração

**Responsável**: Dev 2
**Duração**: 4 horas

### Semana 1.2: Frontend do Chat

#### 1.2.1 Criar ChatWindow Component
- [ ] Criar `src/components/chat/ChatWindow.tsx`
- [ ] Implementar scroll automático
- [ ] Mostrar indicador de "digitando"
- [ ] Renderizar markdown nas mensagens

**Responsável**: Dev 2
**Duração**: 4 horas

```typescript
// Props esperadas
interface ChatWindowProps {
  projectId: string;
  phase: 'discovery' | 'planning';
  initialMessages?: ChatMessage[];
  onPlanReady?: (plan: BusinessPlan) => void;
}
```

#### 1.2.2 Criar MessageBubble Component
- [ ] Criar `src/components/chat/MessageBubble.tsx`
- [ ] Estilização diferente para user/assistant
- [ ] Suporte a markdown (usar react-markdown)
- [ ] Timestamp

**Responsável**: Dev 2
**Duração**: 2 horas

#### 1.2.3 Criar MessageInput Component
- [ ] Criar `src/components/chat/MessageInput.tsx`
- [ ] Textarea auto-resize
- [ ] Enviar com Enter (Shift+Enter para nova linha)
- [ ] Desabilitar durante envio
- [ ] Limite de caracteres

**Responsável**: Dev 2
**Duração**: 2 horas

#### 1.2.4 Implementar Streaming no Frontend
- [ ] Criar `src/hooks/useChat.ts`
- [ ] Implementar conexão SSE
- [ ] Gerenciar estado de mensagens
- [ ] Tratar erros de conexão
- [ ] Reconexão automática

**Responsável**: Dev 1
**Duração**: 4 horas

```typescript
// src/hooks/useChat.ts

export function useChat(projectId: string, phase: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = async (content: string) => {
    // 1. Adicionar mensagem do usuário
    // 2. Iniciar streaming
    // 3. Atualizar mensagem do assistant incrementalmente
    // 4. Detectar plan_ready
  };

  return { messages, isLoading, sendMessage };
}
```

#### 1.2.5 Criar DiscoveryWizard Component
- [ ] Criar `src/components/wizard/DiscoveryWizard.tsx`
- [ ] Implementar steps:
  1. Input inicial
  2. Chat de refinamento
  3. Review do plano
  4. Confirmação
- [ ] Criar `src/stores/wizard.ts` (Zustand)
- [ ] Navegação entre steps
- [ ] Persistência de progresso

**Responsável**: Dev 2
**Duração**: 6 horas

#### 1.2.6 Criar PlanReview Component
- [ ] Criar `src/components/wizard/PlanReview.tsx`
- [ ] Exibir BusinessPlan formatado
- [ ] Permitir edição inline de campos
- [ ] Botões: "Ajustar" (volta ao chat), "Confirmar"

**Responsável**: Dev 2
**Duração**: 3 horas

#### 1.2.7 Criar Página do Wizard
- [ ] Criar `src/app/(auth)/project/new/page.tsx`
- [ ] Integrar DiscoveryWizard
- [ ] Criar projeto ao iniciar
- [ ] Redirecionar após conclusão

**Responsável**: Dev 1
**Duração**: 2 horas

#### 1.2.8 Testes
- [ ] Testes unitários para componentes
- [ ] Testes de integração para chat flow
- [ ] Teste E2E básico do wizard

**Responsável**: Dev 1 + Dev 2
**Duração**: 4 horas

### Entregáveis Fase 1
- Chat funcional com Claude
- Discovery wizard completo
- BusinessPlan sendo gerado e salvo

### Critérios de Aceite
- [ ] Usuário consegue descrever ideia
- [ ] IA faz perguntas de refinamento
- [ ] BusinessPlan é gerado em JSON válido
- [ ] Plano é exibido para revisão
- [ ] Plano é salvo no banco
- [ ] Streaming funciona sem travamentos

---

## Fase 2: GitHub Integration (1.5 semanas)

### Objetivo
Permitir que usuários conectem GitHub e que código seja criado em seus repositórios.

### Tarefas

#### 2.1 Criar GitHub App
- [ ] Criar GitHub App no settings
- [ ] Configurar permissões conforme spec
- [ ] Gerar private key
- [ ] Configurar webhook URL
- [ ] Salvar credentials no env

**Responsável**: Dev 1
**Duração**: 2 horas

#### 2.2 Implementar OAuth Flow
- [ ] Criar `src/lib/github/oauth.ts`
- [ ] Criar `src/app/api/auth/github/route.ts`
- [ ] Criar `src/app/api/auth/github/callback/route.ts`
- [ ] Salvar tokens no banco (encriptados)
- [ ] Implementar refresh de token

**Responsável**: Dev 1
**Duração**: 4 horas

#### 2.3 Criar Cliente GitHub
- [ ] `npm install @octokit/rest`
- [ ] Criar `src/lib/github/client.ts`
- [ ] Implementar funções:
  - `createRepository()`
  - `createCommit()`
  - `getRepository()`
- [ ] Criar testes

**Responsável**: Dev 1
**Duração**: 6 horas

#### 2.4 Criar UI de Conexão GitHub
- [ ] Criar `src/components/github/ConnectGitHub.tsx`
- [ ] Exibir status de conexão
- [ ] Botão para conectar/desconectar
- [ ] Mostrar username conectado

**Responsável**: Dev 2
**Duração**: 3 horas

#### 2.5 Criar Templates de Código Base
- [ ] Criar `templates/nextjs-basic/`
- [ ] Incluir arquivos:
  - `package.json.template`
  - `tsconfig.json`
  - `.eslintrc.js`
  - `tailwind.config.ts`
  - `.github/workflows/ci.yml`
  - `src/app/layout.tsx`
  - `src/app/page.tsx`
  - `vitest.config.ts`
- [ ] Criar sistema de substituição de variáveis

**Responsável**: Dev 2
**Duração**: 6 horas

```typescript
// Exemplo de template
// templates/nextjs-basic/package.json.template

{
  "name": "{{PROJECT_NAME}}",
  "version": "0.1.0",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint",
    "test": "vitest run"
  },
  ...
}
```

#### 2.6 Integrar na Jornada
- [ ] Adicionar step de conexão GitHub no wizard
- [ ] Validar conexão antes de prosseguir
- [ ] Armazenar preferências (repo público/privado)

**Responsável**: Dev 2
**Duração**: 2 horas

### Entregáveis Fase 2
- OAuth GitHub funcionando
- Cliente GitHub operacional
- Templates de código base prontos
- UI de conexão integrada

### Critérios de Aceite
- [ ] Usuário consegue conectar conta GitHub
- [ ] Token é salvo de forma segura
- [ ] Templates são válidos (JSON, sintaxe)
- [ ] Cliente consegue criar repo de teste

---

## Fase 3: Code Generation (2 semanas)

### Objetivo
Gerar código customizado baseado no plano técnico e commitar no GitHub.

### Semana 3.1: Geração de Código

#### 3.1.1 Implementar Planning Phase
- [ ] Criar `src/lib/ai/prompts/planning.ts`
- [ ] Criar endpoint para gerar TechnicalPlan
- [ ] Parsear JSON do plano técnico
- [ ] Validar estrutura do plano
- [ ] Salvar no banco

**Responsável**: Dev 1
**Duração**: 6 horas

#### 3.1.2 Criar Sistema de Geração
- [ ] Criar `src/lib/codegen/generator.ts`
- [ ] Implementar pipeline:
  1. Carregar templates base
  2. Substituir variáveis
  3. Gerar arquivos customizados via AI
  4. Validar código gerado
- [ ] Criar fila de geração

**Responsável**: Dev 1
**Duração**: 8 horas

```typescript
// src/lib/codegen/generator.ts

export async function* generateProject(
  project: Project
): AsyncGenerator<GenerationEvent> {
  yield { type: 'stage', stage: 'creating_repo' };

  // 1. Criar repositório
  const repo = await createRepository(...);
  yield { type: 'repo_created', url: repo.html_url };

  yield { type: 'stage', stage: 'generating_files' };

  // 2. Carregar templates
  const baseFiles = await loadTemplates('nextjs-basic');

  // 3. Gerar arquivos customizados
  const customFiles = await generateCustomFiles(project.technicalPlan);

  // 4. Validar
  yield { type: 'stage', stage: 'validating_code' };
  await validateCode([...baseFiles, ...customFiles]);

  // 5. Commitar
  yield { type: 'stage', stage: 'committing' };
  await commitFiles(repo, [...baseFiles, ...customFiles]);

  yield { type: 'done', repoUrl: repo.html_url };
}
```

#### 3.1.3 Implementar Geração via AI
- [ ] Criar `src/lib/ai/prompts/codegen.ts`
- [ ] Implementar geração por tipo de arquivo
- [ ] Gerar componentes customizados
- [ ] Gerar API routes
- [ ] Gerar testes

**Responsável**: Dev 1
**Duração**: 8 horas

#### 3.1.4 Criar Validador de Código
- [ ] Criar `src/lib/codegen/validator.ts`
- [ ] Validar sintaxe TypeScript (ts.parseIsolatedModule)
- [ ] Executar ESLint
- [ ] Verificar imports
- [ ] Retry com correção se falhar

**Responsável**: Dev 2
**Duração**: 4 horas

### Semana 3.2: Integração e UI

#### 3.2.1 Criar API de Geração
- [ ] Criar `src/app/api/generate/route.ts`
- [ ] Implementar streaming de progresso
- [ ] Salvar arquivos gerados no banco
- [ ] Atualizar status do projeto

**Responsável**: Dev 1
**Duração**: 4 horas

#### 3.2.2 Criar GenerationProgress Component
- [ ] Criar `src/components/project/GenerationProgress.tsx`
- [ ] Exibir stages de progresso
- [ ] Lista de arquivos gerados
- [ ] Logs de erro se houver
- [ ] Link para repositório ao final

**Responsável**: Dev 2
**Duração**: 4 horas

#### 3.2.3 Criar Página de Projeto
- [ ] Criar `src/app/(auth)/project/[id]/page.tsx`
- [ ] Exibir informações do projeto
- [ ] Mostrar plano de negócio
- [ ] Mostrar plano técnico
- [ ] Exibir progresso de geração
- [ ] Link para repo e deploy

**Responsável**: Dev 2
**Duração**: 4 horas

#### 3.2.4 Integrar CI/CD no Código Gerado
- [ ] Gerar `.github/workflows/ci.yml` customizado
- [ ] Incluir lint, test, build
- [ ] Configurar para TBD
- [ ] Testar que pipeline funciona

**Responsável**: Dev 1
**Duração**: 4 horas

#### 3.2.5 Testes de Geração
- [ ] Teste E2E: discovery → generation
- [ ] Testar diferentes tipos de projeto
- [ ] Validar que código gerado compila
- [ ] Validar que testes passam

**Responsável**: Dev 1 + Dev 2
**Duração**: 6 horas

### Entregáveis Fase 3
- TechnicalPlan sendo gerado
- Código customizado sendo gerado
- Repositório criado e populado
- CI configurado e funcionando

### Critérios de Aceite
- [ ] TechnicalPlan é gerado corretamente
- [ ] Repo é criado no GitHub do usuário
- [ ] Código gerado compila sem erros
- [ ] Testes gerados passam
- [ ] CI do repo gerado passa
- [ ] Progresso é exibido em tempo real

---

## Fase 4: Deploy Integration (1 semana)

### Objetivo
Integrar com Vercel para deploy automático.

### Tarefas

#### 4.1 Configurar Vercel Integration
- [ ] Criar integration no Vercel
- [ ] Configurar OAuth credentials
- [ ] Definir scopes necessários

**Responsável**: Dev 1
**Duração**: 2 horas

#### 4.2 Implementar OAuth Vercel
- [ ] Criar `src/lib/vercel/oauth.ts`
- [ ] Criar `src/app/api/auth/vercel/route.ts`
- [ ] Criar `src/app/api/auth/vercel/callback/route.ts`
- [ ] Salvar tokens

**Responsável**: Dev 1
**Duração**: 3 horas

#### 4.3 Criar Cliente Vercel
- [ ] Criar `src/lib/vercel/client.ts`
- [ ] Implementar:
  - `createProject()`
  - `createDeployment()`
  - `getDeployment()`
  - `setEnvironmentVariables()`
- [ ] Criar testes

**Responsável**: Dev 1
**Duração**: 4 horas

#### 4.4 Criar API de Deploy
- [ ] Criar `src/app/api/deploy/route.ts`
- [ ] Importar projeto do GitHub
- [ ] Configurar env vars
- [ ] Trigger deployment
- [ ] Stream de status/logs

**Responsável**: Dev 1
**Duração**: 4 horas

#### 4.5 Criar UI de Deploy
- [ ] Criar `src/components/deploy/DeployButton.tsx`
- [ ] Criar `src/components/deploy/DeployStatus.tsx`
- [ ] Exibir logs do build
- [ ] Mostrar URL final
- [ ] Integrar na página do projeto

**Responsável**: Dev 2
**Duração**: 4 horas

#### 4.6 Criar UI de Conexão Vercel
- [ ] Criar `src/components/vercel/ConnectVercel.tsx`
- [ ] Exibir status de conexão
- [ ] Integrar no wizard (após GitHub)

**Responsável**: Dev 2
**Duração**: 2 horas

#### 4.7 Testes
- [ ] Teste E2E completo: discovery → deploy
- [ ] Validar que deploy funciona
- [ ] Testar rollback/redeploy

**Responsável**: Dev 1 + Dev 2
**Duração**: 3 horas

### Entregáveis Fase 4
- OAuth Vercel funcionando
- Deploy automático operacional
- URL de produção disponível

### Critérios de Aceite
- [ ] Usuário consegue conectar Vercel
- [ ] Projeto é importado automaticamente
- [ ] Build executa sem erros
- [ ] Deploy é concluído
- [ ] URL de produção acessível

---

## Fase 5: Polish & Launch (1 semana)

### Objetivo
Finalizar MVP com polimento de UX e preparação para beta.

### Tarefas

#### 5.1 Dashboard de Projetos
- [ ] Criar `src/app/(auth)/dashboard/page.tsx`
- [ ] Listar projetos do usuário
- [ ] Mostrar status de cada projeto
- [ ] Links rápidos (repo, deploy, editar)
- [ ] Criar novo projeto

**Responsável**: Dev 2
**Duração**: 4 horas

#### 5.2 Landing Page
- [ ] Criar `src/app/(marketing)/page.tsx`
- [ ] Hero section com proposta de valor
- [ ] Como funciona (steps)
- [ ] Pricing (se aplicável)
- [ ] CTA para signup

**Responsável**: Dev 2
**Duração**: 4 horas

#### 5.3 Tratamento de Erros
- [ ] Criar error boundaries
- [ ] Páginas de erro customizadas
- [ ] Toast notifications para erros
- [ ] Retry automático onde aplicável
- [ ] Logging de erros (Sentry)

**Responsável**: Dev 1
**Duração**: 4 horas

#### 5.4 Loading States
- [ ] Skeletons para listas
- [ ] Spinners para ações
- [ ] Progress bars para operações longas
- [ ] Disabled states em botões

**Responsável**: Dev 2
**Duração**: 2 horas

#### 5.5 Rate Limiting
- [ ] Configurar Upstash Redis
- [ ] Implementar rate limiting nas APIs
- [ ] Exibir feedback quando limitado
- [ ] Quotas por usuário

**Responsável**: Dev 1
**Duração**: 3 horas

#### 5.6 Testes Finais
- [ ] Revisão de todos os testes
- [ ] Testes E2E do fluxo completo
- [ ] Teste de carga básico
- [ ] Teste em diferentes browsers

**Responsável**: Dev 1 + Dev 2
**Duração**: 4 horas

#### 5.7 Documentação
- [ ] Atualizar README com instruções
- [ ] Documentar APIs (OpenAPI/Swagger)
- [ ] Criar guia de contribuição
- [ ] Changelog inicial

**Responsável**: Dev 1
**Duração**: 2 horas

#### 5.8 Monitoramento
- [ ] Configurar Sentry
- [ ] Configurar PostHog (analytics)
- [ ] Alertas básicos
- [ ] Health check endpoint

**Responsável**: Dev 1
**Duração**: 2 horas

#### 5.9 Preparação para Beta
- [ ] Revisar segurança
- [ ] Verificar backups
- [ ] Preparar lista de beta testers
- [ ] Criar feedback form

**Responsável**: Dev 1 + Dev 2
**Duração**: 2 horas

### Entregáveis Fase 5
- Dashboard funcional
- Landing page pronta
- Erros tratados graciosamente
- Monitoramento configurado
- MVP pronto para beta

### Critérios de Aceite
- [ ] Fluxo completo funciona sem erros
- [ ] UX polida e responsiva
- [ ] Performance aceitável (< 3s para operações)
- [ ] Erros são tratados e logados
- [ ] Beta testers conseguem usar

---

## Checklist Final MVP

### Funcionalidades
- [ ] Usuário pode criar conta e fazer login
- [ ] Usuário pode descrever ideia de projeto
- [ ] IA refina ideia via perguntas
- [ ] BusinessPlan é gerado e revisado
- [ ] Usuário conecta GitHub
- [ ] TechnicalPlan é gerado
- [ ] Código é gerado e commitado
- [ ] CI é configurado e passa
- [ ] Usuário conecta Vercel
- [ ] Deploy é realizado
- [ ] Usuário acessa aplicação em produção

### Qualidade
- [ ] Testes passando (>80% cobertura)
- [ ] Lint sem erros
- [ ] TypeScript strict sem erros
- [ ] Acessibilidade básica (WCAG 2.1 A)
- [ ] Performance aceitável

### Operacional
- [ ] CI/CD funcionando
- [ ] Monitoramento ativo
- [ ] Backups configurados
- [ ] Documentação atualizada
