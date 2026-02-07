# True Coding - Especificação de API

## 1. Visão Geral

Base URL: `https://truecoding.app/api`

Todas as rotas (exceto auth) requerem autenticação via Clerk.

## 2. Autenticação

### 2.1 Headers

```http
Authorization: Bearer <clerk_session_token>
```

### 2.2 Erros de Autenticação

```json
{
  "error": "UNAUTHORIZED",
  "message": "Invalid or expired session token"
}
```

## 3. Endpoints

---

### 3.1 Auth - GitHub OAuth

#### Iniciar OAuth

```http
GET /api/auth/github
```

**Response**: Redirect para GitHub OAuth

#### Callback OAuth

```http
GET /api/auth/github/callback?code={code}&state={state}
```

**Response**: Redirect para `/dashboard` com tokens salvos

---

### 3.2 Auth - Vercel OAuth

#### Iniciar OAuth

```http
GET /api/auth/vercel
```

**Response**: Redirect para Vercel OAuth

#### Callback OAuth

```http
GET /api/auth/vercel/callback?code={code}&state={state}
```

**Response**: Redirect para projeto com tokens salvos

---

### 3.3 Projects

#### Listar Projetos

```http
GET /api/projects
```

**Query Parameters**:
- `status` (optional): Filtrar por status
- `limit` (optional): Limite de resultados (default: 20)
- `offset` (optional): Offset para paginação

**Response** `200 OK`:
```json
{
  "projects": [
    {
      "id": "clx1234567890",
      "name": "Meu App",
      "status": "LIVE",
      "productionUrl": "https://meu-app.vercel.app",
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T12:00:00Z"
    }
  ],
  "total": 5,
  "hasMore": false
}
```

#### Criar Projeto

```http
POST /api/projects
```

**Request Body**:
```json
{
  "name": "Meu Novo App"
}
```

**Response** `201 Created`:
```json
{
  "id": "clx1234567890",
  "name": "Meu Novo App",
  "status": "IDEATION",
  "createdAt": "2024-01-15T10:30:00Z"
}
```

#### Obter Projeto

```http
GET /api/projects/{projectId}
```

**Response** `200 OK`:
```json
{
  "id": "clx1234567890",
  "name": "Meu App",
  "status": "LIVE",
  "businessPlan": {
    "name": "Verificador de Placas",
    "tagline": "Consulte dados de veículos pela placa",
    "description": "...",
    "coreFeatures": [...]
  },
  "technicalPlan": {
    "architecture": {...},
    "stack": [...],
    "pages": [...]
  },
  "githubRepoUrl": "https://github.com/user/meu-app",
  "productionUrl": "https://meu-app.vercel.app",
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T12:00:00Z"
}
```

#### Atualizar Projeto

```http
PATCH /api/projects/{projectId}
```

**Request Body**:
```json
{
  "name": "Novo Nome",
  "businessPlan": {...}
}
```

**Response** `200 OK`: Projeto atualizado

#### Deletar Projeto

```http
DELETE /api/projects/{projectId}
```

**Response** `204 No Content`

---

### 3.4 Chat (Streaming)

#### Enviar Mensagem

```http
POST /api/chat
Content-Type: application/json
Accept: text/event-stream
```

**Request Body**:
```json
{
  "projectId": "clx1234567890",
  "message": "Quero criar um site que verifica dados de veículos pela placa",
  "phase": "discovery"
}
```

**Response** `200 OK` (Server-Sent Events):
```
event: text
data: {"content": "Interessante! "}

event: text
data: {"content": "Para entender melhor, "}

event: text
data: {"content": "me conte: qual é o público-alvo?"}

event: done
data: {"messageId": "msg_123"}
```

**Eventos Possíveis**:

| Event | Data | Descrição |
|-------|------|-----------|
| `text` | `{content: string}` | Chunk de texto |
| `done` | `{messageId: string}` | Mensagem completa |
| `plan_ready` | `{plan: BusinessPlan \| TechnicalPlan}` | Plano gerado |
| `error` | `{message: string, code: string}` | Erro |

#### Obter Histórico

```http
GET /api/chat/{projectId}/history?phase={phase}
```

**Response** `200 OK`:
```json
{
  "messages": [
    {
      "id": "msg_001",
      "role": "user",
      "content": "Quero criar um site...",
      "createdAt": "2024-01-15T10:30:00Z"
    },
    {
      "id": "msg_002",
      "role": "assistant",
      "content": "Interessante! Para entender melhor...",
      "createdAt": "2024-01-15T10:30:05Z"
    }
  ]
}
```

---

### 3.5 Code Generation

#### Iniciar Geração

```http
POST /api/generate
Content-Type: application/json
Accept: text/event-stream
```

**Request Body**:
```json
{
  "projectId": "clx1234567890"
}
```

**Pré-requisitos**:
- `businessPlan` preenchido
- `technicalPlan` preenchido
- GitHub OAuth conectado

**Response** `200 OK` (Server-Sent Events):
```
event: stage
data: {"stage": "creating_repo", "progress": 10, "message": "Criando repositório..."}

event: stage
data: {"stage": "generating_files", "progress": 30, "message": "Gerando arquivos..."}

event: file
data: {"path": "src/app/page.tsx", "size": 1234}

event: file
data: {"path": "src/app/layout.tsx", "size": 567}

event: stage
data: {"stage": "validating_code", "progress": 60, "message": "Validando código..."}

event: stage
data: {"stage": "committing", "progress": 80, "message": "Commitando arquivos..."}

event: commit
data: {"sha": "abc123def456", "message": "feat: initial commit"}

event: stage
data: {"stage": "ready", "progress": 100, "message": "Código gerado com sucesso!"}

event: done
data: {"repoUrl": "https://github.com/user/meu-app"}
```

