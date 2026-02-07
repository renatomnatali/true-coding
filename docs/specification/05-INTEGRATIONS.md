# True Coding - Integrações Externas

## 1. Claude API (Anthropic)

### 1.1 Configuração

```typescript
// src/lib/ai/claude.ts

import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export interface ChatOptions {
  model?: string;
  maxTokens?: number;
  temperature?: number;
  systemPrompt: string;
}

export async function* streamChat(
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  options: ChatOptions
): AsyncGenerator<string> {
  const stream = await anthropic.messages.stream({
    model: options.model || 'claude-3-sonnet-20240229',
    max_tokens: options.maxTokens || 4096,
    temperature: options.temperature || 0.5,
    system: options.systemPrompt,
    messages,
  });

  for await (const event of stream) {
    if (
      event.type === 'content_block_delta' &&
      event.delta.type === 'text_delta'
    ) {
      yield event.delta.text;
    }
  }
}

export async function chat(
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  options: ChatOptions
): Promise<string> {
  const response = await anthropic.messages.create({
    model: options.model || 'claude-3-sonnet-20240229',
    max_tokens: options.maxTokens || 4096,
    temperature: options.temperature || 0.5,
    system: options.systemPrompt,
    messages,
  });

  return response.content[0].type === 'text'
    ? response.content[0].text
    : '';
}
```

### 1.2 Variáveis de Ambiente

```env
# .env.local
ANTHROPIC_API_KEY=sk-ant-...
```

### 1.3 Rate Limits

| Tier | RPM | TPM |
|------|-----|-----|
| Free | 5 | 20,000 |
| Build | 50 | 100,000 |
| Scale | 1,000 | 400,000 |

### 1.4 Custos por Modelo

| Modelo | Input (1M tokens) | Output (1M tokens) |
|--------|-------------------|-------------------|
| Haiku | $0.25 | $1.25 |
| Sonnet | $3.00 | $15.00 |
| Opus | $15.00 | $75.00 |

---

## 2. GitHub API

### 2.1 GitHub App Setup

**Criar GitHub App em:** https://github.com/settings/apps/new

**Configurações:**
- **Name**: True Coding
- **Homepage URL**: https://truecoding.app
- **Callback URL**: https://truecoding.app/api/auth/github/callback
- **Webhook URL**: https://truecoding.app/api/webhooks/github
- **Webhook Secret**: (gerar)

**Permissões:**
```yaml
Repository permissions:
  - Contents: Read and write
  - Metadata: Read-only
  - Pull requests: Read and write
  - Workflows: Read and write

Account permissions:
  - Email addresses: Read-only
```

### 2.2 OAuth Flow

```typescript
// src/lib/github/oauth.ts

const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID!;
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET!;

export function getAuthorizationUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: GITHUB_CLIENT_ID,
    redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/github/callback`,
    scope: 'repo workflow read:user user:email',
    state,
  });

  return `https://github.com/login/oauth/authorize?${params}`;
}

export async function exchangeCodeForToken(code: string): Promise<{
  access_token: string;
  refresh_token: string;
  expires_in: number;
}> {
  const response = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      client_id: GITHUB_CLIENT_ID,
      client_secret: GITHUB_CLIENT_SECRET,
      code,
    }),
  });

  return response.json();
}
```

### 2.3 Cliente GitHub

```typescript
// src/lib/github/client.ts

import { Octokit } from '@octokit/rest';

export function createGitHubClient(accessToken: string) {
  return new Octokit({ auth: accessToken });
}

export async function createRepository(
  octokit: Octokit,
  name: string,
  description: string,
  isPrivate: boolean = false
) {
  const { data: repo } = await octokit.repos.createForAuthenticatedUser({
    name,
    description,
    private: isPrivate,
    auto_init: false,
    has_issues: true,
    has_wiki: false,
  });

  return repo;
}

export async function createOrUpdateFile(
  octokit: Octokit,
  owner: string,
  repo: string,
  path: string,
  content: string,
  message: string,
  sha?: string
) {
  const { data } = await octokit.repos.createOrUpdateFileContents({
    owner,
    repo,
    path,
    message,
    content: Buffer.from(content).toString('base64'),
    sha,
  });

  return data;
}

