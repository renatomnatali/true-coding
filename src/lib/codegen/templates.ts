import Handlebars from 'handlebars'
import fs from 'fs/promises'
import path from 'path'

// Register helpers
Handlebars.registerHelper('pascalCase', (str: string) => {
  if (!str) return ''
  return str
    .split(/[-_\s]+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('')
})

Handlebars.registerHelper('camelCase', (str: string) => {
  if (!str) return ''
  const pascal = str
    .split(/[-_\s]+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('')
  return pascal.charAt(0).toLowerCase() + pascal.slice(1)
})

Handlebars.registerHelper('kebabCase', (str: string) => {
  if (!str) return ''
  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase()
})

Handlebars.registerHelper('eq', (a: unknown, b: unknown) => a === b)

Handlebars.registerHelper('includes', (arr: string[], value: string) => {
  return arr?.includes(value) ?? false
})

export interface TemplateContext {
  projectName: string
  projectSlug: string
  description: string
  features: string[]
  hasDatabase: boolean
  hasAuth: boolean
  entities: Array<{
    name: string
    fields: Array<{
      name: string
      type: string
      required: boolean
      unique?: boolean
      default?: string
    }>
  }>
  pages: Array<{
    path: string
    name: string
    components: string[]
  }>
  components: Array<{
    name: string
    description: string
    props: Record<string, string>
  }>
}

export async function loadTemplate(templatePath: string): Promise<string> {
  const fullPath = path.join(process.cwd(), 'templates', templatePath)
  return fs.readFile(fullPath, 'utf-8')
}

export function renderTemplate(
  template: string,
  context: TemplateContext
): string {
  const compiled = Handlebars.compile(template)
  return compiled(context)
}

export async function loadAndRenderTemplate(
  templatePath: string,
  context: TemplateContext
): Promise<string> {
  const template = await loadTemplate(templatePath)
  return renderTemplate(template, context)
}

export async function loadStaticFile(templatePath: string): Promise<string> {
  const fullPath = path.join(process.cwd(), 'templates', templatePath)
  return fs.readFile(fullPath, 'utf-8')
}

export interface GeneratedFile {
  path: string
  content: string
  description?: string
}

export async function loadBaseTemplates(
  context: TemplateContext
): Promise<GeneratedFile[]> {
  const files: GeneratedFile[] = []

  // Static files (no templating needed)
  const staticFiles = [
    { src: 'nextjs-basic/tsconfig.json', dest: 'tsconfig.json' },
    { src: 'nextjs-basic/next.config.ts', dest: 'next.config.ts' },
    { src: 'nextjs-basic/tailwind.config.ts', dest: 'tailwind.config.ts' },
    { src: 'nextjs-basic/postcss.config.mjs', dest: 'postcss.config.mjs' },
    { src: 'nextjs-basic/eslint.config.mjs', dest: 'eslint.config.mjs' },
    { src: 'nextjs-basic/vitest.config.ts', dest: 'vitest.config.ts' },
    { src: 'nextjs-basic/.gitignore', dest: '.gitignore' },
    {
      src: 'nextjs-basic/.github/workflows/ci.yml',
      dest: '.github/workflows/ci.yml',
    },
    {
      src: 'nextjs-basic/src/app/api/health/route.ts',
      dest: 'src/app/api/health/route.ts',
    },
    { src: 'nextjs-basic/src/lib/utils.ts', dest: 'src/lib/utils.ts' },
    { src: 'nextjs-basic/src/test/setup.ts', dest: 'src/test/setup.ts' },
    { src: 'nextjs-basic/src/app/globals.css', dest: 'src/app/globals.css' },
  ]

  for (const file of staticFiles) {
    try {
      const content = await loadStaticFile(file.src)
      files.push({ path: file.dest, content })
    } catch {
      // Skip if file doesn't exist
    }
  }

  // Templated files
  const templateFiles = [
    { src: 'nextjs-basic/package.json.hbs', dest: 'package.json' },
    { src: 'nextjs-basic/.env.example.hbs', dest: '.env.example' },
    { src: 'nextjs-basic/src/app/layout.tsx.hbs', dest: 'src/app/layout.tsx' },
    { src: 'nextjs-basic/src/app/page.tsx.hbs', dest: 'src/app/page.tsx' },
  ]

  for (const file of templateFiles) {
    try {
      const content = await loadAndRenderTemplate(file.src, context)
      files.push({ path: file.dest, content })
    } catch {
      // Skip if file doesn't exist
    }
  }

  // Database files (only if hasDatabase)
  if (context.hasDatabase) {
    try {
      const prismaSchema = await loadAndRenderTemplate(
        'nextjs-basic/prisma/schema.prisma.hbs',
        context
      )
      files.push({ path: 'prisma/schema.prisma', content: prismaSchema })

      const dbLib = await loadAndRenderTemplate(
        'nextjs-basic/src/lib/db.ts.hbs',
        context
      )
      files.push({ path: 'src/lib/db.ts', content: dbLib })
    } catch {
      // Skip if files don't exist
    }
  }

  return files
}

export function kebabCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase()
}