#### Obter Status da Geração

```http
GET /api/generate/{projectId}/status
```

**Response** `200 OK`:
```json
{
  "stage": "generating_files",
  "progress": 45,
  "message": "Gerando componentes...",
  "startedAt": "2024-01-15T10:30:00Z"
}
```

#### Listar Arquivos Gerados

```http
GET /api/generate/{projectId}/files
```

**Response** `200 OK`:
```json
{
  "files": [
    {
      "path": "src/app/page.tsx",
      "size": 1234,
      "commitSha": "abc123"
    },
    {
      "path": "src/app/layout.tsx",
      "size": 567,
      "commitSha": "abc123"
    }
  ],
  "totalFiles": 25,
  "totalSize": 45678
}
```

---

### 3.6 Deploy

#### Iniciar Deploy

```http
POST /api/deploy
Content-Type: application/json
Accept: text/event-stream
```

**Request Body**:
```json
{
  "projectId": "clx1234567890"
}
```

**Pré-requisitos**:
- Código gerado no GitHub
- Vercel OAuth conectado

**Response** `200 OK` (Server-Sent Events):
```
event: stage
data: {"stage": "importing", "message": "Importando projeto para Vercel..."}

event: stage
data: {"stage": "building", "message": "Build em andamento..."}

event: log
data: {"line": "Installing dependencies..."}

event: log
data: {"line": "Building Next.js application..."}

event: stage
data: {"stage": "deploying", "message": "Fazendo deploy..."}

event: stage
data: {"stage": "ready", "message": "Deploy concluído!"}

event: done
data: {"url": "https://meu-app.vercel.app", "deploymentId": "dpl_123"}
```

#### Obter Status do Deploy

```http
GET /api/deploy/{projectId}/status
```

**Response** `200 OK`:
```json
{
  "stage": "building",
  "message": "Build em andamento...",
  "deploymentId": "dpl_123",
  "startedAt": "2024-01-15T10:30:00Z"
}
```

#### Listar Deployments

```http
GET /api/deploy/{projectId}/history
```

**Response** `200 OK`:
```json
{
  "deployments": [
    {
      "id": "dpl_123",
      "status": "READY",
      "url": "https://meu-app.vercel.app",
      "createdAt": "2024-01-15T10:30:00Z",
      "completedAt": "2024-01-15T10:32:00Z"
    }
  ]
}
```

---

## 4. Códigos de Erro

| HTTP Status | Error Code | Descrição |
|-------------|------------|-----------|
| 400 | `BAD_REQUEST` | Request inválido |
| 401 | `UNAUTHORIZED` | Não autenticado |
| 403 | `FORBIDDEN` | Sem permissão |
| 404 | `NOT_FOUND` | Recurso não encontrado |
| 409 | `CONFLICT` | Conflito de estado |
| 422 | `VALIDATION_ERROR` | Erro de validação |
| 429 | `RATE_LIMITED` | Rate limit excedido |
| 500 | `INTERNAL_ERROR` | Erro interno |
| 502 | `EXTERNAL_API_ERROR` | Erro em API externa |

**Formato de Erro**:
```json
{
  "error": "VALIDATION_ERROR",
  "message": "Business plan is required before generating code",
  "details": {
    "field": "businessPlan",
    "reason": "required"
  }
}
```

---

## 5. Rate Limiting

| Endpoint | Limite |
|----------|--------|
| `/api/chat` | 30 req/min |
| `/api/generate` | 5 req/hora |
| `/api/deploy` | 10 req/hora |
| Outros | 100 req/min |

**Headers de Rate Limit**:
```http
X-RateLimit-Limit: 30
X-RateLimit-Remaining: 25
X-RateLimit-Reset: 1705315200
```

---

## 6. Webhooks (Futuro)

### GitHub Webhook

```http
POST /api/webhooks/github
X-GitHub-Event: push
X-Hub-Signature-256: sha256=...
```

### Vercel Webhook

```http
POST /api/webhooks/vercel
X-Vercel-Signature: ...
```

---

## 7. Implementação tRPC (Opcional)

Para type-safety end-to-end, usar tRPC:

```typescript
// src/lib/trpc/routers/project.ts
import { router, protectedProcedure } from '../server';
import { z } from 'zod';

export const projectRouter = router({
  list: protectedProcedure
    .input(z.object({
      status: z.enum(['IDEATION', 'PLANNING', ...]).optional(),
      limit: z.number().default(20),
      offset: z.number().default(0),
    }))
    .query(async ({ ctx, input }) => {
      return ctx.db.project.findMany({
        where: {
          userId: ctx.user.id,
          status: input.status,
        },
        take: input.limit,
        skip: input.offset,
      });
    }),

  create: protectedProcedure
    .input(z.object({
      name: z.string().min(1).max(100),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.project.create({
        data: {
          name: input.name,
          userId: ctx.user.id,
        },
      });
    }),

  // ... outros métodos
});
```

**Uso no Frontend**:
```typescript
// Componente React
const { data: projects } = trpc.project.list.useQuery({ limit: 10 });
const createProject = trpc.project.create.useMutation();

await createProject.mutateAsync({ name: 'Meu App' });
```
