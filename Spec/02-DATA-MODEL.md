# True Coding - Modelo de Dados

## 1. Diagrama ER

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              DIAGRAMA ER                                    │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│      User       │       │     Project     │       │    Message      │
├─────────────────┤       ├─────────────────┤       ├─────────────────┤
│ id              │──┐    │ id              │──┐    │ id              │
│ clerkId         │  │    │ userId          │◄─┘    │ projectId       │◄─┐
│ email           │  │    │ name            │       │ role            │  │
│ name            │  └───>│ status          │       │ content         │  │
│ avatarUrl       │       │ businessPlan    │       │ createdAt       │  │
│ githubToken     │       │ technicalPlan   │       └─────────────────┘  │
│ vercelToken     │       │ githubRepoUrl   │                            │
│ createdAt       │       │ vercelProjectId │       ┌─────────────────┐  │
│ updatedAt       │       │ productionUrl   │       │  Conversation   │  │
└─────────────────┘       │ createdAt       │       ├─────────────────┤  │
                          │ updatedAt       │◄──────│ id              │  │
                          └─────────────────┘       │ projectId       │──┘
                                   │                │ phase           │
                                   │                │ status          │
                                   ▼                │ createdAt       │
                          ┌─────────────────┐       └─────────────────┘
                          │  GeneratedFile  │
                          ├─────────────────┤
                          │ id              │
                          │ projectId       │
                          │ path            │
                          │ content         │
                          │ commitSha       │
                          │ createdAt       │
                          └─────────────────┘
```

## 2. Schema Prisma

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL") // Para migrations (Neon)
}

// ============================================================================
// USER
// ============================================================================

model User {
  id        String   @id @default(cuid())
  clerkId   String   @unique
  email     String   @unique
  name      String?
  avatarUrl String?

  // OAuth tokens (encrypted)
  githubAccessToken  String?
  githubRefreshToken String?
  githubTokenExpiry  DateTime?

  vercelAccessToken  String?
  vercelRefreshToken String?
  vercelTokenExpiry  DateTime?

  // Relations
  projects Project[]

  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("users")
}

// ============================================================================
// PROJECT
// ============================================================================

model Project {
  id     String        @id @default(cuid())
  userId String
  user   User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  name   String
  status ProjectStatus @default(IDEATION)

  // Discovery Phase
  businessPlan Json? // BusinessPlan type

  // Planning Phase
  technicalPlan Json? // TechnicalPlan type

  // Generation Phase
  githubRepoUrl   String?
  githubRepoOwner String?
  githubRepoName  String?

  // Deploy Phase
  vercelProjectId String?
  vercelTeamId    String?
  productionUrl   String?
  lastDeployAt    DateTime?

  // Relations
  conversations  Conversation[]
  generatedFiles GeneratedFile[]
  deployments    Deployment[]

  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([userId])
  @@index([status])
  @@map("projects")
}

enum ProjectStatus {
  IDEATION     // Fase de discovery
  PLANNING     // Gerando plano técnico
  CONNECTING   // Conectando GitHub/Vercel
  GENERATING   // Gerando código
  DEPLOYING    // Fazendo deploy
  LIVE         // Aplicação no ar
  FAILED       // Erro em alguma fase
}

// ============================================================================
// CONVERSATION
// ============================================================================

model Conversation {
  id        String              @id @default(cuid())
  projectId String
  project   Project             @relation(fields: [projectId], references: [id], onDelete: Cascade)
  phase     ConversationPhase
  status    ConversationStatus  @default(ACTIVE)

  // Relations
  messages Message[]

  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([projectId])
  @@map("conversations")
}

enum ConversationPhase {
  DISCOVERY // Entendendo a ideia
  PLANNING  // Refinando plano técnico
  ITERATION // Adicionando features (pós-MVP)
}

enum ConversationStatus {
  ACTIVE    // Em andamento
  COMPLETED // Fase concluída
  ABANDONED // Usuário abandonou
}

// ============================================================================
// MESSAGE
// ============================================================================

model Message {
  id             String       @id @default(cuid())
  conversationId String
  conversation   Conversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)

  role    MessageRole
  content String      @db.Text

  // Metadata
  tokenCount Int?
  model      String? // claude-3-opus, etc.

  // Timestamps
  createdAt DateTime @default(now())

  @@index([conversationId])
  @@map("messages")
}

enum MessageRole {
  USER
  ASSISTANT
  SYSTEM
}

// ============================================================================
// GENERATED FILE
// ============================================================================

model GeneratedFile {
  id        String  @id @default(cuid())
  projectId String
  project   Project @relation(fields: [projectId], references: [id], onDelete: Cascade)

  path      String   @db.VarChar(500) // e.g., "src/app/page.tsx"
  content   String   @db.Text
  commitSha String?

  // Timestamps
  createdAt DateTime @default(now())

  @@unique([projectId, path])
  @@index([projectId])
  @@map("generated_files")
}

// ============================================================================
// DEPLOYMENT
// ============================================================================

model Deployment {
  id        String  @id @default(cuid())
  projectId String
  project   Project @relation(fields: [projectId], references: [id], onDelete: Cascade)

  vercelDeploymentId String           @unique
  status             DeploymentStatus @default(QUEUED)
  url                String?
  errorMessage       String?

  // Timestamps
  createdAt   DateTime  @default(now())
  completedAt DateTime?

  @@index([projectId])
  @@map("deployments")
}

enum DeploymentStatus {
  QUEUED
  BUILDING
  READY
  ERROR
  CANCELED
}
```

