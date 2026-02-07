# True Coding - Templates de Código

## 1. Visão Geral

Templates base usados para gerar projetos. Localizados em `/templates/nextjs-basic/`.

## 2. Estrutura de Templates

```
templates/
└── nextjs-basic/
    ├── package.json.hbs
    ├── tsconfig.json
    ├── next.config.ts
    ├── tailwind.config.ts
    ├── postcss.config.mjs
    ├── eslint.config.mjs
    ├── vitest.config.ts
    ├── .gitignore
    ├── .env.example.hbs
    ├── .github/
    │   └── workflows/
    │       └── ci.yml
    ├── prisma/
    │   └── schema.prisma.hbs
    └── src/
        ├── app/
        │   ├── layout.tsx.hbs
        │   ├── page.tsx.hbs
        │   ├── globals.css
        │   └── api/
        │       └── health/
        │           └── route.ts
        ├── components/
        │   └── ui/
        │       └── (shadcn components)
        ├── lib/
        │   ├── utils.ts
        │   └── db.ts.hbs
        └── test/
            └── setup.ts
```

## 3. Sistema de Templates

### 3.1 Engine: Handlebars

```typescript
// src/lib/codegen/templates.ts

import Handlebars from 'handlebars';
import fs from 'fs/promises';
import path from 'path';

export interface TemplateContext {
  projectName: string;
  projectSlug: string;
  description: string;
  features: string[];
  hasDatabase: boolean;
  hasAuth: boolean;
  entities: Entity[];
  pages: Page[];
  components: Component[];
}

export async function loadTemplate(templatePath: string): Promise<string> {
  const fullPath = path.join(process.cwd(), 'templates', templatePath);
  return fs.readFile(fullPath, 'utf-8');
}

export function renderTemplate(template: string, context: TemplateContext): string {
  const compiled = Handlebars.compile(template);
  return compiled(context);
}

export async function loadAndRenderTemplate(
  templatePath: string,
  context: TemplateContext
): Promise<string> {
  const template = await loadTemplate(templatePath);
  return renderTemplate(template, context);
}
```

### 3.2 Helpers Handlebars

```typescript
// src/lib/codegen/helpers.ts

import Handlebars from 'handlebars';

// Converte para PascalCase
Handlebars.registerHelper('pascalCase', (str: string) => {
  return str
    .split(/[-_\s]+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('');
});

// Converte para camelCase
Handlebars.registerHelper('camelCase', (str: string) => {
  const pascal = Handlebars.helpers.pascalCase(str);
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
});

// Converte para kebab-case
Handlebars.registerHelper('kebabCase', (str: string) => {
  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase();
});

// Condicional de igualdade
Handlebars.registerHelper('eq', (a, b) => a === b);

// Condicional de inclusão em array
Handlebars.registerHelper('includes', (arr: string[], value: string) => {
  return arr?.includes(value) ?? false;
});
```

## 4. Templates Base

### 4.1 package.json.hbs

```json
{
  "name": "{{kebabCase projectName}}",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "next": "^15.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "tailwindcss": "^4.0.0",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.5.0",
    "lucide-react": "^0.460.0"
    {{#if hasDatabase}}
    ,"@prisma/client": "^6.0.0"
    {{/if}}
    {{#if hasAuth}}
    ,"@clerk/nextjs": "^6.0.0"
    {{/if}}
  },
  "devDependencies": {
    "@types/node": "^22.0.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "typescript": "^5.7.0",
    "eslint": "^9.0.0",
    "eslint-config-next": "^15.0.0",
    "vitest": "^4.0.0",
    "@vitejs/plugin-react": "^4.3.0",
    "jsdom": "^25.0.0",
    "@testing-library/react": "^16.0.0",
    "@testing-library/dom": "^10.0.0",
    "@tailwindcss/postcss": "^4.0.0"
    {{#if hasDatabase}}
    ,"prisma": "^6.0.0"
    {{/if}}
  }
}
```

### 4.2 src/app/layout.tsx.hbs

```tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
{{#if hasAuth}}
import { ClerkProvider } from "@clerk/nextjs";
{{/if}}

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "{{projectName}}",
  description: "{{description}}",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    {{#if hasAuth}}
    <ClerkProvider>
    {{/if}}
      <html lang="pt-BR">
        <body className={inter.className}>{children}</body>
      </html>
    {{#if hasAuth}}
    </ClerkProvider>
    {{/if}}
  );
}
```

### 4.3 src/app/page.tsx.hbs