export async function createCommit(
  octokit: Octokit,
  owner: string,
  repo: string,
  files: Array<{ path: string; content: string }>,
  message: string
) {
  // 1. Obter referência atual do branch main
  const { data: ref } = await octokit.git.getRef({
    owner,
    repo,
    ref: 'heads/main',
  });

  const latestCommitSha = ref.object.sha;

  // 2. Obter tree do commit atual
  const { data: commit } = await octokit.git.getCommit({
    owner,
    repo,
    commit_sha: latestCommitSha,
  });

  // 3. Criar blobs para cada arquivo
  const blobs = await Promise.all(
    files.map(async (file) => {
      const { data: blob } = await octokit.git.createBlob({
        owner,
        repo,
        content: Buffer.from(file.content).toString('base64'),
        encoding: 'base64',
      });
      return { path: file.path, sha: blob.sha };
    })
  );

  // 4. Criar nova tree
  const { data: tree } = await octokit.git.createTree({
    owner,
    repo,
    base_tree: commit.tree.sha,
    tree: blobs.map((blob) => ({
      path: blob.path,
      mode: '100644',
      type: 'blob',
      sha: blob.sha,
    })),
  });

  // 5. Criar commit
  const { data: newCommit } = await octokit.git.createCommit({
    owner,
    repo,
    message,
    tree: tree.sha,
    parents: [latestCommitSha],
  });

  // 6. Atualizar referência
  await octokit.git.updateRef({
    owner,
    repo,
    ref: 'heads/main',
    sha: newCommit.sha,
  });

  return newCommit;
}
```

### 2.4 Variáveis de Ambiente

```env
GITHUB_CLIENT_ID=Iv1.xxxxx
GITHUB_CLIENT_SECRET=xxxxx
GITHUB_APP_ID=123456
GITHUB_APP_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\n..."
GITHUB_WEBHOOK_SECRET=xxxxx
```

---

## 3. Vercel API

### 3.1 OAuth Setup

**Criar Integration em:** https://vercel.com/account/integrations

**Configurações:**
- **Name**: True Coding
- **Redirect URL**: https://truecoding.app/api/auth/vercel/callback
- **Scopes**: `deployments:read`, `deployments:write`, `projects:read`, `projects:write`

### 3.2 OAuth Flow

```typescript
// src/lib/vercel/oauth.ts

const VERCEL_CLIENT_ID = process.env.VERCEL_CLIENT_ID!;
const VERCEL_CLIENT_SECRET = process.env.VERCEL_CLIENT_SECRET!;

export function getAuthorizationUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: VERCEL_CLIENT_ID,
    redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/vercel/callback`,
    state,
  });

  return `https://vercel.com/integrations/${VERCEL_CLIENT_ID}/new?${params}`;
}

