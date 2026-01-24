# Knowledge Base - Problemas Comuns

Este documento registra problemas comuns encontrados durante o desenvolvimento e suas solucoes.

## Next.js

### `next lint` deprecado (Next.js 16+)

**Problema:**
```
`next lint` is deprecated and will be removed in Next.js 16.
For new projects, use create-next-app to choose your preferred linter.
For existing projects, migrate to the ESLint CLI:
npx @next/codemod@canary next-lint-to-eslint-cli .
```

**Solucao:**
Migrar para ESLint CLI direto:
```bash
npx @next/codemod@canary next-lint-to-eslint-cli .
```

Ou atualizar o script de lint no package.json:
```json
{
  "scripts": {
    "lint": "eslint . --ext .js,.jsx,.ts,.tsx"
  }
}
```

---

## Prisma

### Tipo JSON em updates

**Problema:**
```
Type 'Record<string, unknown>' is not assignable to type 'NullableJsonNullValueInput | InputJsonValue | undefined'.
```

**Solucao:**
Usar `Prisma.JsonObject` ou `Prisma.InputJsonValue`:
```typescript
import { Prisma } from '@prisma/client'

await prisma.project.update({
  data: {
    jsonField: data as unknown as Prisma.JsonObject,
  },
})
```

---

## Clerk

### useSession can only be used within ClerkProvider

**Problema:**
```
Runtime Error
useSession can only be used within the <ClerkProvider /> component.
```

Componentes Clerk (SignIn, SignUp) falham quando as chaves nao estao configuradas.

**Solucao:**
1. Criar componente `ClerkGuard` que verifica se a chave esta configurada
2. Exibir mensagem util ao inves de erro

```typescript
// src/components/clerk-guard.tsx
'use client'

export function ClerkGuard({ children }: { children: React.ReactNode }) {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY

  if (!publishableKey || publishableKey.startsWith('pk_test_dummy')) {
    return (
      <div>Clerk not configured. Add keys to .env.local</div>
    )
  }

  return <>{children}</>
}

// Usage in pages
<ClerkGuard>
  <SignUp />
</ClerkGuard>
```

---

### Build falha com chave dummy

**Problema:**
Clerk valida a chave no build e falha com valores dummy.

**Solucao:**
Criar wrapper condicional no layout:
```typescript
function ClerkWrapper({ children }: { children: React.ReactNode }) {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
  if (!publishableKey || publishableKey.startsWith('pk_test_dummy')) {
    return <>{children}</>
  }
  return <ClerkProvider>{children}</ClerkProvider>
}
```

---

## CI/CD

### Merge commits falhando validacao de commit

**Problema:**
GitHub cria merge commits que nao seguem a convencao de commits.

**Solucao:**
Usar `--no-merges` no git log:
```yaml
- name: Validate commit messages
  run: |
    COMMITS=$(git log origin/main..HEAD --pretty=format:"%s" --no-merges)
    # ... validacao
```

---

## API Clients

### Validar env vars antes de instanciar clientes

**Problema:**
Clientes de API instanciados sem validacao de env vars causam erros cripticos em runtime.

**Solucao:**
Usar factory function com validacao:
```typescript
function getAnthropicClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY environment variable is required')
  }
  return new Anthropic({ apiKey })
}
```

---

## TypeScript

### Strict mode com JSON de API

**Problema:**
TypeScript reclama de tipos quando parseando JSON.

**Solucao:**
Criar tipos e usar type guards:
```typescript
function isBusinessPlan(obj: unknown): obj is BusinessPlan {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'name' in obj &&
    'coreFeatures' in obj
  )
}
```

### JsonValue para campos JSON do Prisma em React

**Problema:**
```
Type 'unknown' is not assignable to type 'ReactNode'.
```

Quando um campo JSON do Prisma (como `businessPlan`) e passado para componentes React.

**Solucao:**
Usar `JsonValue` do Prisma ao inves de `unknown`:
```typescript
import { JsonValue } from '@prisma/client/runtime/library'

interface Props {
  businessPlan: JsonValue | null
}
```

---

## GitHub CLI

### Exit code 8 no `gh pr checks`

**Problema:**
```
Exit code 8
build	pending	0	https://github.com/...
```

O comando `gh pr checks` retorna exit code 8.

**Solucao:**
Isso NAO e um erro. Exit code 8 significa que alguns checks ainda estao pendentes. E comportamento esperado quando o CI ainda esta rodando. Aguarde e execute novamente.

---

## Prisma

### Relacao `messages` vs `conversations`

**Problema:**
```
Type error: Property 'messages' does not exist on type 'ProjectInclude'.
```

**Solucao:**
No Prisma, relacoes sao acessadas pelo nome definido no schema. Se o modelo tem:
```prisma
model Project {
  conversations Conversation[]
}
```

Use `conversations` com include aninhado:
```typescript
await prisma.project.findUnique({
  include: {
    conversations: {
      include: {
        messages: true,
      },
    },
  },
})
```

---

## React/Radix UI

### Prop `asChild` nao existe no Button

**Problema:**
```
Type error: Property 'asChild' does not exist on type 'ButtonProps'.
```

O Button customizado nao suporta a prop `asChild` do Radix UI.

**Solucao:**
Ao inves de usar `<Button asChild>`, estilize o elemento diretamente:
```typescript
// Errado
<Button asChild>
  <Link href="/page">Click</Link>
</Button>

// Correto - usar classes do button diretamente no link
<Link
  href="/page"
  className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
>
  Click
</Link>
```

---

## Vitest

### Import `vi` nao utilizado

**Problema:**
```
Error: 'vi' is defined but never used.  @typescript-eslint/no-unused-vars
```

**Solucao:**
Remover o import `vi` se nao estiver sendo usado diretamente no arquivo de teste:
```typescript
// Errado
import { describe, it, expect, vi } from 'vitest'

// Correto (se vi nao e usado)
import { describe, it, expect } from 'vitest'
```

Note: `vi.mock()` e hoisted automaticamente, entao pode parecer que `vi` nao e usado mesmo quando ha mocks.

---

## Seguranca

### Path Traversal em arquivos gerados por AI

**Problema:**
AI pode gerar paths maliciosos como `../../../etc/passwd` ou `/etc/passwd`.

**Solucao:**
Validar e sanitizar todos os paths antes de usar:
```typescript
export function sanitizePath(path: string): string | null {
  if (!path || path.trim() === '') return null

  let normalized = path.trim()

  // Rejeitar paths absolutos
  if (normalized.startsWith('/') || /^[a-zA-Z]:/.test(normalized)) {
    return null
  }

  // Rejeitar path traversal
  if (normalized.includes('..')) {
    return null
  }

  // Rejeitar null byte injection
  if (normalized.includes('\0')) {
    return null
  }

  // Normalizar barras multiplas
  normalized = normalized.replace(/\/+/g, '/')

  // Remover ./ inicial
  if (normalized.startsWith('./')) {
    normalized = normalized.slice(2)
  }

  return normalized
}
```