## 3. Tipos TypeScript

```typescript
// src/types/project.ts

// ============================================================================
// BUSINESS PLAN (Output do Discovery)
// ============================================================================

export interface BusinessPlan {
  name: string;
  tagline: string;
  description: string;
  problemStatement: string;
  targetAudience: TargetAudience;
  coreFeatures: Feature[];
  niceToHaveFeatures: Feature[];
  monetization?: MonetizationStrategy;
  competitors?: Competitor[];
  successMetrics: SuccessMetric[];
}

export interface TargetAudience {
  primary: string;
  secondary?: string;
  painPoints: string[];
}

export interface Feature {
  id: string;
  name: string;
  description: string;
  priority: 'must-have' | 'should-have' | 'nice-to-have';
  complexity: 'low' | 'medium' | 'high';
}

export interface MonetizationStrategy {
  model: 'free' | 'freemium' | 'subscription' | 'one-time' | 'usage-based';
  description: string;
  pricing?: string;
}

export interface Competitor {
  name: string;
  url?: string;
  differentiator: string;
}

export interface SuccessMetric {
  name: string;
  target: string;
  timeframe: string;
}

// ============================================================================
// TECHNICAL PLAN (Output do Planning)
// ============================================================================

export interface TechnicalPlan {
  architecture: Architecture;
  stack: StackChoice[];
  dataModel: DataModel;
  apiEndpoints: APIEndpoint[];
  pages: Page[];
  components: Component[];
  fileStructure: FileNode[];
  cicd: CICDConfig;
  environment: EnvironmentConfig;
}

export interface Architecture {
  type: 'monolith' | 'microservices' | 'serverless';
  description: string;
  diagram?: string; // ASCII ou Mermaid
}

export interface StackChoice {
  category: 'frontend' | 'backend' | 'database' | 'auth' | 'deploy' | 'other';
  name: string;
  version?: string;
  justification: string;
}

export interface DataModel {
  entities: Entity[];
  relationships: Relationship[];
}

export interface Entity {
  name: string;
  description: string;
  fields: Field[];
}

export interface Field {
  name: string;
  type: string;
  required: boolean;
  unique?: boolean;
  default?: string;
  description?: string;
}

export interface Relationship {
  from: string;
  to: string;
  type: 'one-to-one' | 'one-to-many' | 'many-to-many';
  description?: string;
}

export interface APIEndpoint {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  description: string;
  requestBody?: SchemaDefinition;
  responseBody?: SchemaDefinition;
  authentication: boolean;
}

export interface SchemaDefinition {
  type: string;
  properties?: Record<string, SchemaDefinition>;
  items?: SchemaDefinition;
  required?: string[];
}

export interface Page {
  path: string;
  name: string;
  description: string;
  components: string[];
  dataFetching?: 'SSR' | 'SSG' | 'CSR' | 'ISR';
}

export interface Component {
  name: string;
  description: string;
  props?: Record<string, string>;
  children?: boolean;
}

export interface FileNode {
  path: string;
  type: 'file' | 'directory';
  description?: string;
  template?: string; // Nome do template a usar
  children?: FileNode[];
}

export interface CICDConfig {
  provider: 'github-actions' | 'gitlab-ci' | 'circleci';
  triggers: string[];
  jobs: CICDJob[];
}

export interface CICDJob {
  name: string;
  steps: string[];
}

export interface EnvironmentConfig {
  variables: EnvVariable[];
}

export interface EnvVariable {
  name: string;
  description: string;
  required: boolean;
  secret: boolean;
  example?: string;
}

// ============================================================================
// CHAT
// ============================================================================

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: Date;
}

export interface ChatRequest {
  projectId: string;
  message: string;
  phase: 'discovery' | 'planning';
}

export interface ChatStreamEvent {
  type: 'text' | 'done' | 'error' | 'plan_ready';
  content?: string;
  plan?: BusinessPlan | TechnicalPlan;
  error?: string;
}

// ============================================================================
// GENERATION
// ============================================================================

export interface GenerationRequest {
  projectId: string;
}

export interface GenerationProgress {
  stage: GenerationStage;
  progress: number; // 0-100
  message: string;
  details?: string;
}

export type GenerationStage =
  | 'creating_repo'
  | 'generating_files'
  | 'validating_code'
  | 'committing'
  | 'configuring_ci'
  | 'ready';

export interface GeneratedFileInfo {
  path: string;
  content: string;
  size: number;
}

// ============================================================================
// DEPLOY
// ============================================================================

export interface DeployRequest {
  projectId: string;
}

export interface DeployProgress {
  stage: DeployStage;
  message: string;
  url?: string;
}

export type DeployStage =
  | 'importing'
  | 'building'
  | 'deploying'
  | 'ready'
  | 'error';
```

