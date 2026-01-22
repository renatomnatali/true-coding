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
