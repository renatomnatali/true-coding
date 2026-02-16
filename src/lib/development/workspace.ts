import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { prisma } from '@/lib/db/prisma'
import { appendRunEvent } from './events'
import {
  loadBaseTemplates,
  type GeneratedFile as TemplateGeneratedFile,
  type TemplateContext,
} from '@/lib/codegen/templates'
import type { PlanSnapshot } from './types'
import {
  normalizeTechnicalPlan,
  resolveProjectName,
  resolveProjectDescription,
  type GeneratedWorkspaceFile,
  type RunContext,
} from './plan-snapshot'

const COMMIT_ARTIFACT_EXCLUDED_DIRS = new Set([
  'node_modules',
  '.next',
  '.git',
  '.turbo',
  'coverage',
  'dist',
])

export function sanitizeWorkspacePath(filePath: string): string {
  const normalized = filePath.trim().replace(/\/+/g, '/').replace(/^\.\//, '')

  if (!normalized || normalized.startsWith('/') || normalized.includes('..') || normalized.includes('\0')) {
    throw new Error(`INVALID_WORKSPACE_PATH:${filePath}`)
  }

  return normalized
}

function isGeneratedWorkspaceFileLike(value: unknown): value is GeneratedWorkspaceFile {
  if (!value || typeof value !== 'object') return false
  const file = value as Partial<GeneratedWorkspaceFile>
  return typeof file.path === 'string' && typeof file.content === 'string'
}

export function mergeWorkspaceFiles(batches: GeneratedWorkspaceFile[][]): GeneratedWorkspaceFile[] {
  const byPath = new Map<string, GeneratedWorkspaceFile>()

  for (const batch of batches) {
    for (const file of batch) {
      const safePath = sanitizeWorkspacePath(file.path)
      byPath.set(safePath, {
        path: safePath,
        content: file.content,
      })
    }
  }

  return [...byPath.values()]
}

export function __extractGeneratedFilesFromAgentOutput(output: unknown): GeneratedWorkspaceFile[] {
  if (!output || typeof output !== 'object') return []

  const candidate = output as { files?: unknown }
  if (!Array.isArray(candidate.files)) return []

  return candidate.files
    .map((file) => {
      if (!isGeneratedWorkspaceFileLike(file)) return null
      return {
        path: sanitizeWorkspacePath(file.path),
        content: file.content,
      }
    })
    .filter((file): file is GeneratedWorkspaceFile => file !== null)
}

function buildFallbackBootstrapFiles(snapshot: PlanSnapshot): GeneratedWorkspaceFile[] {
  const projectSlug = resolveProjectName(snapshot)
    .trim()
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || 'true-coding-app'

  const packageJson = {
    name: projectSlug,
    version: '0.1.0',
    private: true,
    scripts: {
      build: 'next build',
      test: 'vitest run',
    },
    dependencies: {
      next: '^15.0.0',
      react: '^19.0.0',
      'react-dom': '^19.0.0',
    },
    devDependencies: {
      vitest: '^3.0.0',
      typescript: '^5.7.0',
      '@types/node': '^22.0.0',
      '@types/react': '^19.0.0',
      '@types/react-dom': '^19.0.0',
      '@testing-library/dom': '^10.0.0',
      '@testing-library/react': '^16.0.0',
      '@testing-library/jest-dom': '^6.6.0',
    },
  }

  return [
    {
      path: 'package.json',
      content: JSON.stringify(packageJson, null, 2),
    },
    {
      path: 'tsconfig.json',
      content: JSON.stringify(
        {
          compilerOptions: {
            target: 'ES2020',
            lib: ['dom', 'dom.iterable', 'esnext'],
            strict: true,
            noEmit: true,
            module: 'esnext',
            moduleResolution: 'bundler',
            resolveJsonModule: true,
            isolatedModules: true,
            jsx: 'preserve',
            incremental: true,
            plugins: [{ name: 'next' }],
          },
          include: ['next-env.d.ts', '**/*.ts', '**/*.tsx'],
          exclude: ['node_modules'],
        },
        null,
        2
      ),
    },
    {
      path: 'next.config.ts',
      content: [
        "import type { NextConfig } from 'next'",
        '',
        'const nextConfig: NextConfig = {}',
        '',
        'export default nextConfig',
      ].join('\n'),
    },
    {
      path: 'vitest.config.ts',
      content: [
        "import { defineConfig } from 'vitest/config'",
        '',
        'export default defineConfig({',
        '  test: {',
        "    environment: 'node',",
        '  },',
        '})',
      ].join('\n'),
    },
    {
      path: 'src/app/layout.tsx',
      content: [
        "import type { ReactNode } from 'react'",
        '',
        'export default function RootLayout({ children }: { children: ReactNode }) {',
        '  return (',
        "    <html lang=\"pt-BR\">",
        '      <body>{children}</body>',
        '    </html>',
        '  )',
        '}',
      ].join('\n'),
    },
    {
      path: 'src/app/page.tsx',
      content: [
        'export default function HomePage() {',
        '  return (',
        "    <main style={{ padding: 24, fontFamily: 'sans-serif' }}>",
        '      <h1>Aplicação gerada pelo True Coding</h1>',
        '      <p>Bootstrap de fallback aplicado para execução dos quality gates.</p>',
        '    </main>',
        '  )',
        '}',
      ].join('\n'),
    },
  ]
}

export function __getFallbackBootstrapFilesForTest(snapshot: PlanSnapshot): GeneratedWorkspaceFile[] {
  return buildFallbackBootstrapFiles(snapshot)
}

async function collectWorkspaceArtifactsRecursive(
  workspaceRoot: string,
  currentRelativePath: string,
  output: GeneratedWorkspaceFile[]
) {
  const absoluteCurrentPath = path.join(workspaceRoot, currentRelativePath)
  const entries = await fs.readdir(absoluteCurrentPath, { withFileTypes: true })
  const sortedEntries = [...entries].sort((a, b) => a.name.localeCompare(b.name))

  for (const entry of sortedEntries) {
    const relativePath = currentRelativePath
      ? `${currentRelativePath}/${entry.name}`
      : entry.name

    if (entry.isDirectory()) {
      if (COMMIT_ARTIFACT_EXCLUDED_DIRS.has(entry.name)) {
        continue
      }

      await collectWorkspaceArtifactsRecursive(workspaceRoot, relativePath, output)
      continue
    }

    if (!entry.isFile()) {
      continue
    }

    const safePath = sanitizeWorkspacePath(relativePath)
    const absolutePath = path.join(workspaceRoot, safePath)
    const content = await fs.readFile(absolutePath, 'utf-8')
    output.push({ path: safePath, content })
  }
}

export async function __collectWorkspaceArtifactsForCommit(
  workspacePath: string
): Promise<GeneratedWorkspaceFile[]> {
  const workspaceRoot = path.resolve(workspacePath)
  const artifacts: GeneratedWorkspaceFile[] = []

  await collectWorkspaceArtifactsRecursive(workspaceRoot, '', artifacts)
  return artifacts
}

export async function writeWorkspaceFiles(
  workspacePath: string,
  files: GeneratedWorkspaceFile[]
) {
  const workspaceRoot = path.resolve(workspacePath)
  for (const file of files) {
    const safePath = sanitizeWorkspacePath(file.path)
    const absolutePath = path.resolve(workspaceRoot, safePath)

    if (!absolutePath.startsWith(`${workspaceRoot}${path.sep}`) && absolutePath !== workspaceRoot) {
      throw new Error(`WORKSPACE_PATH_ESCAPE:${file.path}`)
    }

    await fs.mkdir(path.dirname(absolutePath), { recursive: true })
    await fs.writeFile(absolutePath, file.content, 'utf-8')
  }
}

async function hasWorkspacePackage(workspacePath: string): Promise<boolean> {
  try {
    await fs.access(path.join(workspacePath, 'package.json'))
    return true
  } catch {
    return false
  }
}

function buildTemplateContext(snapshot: PlanSnapshot): TemplateContext {
  const technical = normalizeTechnicalPlan(snapshot)

  const entities = (technical.dataModel?.entities ?? [])
    .filter((entity) => typeof entity.name === 'string' && entity.name.length > 0)
    .map((entity) => ({
      name: entity.name as string,
      fields: (entity.fields ?? [])
        .filter((field) => typeof field.name === 'string' && typeof field.type === 'string')
        .map((field) => ({
          name: field.name as string,
          type: field.type as string,
          required: Boolean(field.required),
          unique: Boolean(field.unique),
          default: typeof field.default === 'string' ? field.default : undefined,
        })),
    }))

  const pages = (technical.pages ?? [])
    .filter((page) => typeof page.path === 'string' && typeof page.name === 'string')
    .map((page) => ({
      path: page.path as string,
      name: page.name as string,
      components: Array.isArray(page.components) ? page.components : [],
    }))

  const components = (technical.components ?? [])
    .filter((component) => typeof component.name === 'string')
    .map((component) => ({
      name: component.name as string,
      description:
        typeof component.description === 'string'
          ? component.description
          : `Componente ${component.name as string}`,
      props:
        component.props && typeof component.props === 'object'
          ? component.props
          : {},
    }))

  const hasDatabase = Boolean(technical.database?.prismaSchema) || entities.length > 0
  const hasAuth = Array.isArray(technical.security?.authentication) && technical.security.authentication.length > 0

  return {
    projectName: resolveProjectName(snapshot),
    projectSlug: resolveProjectName(snapshot)
      .trim()
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_]+/g, '-'),
    description: resolveProjectDescription(snapshot),
    features: pages.map((page) => page.name),
    hasDatabase,
    hasAuth,
    entities,
    pages,
    components,
  }
}