```tsx
export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold mb-4">{{projectName}}</h1>
      <p className="text-muted-foreground text-center max-w-md">
        {{description}}
      </p>
    </main>
  );
}
```

### 4.4 .github/workflows/ci.yml

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

concurrency:
  group: $\{{ github.workflow }}-$\{{ github.ref }}
  cancel-in-progress: true

jobs:
  lint-and-test:
    name: Lint & Test
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Lint
        run: npm run lint

      - name: Test
        run: npm test

      - name: Build
        run: npm run build
```

### 4.5 prisma/schema.prisma.hbs

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

{{#each entities}}
model {{pascalCase name}} {
  id        String   @id @default(cuid())
  {{#each fields}}
  {{camelCase name}}  {{type}}{{#if required}}{{else}}?{{/if}}{{#if unique}} @unique{{/if}}{{#if default}} @default({{default}}){{/if}}
  {{/each}}
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("{{kebabCase name}}s")
}

{{/each}}
```

### 4.6 .env.example.hbs

```env
# App
NEXT_PUBLIC_APP_URL=http://localhost:3000

{{#if hasDatabase}}
# Database (Neon)
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."
{{/if}}

{{#if hasAuth}}
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
{{/if}}
```

### 4.7 vitest.config.ts

```typescript
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
```

### 4.8 src/lib/utils.ts