## 4. Migrations

### Migration 001: Initial Schema

```sql
-- migrations/001_initial_schema.sql

-- Users
CREATE TABLE users (
    id TEXT PRIMARY KEY,
    clerk_id TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    avatar_url TEXT,
    github_access_token TEXT,
    github_refresh_token TEXT,
    github_token_expiry TIMESTAMP,
    vercel_access_token TEXT,
    vercel_refresh_token TEXT,
    vercel_token_expiry TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Projects
CREATE TYPE project_status AS ENUM (
    'IDEATION',
    'PLANNING',
    'CONNECTING',
    'GENERATING',
    'DEPLOYING',
    'LIVE',
    'FAILED'
);

CREATE TABLE projects (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    status project_status DEFAULT 'IDEATION',
    business_plan JSONB,
    technical_plan JSONB,
    github_repo_url TEXT,
    github_repo_owner TEXT,
    github_repo_name TEXT,
    vercel_project_id TEXT,
    vercel_team_id TEXT,
    production_url TEXT,
    last_deploy_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_projects_status ON projects(status);

-- Conversations
CREATE TYPE conversation_phase AS ENUM ('DISCOVERY', 'PLANNING', 'ITERATION');
CREATE TYPE conversation_status AS ENUM ('ACTIVE', 'COMPLETED', 'ABANDONED');

CREATE TABLE conversations (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    phase conversation_phase NOT NULL,
    status conversation_status DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_conversations_project_id ON conversations(project_id);

-- Messages
CREATE TYPE message_role AS ENUM ('USER', 'ASSISTANT', 'SYSTEM');

CREATE TABLE messages (
    id TEXT PRIMARY KEY,
    conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    role message_role NOT NULL,
    content TEXT NOT NULL,
    token_count INTEGER,
    model TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);

-- Generated Files
CREATE TABLE generated_files (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    path VARCHAR(500) NOT NULL,
    content TEXT NOT NULL,
    commit_sha TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(project_id, path)
);

CREATE INDEX idx_generated_files_project_id ON generated_files(project_id);

-- Deployments
CREATE TYPE deployment_status AS ENUM ('QUEUED', 'BUILDING', 'READY', 'ERROR', 'CANCELED');

CREATE TABLE deployments (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    vercel_deployment_id TEXT UNIQUE NOT NULL,
    status deployment_status DEFAULT 'QUEUED',
    url TEXT,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP
);

CREATE INDEX idx_deployments_project_id ON deployments(project_id);
```

## 5. Índices e Performance

### Índices Recomendados

```sql
-- Busca de projetos por usuário e status
CREATE INDEX idx_projects_user_status ON projects(user_id, status);

-- Busca de mensagens por data
CREATE INDEX idx_messages_created_at ON messages(conversation_id, created_at DESC);

-- Busca de deployments recentes
CREATE INDEX idx_deployments_created_at ON deployments(project_id, created_at DESC);
```

### Queries Comuns

```typescript
// Listar projetos do usuário
const projects = await prisma.project.findMany({
  where: { userId: user.id },
  orderBy: { updatedAt: 'desc' },
  include: {
    _count: { select: { deployments: true } },
  },
});

// Buscar projeto com conversas
const project = await prisma.project.findUnique({
  where: { id: projectId },
  include: {
    conversations: {
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    },
  },
});

// Buscar último deployment
const deployment = await prisma.deployment.findFirst({
  where: { projectId },
  orderBy: { createdAt: 'desc' },
});
```

## 6. Backup e Recovery

### Estratégia de Backup

- **Neon**: Backup automático point-in-time (até 7 dias)
- **Branching**: Branch de dev para testes de migrations
- **Export**: Dump semanal para storage externo

### Recovery

```bash
# Restore para ponto específico (Neon Console)
# Ou criar branch a partir de timestamp

# Aplicar migrations em ordem
npx prisma migrate deploy
```