export async function exchangeCodeForToken(code: string): Promise<{
  access_token: string;
  token_type: string;
  team_id?: string;
}> {
  const response = await fetch('https://api.vercel.com/v2/oauth/access_token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: VERCEL_CLIENT_ID,
      client_secret: VERCEL_CLIENT_SECRET,
      code,
      redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/vercel/callback`,
    }),
  });

  return response.json();
}
```

### 3.3 Cliente Vercel

```typescript
// src/lib/vercel/client.ts

const VERCEL_API_URL = 'https://api.vercel.com';

export class VercelClient {
  constructor(
    private accessToken: string,
    private teamId?: string
  ) {}

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = new URL(endpoint, VERCEL_API_URL);
    if (this.teamId) {
      url.searchParams.set('teamId', this.teamId);
    }

    const response = await fetch(url.toString(), {
      ...options,
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`Vercel API error: ${response.status}`);
    }

    return response.json();
  }

  // Criar projeto a partir de repositório GitHub
  async createProject(
    name: string,
    repoUrl: string,
    framework: string = 'nextjs'
  ) {
    // Extrair owner e repo da URL
    const match = repoUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
    if (!match) throw new Error('Invalid GitHub URL');

    const [, owner, repo] = match;

    return this.request<{ id: string; name: string }>('/v9/projects', {
      method: 'POST',
      body: JSON.stringify({
        name,
        framework,
        gitRepository: {
          type: 'github',
          repo: `${owner}/${repo}`,
        },
        buildCommand: 'npm run build',
        outputDirectory: '.next',
        installCommand: 'npm ci',
      }),
    });
  }

  // Configurar variáveis de ambiente
  async setEnvironmentVariables(
    projectId: string,
    variables: Array<{
      key: string;
      value: string;
      target: ('production' | 'preview' | 'development')[];
      type?: 'plain' | 'encrypted' | 'secret';
    }>
  ) {
    return this.request(`/v10/projects/${projectId}/env`, {
      method: 'POST',
      body: JSON.stringify(variables),
    });
  }

  // Trigger deployment
  async createDeployment(projectId: string, ref: string = 'main') {
    return this.request<{
      id: string;
      url: string;
      readyState: string;
    }>('/v13/deployments', {
      method: 'POST',
      body: JSON.stringify({
        name: projectId,
        project: projectId,
        target: 'production',
        gitSource: {
          type: 'github',
          ref,
        },
      }),
    });
  }

  // Obter status do deployment
  async getDeployment(deploymentId: string) {
    return this.request<{
      id: string;
      url: string;
      readyState: 'QUEUED' | 'BUILDING' | 'READY' | 'ERROR' | 'CANCELED';
      error?: { code: string; message: string };
    }>(`/v13/deployments/${deploymentId}`);
  }

  // Listar deployments
  async listDeployments(projectId: string, limit: number = 10) {
    return this.request<{
      deployments: Array<{
        id: string;
        url: string;
        readyState: string;
        createdAt: number;
      }>;
    }>(`/v6/deployments?projectId=${projectId}&limit=${limit}`);
  }

  // Stream de logs do deployment
  async getDeploymentLogs(deploymentId: string) {
    const url = new URL(`/v2/deployments/${deploymentId}/events`, VERCEL_API_URL);
    if (this.teamId) {
      url.searchParams.set('teamId', this.teamId);
    }

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
      },
    });

    return response.body;
  }
}
```

### 3.4 Variáveis de Ambiente

```env
VERCEL_CLIENT_ID=xxxxx
VERCEL_CLIENT_SECRET=xxxxx
```

---

## 4. Clerk (Autenticação)

### 4.1 Setup

**Criar aplicação em:** https://dashboard.clerk.com

### 4.2 Configuração Next.js

```typescript
// middleware.ts
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/project(.*)',
  '/api/projects(.*)',
  '/api/chat(.*)',
  '/api/generate(.*)',
  '/api/deploy(.*)',
]);

export default clerkMiddleware((auth, req) => {
  if (isProtectedRoute(req)) {
    auth().protect();
  }
});

export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
};
```

### 4.3 Webhook para Sync de Usuários

```typescript
// src/app/api/webhooks/clerk/route.ts
import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { WebhookEvent } from '@clerk/nextjs/server';
import { db } from '@/lib/db/prisma';

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    throw new Error('Missing CLERK_WEBHOOK_SECRET');
  }

  const headerPayload = headers();
  const svix_id = headerPayload.get('svix-id');
  const svix_timestamp = headerPayload.get('svix-timestamp');
  const svix_signature = headerPayload.get('svix-signature');

  const body = await req.text();

  const wh = new Webhook(WEBHOOK_SECRET);
  let evt: WebhookEvent;

  try {
    evt = wh.verify(body, {
      'svix-id': svix_id!,
      'svix-timestamp': svix_timestamp!,
      'svix-signature': svix_signature!,
    }) as WebhookEvent;
  } catch (err) {
    return new Response('Invalid signature', { status: 400 });
  }

  const eventType = evt.type;

  if (eventType === 'user.created') {
    const { id, email_addresses, first_name, last_name, image_url } = evt.data;

    await db.user.create({
      data: {
        clerkId: id,
        email: email_addresses[0].email_address,
        name: [first_name, last_name].filter(Boolean).join(' ') || null,
        avatarUrl: image_url,
      },
    });
  }

  if (eventType === 'user.updated') {
    const { id, email_addresses, first_name, last_name, image_url } = evt.data;

    await db.user.update({
      where: { clerkId: id },
      data: {
        email: email_addresses[0].email_address,
        name: [first_name, last_name].filter(Boolean).join(' ') || null,
        avatarUrl: image_url,
      },
    });
  }

  if (eventType === 'user.deleted') {
    const { id } = evt.data;

    await db.user.delete({
      where: { clerkId: id },
    });
  }

  return new Response('OK', { status: 200 });
}
```

### 4.4 Variáveis de Ambiente

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_xxx
CLERK_SECRET_KEY=sk_xxx
CLERK_WEBHOOK_SECRET=whsec_xxx
```

---

## 5. Neon (PostgreSQL)

### 5.1 Setup

**Criar banco em:** https://console.neon.tech

### 5.2 Configuração Prisma

```prisma
// prisma/schema.prisma

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```

### 5.3 Variáveis de Ambiente

```env
# Pooled connection (para app)
DATABASE_URL="postgresql://user:pass@ep-xxx.region.aws.neon.tech/dbname?sslmode=require"

# Direct connection (para migrations)
DIRECT_URL="postgresql://user:pass@ep-xxx.region.aws.neon.tech/dbname?sslmode=require"
```

---

## 6. Upstash (Redis)

### 6.1 Setup

**Criar banco em:** https://console.upstash.com

### 6.2 Cliente

```typescript
// src/lib/redis.ts

import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Rate limiting
export const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '1 m'),
  analytics: true,
});

// Cache helper
export async function cached<T>(
  key: string,
  ttlSeconds: number,
  fn: () => Promise<T>
): Promise<T> {
  const cached = await redis.get<T>(key);
  if (cached) return cached;

  const fresh = await fn();
  await redis.setex(key, ttlSeconds, fresh);
  return fresh;
}
```

### 6.3 Variáveis de Ambiente

```env
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=xxx
```

---

## 7. Resumo de Variáveis de Ambiente

```env
# App
NEXT_PUBLIC_APP_URL=https://truecoding.app

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_xxx
CLERK_SECRET_KEY=sk_xxx
CLERK_WEBHOOK_SECRET=whsec_xxx

# Database
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...

# Redis
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=xxx

# AI
ANTHROPIC_API_KEY=sk-ant-xxx

# GitHub
GITHUB_CLIENT_ID=xxx
GITHUB_CLIENT_SECRET=xxx
GITHUB_APP_ID=xxx
GITHUB_APP_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\n..."
GITHUB_WEBHOOK_SECRET=xxx

# Vercel
VERCEL_CLIENT_ID=xxx
VERCEL_CLIENT_SECRET=xxx
```