export async function ensureWorkspaceBootstrap(runContext: RunContext) {
  const packageExists = await hasWorkspacePackage(runContext.sandboxPath)
  if (packageExists) return

  const templateContext = buildTemplateContext(runContext.snapshot)
  const baseFiles = await loadBaseTemplates(templateContext)
  const mandatoryFiles: GeneratedWorkspaceFile[] = [
    {
      path: 'next-env.d.ts',
      content: [
        '/// <reference types="next" />',
        '/// <reference types="next/image-types/global" />',
        '',
        '// Arquivo obrigatório para build TypeScript do Next.js.',
      ].join('\n'),
    },
  ]

  await writeWorkspaceFiles(
    runContext.sandboxPath,
    [
      ...baseFiles.map((file: TemplateGeneratedFile) => ({
        path: file.path,
        content: file.content,
      })),
      ...mandatoryFiles,
    ]
  )

  await appendRunEvent({
    runId: runContext.runId,
    eventType: 'INFO',
    message: 'Workspace bootstrap generated',
    payload: {
      files: baseFiles.length,
    },
  })

  const packageReadyAfterTemplates = await hasWorkspacePackage(runContext.sandboxPath)
  if (packageReadyAfterTemplates) return

  const fallbackFiles = buildFallbackBootstrapFiles(runContext.snapshot)
  await writeWorkspaceFiles(runContext.sandboxPath, fallbackFiles)

  await appendRunEvent({
    runId: runContext.runId,
    eventType: 'INFO',
    message: 'Workspace bootstrap fallback applied',
    payload: {
      files: fallbackFiles.length,
      reason: 'package_json_missing_after_template_bootstrap',
    },
  })
}

export async function ensureSandbox(runId: string, existingPath?: string | null) {
  if (existingPath) {
    return existingPath
  }

  const sandboxPath = await fs.mkdtemp(path.join(os.tmpdir(), `true-coding-run-${runId}-`))
  await prisma.developmentRun.update({
    where: { id: runId },
    data: { workerSandboxPath: sandboxPath },
  })

  await appendRunEvent({
    runId,
    eventType: 'INFO',
    message: 'Worker sandbox initialized',
    payload: { sandboxPath },
  })

  return sandboxPath
}

export async function cleanupSandbox(runId: string) {
  const run = await prisma.developmentRun.findUnique({
    where: { id: runId },
    select: { workerSandboxPath: true },
  })

  if (!run?.workerSandboxPath) return

  await fs.rm(run.workerSandboxPath, { recursive: true, force: true }).catch(() => undefined)

  await prisma.developmentRun.update({
    where: { id: runId },
    data: { workerSandboxPath: null },
  })
}
