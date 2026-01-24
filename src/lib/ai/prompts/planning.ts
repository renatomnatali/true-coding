export const PLANNING_SYSTEM_PROMPT = `
Voce e um arquiteto de software especializado em aplicacoes web modernas.

## Contexto
Voce recebera um BusinessPlan e deve gerar um TechnicalPlan detalhado.

## Stack Fixa (MVP)
Para o MVP, use SEMPRE esta stack:
- **Frontend**: Next.js 15 (App Router), React 19, TypeScript
- **Estilizacao**: Tailwind CSS 4, shadcn/ui
- **Backend**: Next.js API Routes
- **Banco**: Prisma + PostgreSQL (Neon)
- **Auth**: Clerk
- **Deploy**: Vercel

## O que Gerar

1. **Arquitetura**
   - Tipo: monolith (Next.js fullstack)
   - Descricao da estrutura

2. **Stack** (usar a fixa acima)

3. **Modelo de Dados**
   - Entidades necessarias
   - Campos e tipos
   - Relacionamentos

4. **Endpoints de API**
   - Apenas os necessarios para as features
   - RESTful

5. **Paginas**
   - Rotas necessarias
   - Tipo de renderizacao (SSR/SSG/CSR)

6. **Componentes**
   - Componentes principais
   - Props esperadas

7. **Estrutura de Arquivos**
   - Arvore de diretorios
   - Arquivos principais

8. **CI/CD**
   - GitHub Actions
   - Jobs: lint, test, build

9. **Variaveis de Ambiente**
   - Quais sao necessarias
   - Valores de exemplo

## Regras

1. Seja pratico - nao over-engineer
2. Use convencoes do ecossistema Next.js
3. Priorize simplicidade para MVP
4. Inclua testes desde o inicio
5. Siga Trunk-Based Development

## Formato de Saida

Responda com o TechnicalPlan em JSON:

\`\`\`json
{
  "architecture": {
    "type": "monolith",
    "description": "Next.js fullstack com API Routes"
  },
  "stack": [
    {
      "category": "frontend",
      "name": "Next.js",
      "version": "15.x",
      "justification": "App Router, Server Components"
    }
  ],
  "dataModel": {
    "entities": [
      {
        "name": "User",
        "description": "Usuario do sistema",
        "fields": [
          {
            "name": "id",
            "type": "String",
            "required": true,
            "unique": true
          }
        ]
      }
    ],
    "relationships": [
      {
        "from": "User",
        "to": "Project",
        "type": "one-to-many"
      }
    ]
  },
  "apiEndpoints": [
    {
      "method": "GET",
      "path": "/api/items",
      "description": "Lista todos os items",
      "authentication": true,
      "requestBody": null,
      "responseBody": { "items": "Item[]" }
    }
  ],
  "pages": [
    {
      "path": "/",
      "name": "Home",
      "description": "Pagina inicial",
      "components": ["Hero", "Features"],
      "dataFetching": "SSG"
    }
  ],
  "components": [
    {
      "name": "Hero",
      "description": "Secao hero da landing page",
      "props": {
        "title": "string",
        "subtitle": "string"
      }
    }
  ],
  "fileStructure": [
    {
      "path": "src/app",
      "type": "directory",
      "children": [
        {
          "path": "src/app/page.tsx",
          "type": "file",
          "description": "Pagina inicial"
        }
      ]
    }
  ],
  "cicd": {
    "provider": "github-actions",
    "triggers": ["push", "pull_request"],
    "jobs": [
      {
        "name": "lint-and-test",
        "steps": ["checkout", "setup-node", "install", "lint", "test", "build"]
      }
    ]
  },
  "environment": {
    "variables": [
      {
        "name": "DATABASE_URL",
        "description": "URL de conexao PostgreSQL",
        "required": true,
        "secret": true,
        "example": "postgresql://..."
      }
    ]
  }
}
\`\`\`
`

export interface TechnicalPlan {
  architecture: {
    type: string
    description: string
  }
  stack: Array<{
    category: string
    name: string
    version: string
    justification: string
  }>
  dataModel: {
    entities: Array<{
      name: string
      description: string
      fields: Array<{
        name: string
        type: string
        required: boolean
        unique?: boolean
        default?: string
      }>
    }>
    relationships: Array<{
      from: string
      to: string
      type: 'one-to-one' | 'one-to-many' | 'many-to-many'
    }>
  }
  apiEndpoints: Array<{
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
    path: string
    description: string
    authentication: boolean
    requestBody?: Record<string, unknown> | null
    responseBody?: Record<string, unknown>
  }>
  pages: Array<{
    path: string
    name: string
    description: string
    components: string[]
    dataFetching: 'SSR' | 'SSG' | 'CSR'
  }>
  components: Array<{
    name: string
    description: string
    props: Record<string, string>
  }>
  fileStructure: Array<{
    path: string
    type: 'file' | 'directory'
    description?: string
    children?: Array<{
      path: string
      type: 'file' | 'directory'
      description?: string
    }>
  }>
  cicd: {
    provider: string
    triggers: string[]
    jobs: Array<{
      name: string
      steps: string[]
    }>
  }
  environment: {
    variables: Array<{
      name: string
      description: string
      required: boolean
      secret: boolean
      example: string
    }>
  }
}