```typescript
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

### 4.9 src/lib/db.ts.hbs

```typescript
{{#if hasDatabase}}
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query"] : [],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
{{else}}
// Database not configured for this project
export const db = null;
{{/if}}
```

## 5. Geração Dinâmica via AI

### 5.1 Arquivos Gerados por AI

Estes arquivos são gerados dinamicamente pela AI baseado no TechnicalPlan:

| Tipo | Arquivos |
|------|----------|
| Páginas | `src/app/**/page.tsx` |
| Componentes | `src/components/**/*.tsx` |
| API Routes | `src/app/api/**/*.ts` |
| Hooks | `src/hooks/*.ts` |
| Types | `src/types/*.ts` |
| Testes | `**/*.test.tsx` |

### 5.2 Prompt para Geração de Página

```typescript
export function getPageGenerationPrompt(page: Page, context: TemplateContext): string {
  return `
Gere o componente de página para:

Path: ${page.path}
Nome: ${page.name}
Descrição: ${page.description}
Componentes filhos: ${page.components.join(', ')}
Data Fetching: ${page.dataFetching}

Contexto do projeto:
- Nome: ${context.projectName}
- Features: ${context.features.join(', ')}

Regras:
1. Use Server Components por padrão
2. Use 'use client' apenas se necessário
3. Inclua metadata para SEO
4. Use componentes de ${page.components.join(', ')}
5. Estilize com Tailwind CSS

Retorne apenas o código TypeScript/TSX, sem explicações.
`;
}
```

### 5.3 Prompt para Geração de Componente

```typescript
export function getComponentGenerationPrompt(
  component: Component,
  context: TemplateContext
): string {
  return `
Gere o componente React:

Nome: ${component.name}
Descrição: ${component.description}
Props: ${JSON.stringify(component.props)}

Regras:
1. TypeScript strict
2. Interface para props
3. Export nomeado
4. Tailwind CSS para estilos
5. Acessibilidade (semantic HTML, ARIA)
6. Responsivo (mobile-first)

Retorne apenas o código TypeScript/TSX, sem explicações.
`;
}
```

### 5.4 Prompt para Geração de API Route

```typescript
export function getAPIRouteGenerationPrompt(
  endpoint: APIEndpoint,
  context: TemplateContext
): string {
  return `
Gere a API Route:

Method: ${endpoint.method}
Path: ${endpoint.path}
Descrição: ${endpoint.description}
Auth: ${endpoint.authentication ? 'Sim' : 'Não'}
Request: ${JSON.stringify(endpoint.requestBody)}
Response: ${JSON.stringify(endpoint.responseBody)}

Regras:
1. Use Next.js App Router (route.ts)
2. Valide input com Zod
3. Trate erros com try/catch
4. Retorne NextResponse.json()
5. Use status codes apropriados
${endpoint.authentication ? '6. Verifique autenticação com Clerk' : ''}

Retorne apenas o código TypeScript, sem explicações.
`;
}
```

## 6. Pipeline de Geração

```typescript
// src/lib/codegen/pipeline.ts

export async function generateProjectFiles(
  project: Project
): Promise<GeneratedFile[]> {
  const context = buildTemplateContext(project);
  const files: GeneratedFile[] = [];

  // 1. Arquivos estáticos (templates)
  const staticFiles = await loadStaticTemplates(context);
  files.push(...staticFiles);

  // 2. package.json
  const packageJson = await loadAndRenderTemplate(
    'nextjs-basic/package.json.hbs',
    context
  );
  files.push({ path: 'package.json', content: packageJson });

  // 3. Prisma schema (se tiver database)
  if (context.hasDatabase) {
    const prismaSchema = await loadAndRenderTemplate(
      'nextjs-basic/prisma/schema.prisma.hbs',
      context
    );
    files.push({ path: 'prisma/schema.prisma', content: prismaSchema });
  }

  // 4. Layout e página inicial
  const layout = await loadAndRenderTemplate(
    'nextjs-basic/src/app/layout.tsx.hbs',
    context
  );
  files.push({ path: 'src/app/layout.tsx', content: layout });

  // 5. Páginas customizadas (via AI)
  for (const page of project.technicalPlan.pages) {
    const pageCode = await generatePageWithAI(page, context);
    files.push({
      path: `src/app${page.path}/page.tsx`,
      content: pageCode,
    });
  }

  // 6. Componentes customizados (via AI)
  for (const component of project.technicalPlan.components) {
    const componentCode = await generateComponentWithAI(component, context);
    files.push({
      path: `src/components/${kebabCase(component.name)}.tsx`,
      content: componentCode,
    });

    // Teste do componente
    const testCode = await generateTestWithAI(component, context);
    files.push({
      path: `src/components/${kebabCase(component.name)}.test.tsx`,
      content: testCode,
    });
  }

  // 7. API Routes (via AI)
  for (const endpoint of project.technicalPlan.apiEndpoints) {
    const routeCode = await generateAPIRouteWithAI(endpoint, context);
    const routePath = endpoint.path.replace(/\{(\w+)\}/g, '[$1]');
    files.push({
      path: `src/app/api${routePath}/route.ts`,
      content: routeCode,
    });
  }

  return files;
}
```

## 7. Validação de Código

```typescript
// src/lib/codegen/validator.ts

import ts from 'typescript';

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

export interface ValidationError {
  file: string;
  line?: number;
  message: string;
}

export async function validateGeneratedFiles(
  files: GeneratedFile[]
): Promise<ValidationResult> {
  const errors: ValidationError[] = [];

  for (const file of files) {
    // Validar apenas arquivos TypeScript/TSX
    if (!file.path.match(/\.(ts|tsx)$/)) continue;

    // Parse AST
    const sourceFile = ts.createSourceFile(
      file.path,
      file.content,
      ts.ScriptTarget.Latest,
      true,
      file.path.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS
    );

    // Coletar erros de sintaxe
    const syntaxErrors = collectSyntaxErrors(sourceFile);
    errors.push(...syntaxErrors.map(e => ({
      file: file.path,
      line: e.line,
      message: e.message,
    })));
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

function collectSyntaxErrors(sourceFile: ts.SourceFile): Array<{
  line: number;
  message: string;
}> {
  const errors: Array<{ line: number; message: string }> = [];

  // TypeScript reporta erros de parse automaticamente
  // Aqui podemos adicionar validações customizadas

  return errors;
}
```

## 8. Exemplo de Projeto Gerado

Para um projeto "Verificador de Placas", os arquivos gerados seriam:

```
verificador-placas/
├── package.json
├── tsconfig.json
├── next.config.ts
├── tailwind.config.ts
├── vitest.config.ts
├── .gitignore
├── .env.example
├── .github/
│   └── workflows/
│       └── ci.yml
├── prisma/
│   └── schema.prisma          # Com modelo Vehicle
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx           # Com SearchForm
│   │   ├── globals.css
│   │   ├── resultado/
│   │   │   └── [placa]/
│   │   │       └── page.tsx   # Exibe dados do veículo
│   │   └── api/
│   │       ├── health/
│   │       │   └── route.ts
│   │       └── vehicles/
│   │           └── [plate]/
│   │               └── route.ts
│   ├── components/
│   │   ├── search-form.tsx
│   │   ├── search-form.test.tsx
│   │   ├── vehicle-card.tsx
│   │   ├── vehicle-card.test.tsx
│   │   └── ui/
│   │       └── ...
│   ├── lib/
│   │   ├── utils.ts
│   │   └── db.ts
│   ├── types/
│   │   └── vehicle.ts
│   └── test/
│       └── setup.ts
└── README.md
```
