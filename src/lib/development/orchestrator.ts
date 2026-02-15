import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { prisma } from '@/lib/db/prisma'
import { Prisma } from '@prisma/client'
import {
  runAssessmentAgent,
  runIterationPlannerAgent,
  runSpecAgent,
  runTestAgent,
  runCodeAgent,
  runReviewAgent,
  runReleaseAgent,
  runRecoveryAgent,
  runDeployAgent,
} from './agents'
import { appendRunEvent, getLatestRetryBoundarySequence, listRunEvents } from './events'
import { buildFailedGateSummary, extractPrimaryGateFailureDetail } from './gate-diagnostics'
import { runQualityGates } from './quality-gates'
import {
  isBabyStepModeEnabledFromEnv,
  shouldPauseForBabyStepCheckpoint,
} from './retry-strategy'
import { isRunActive, markRunActive, unmarkRunActive } from './worker-registry'
import { hashInput, TERMINAL_RUN_STATUSES, toBranchName } from './utils'
import type { AssessmentResult, IterationPlanItem } from '@/types/development'
import type { ApprovedDevelopmentPlan, GateRunOutput, PlanSnapshot } from './types'
import {
  loadBaseTemplates,
  type GeneratedFile as TemplateGeneratedFile,
  type TemplateContext,
} from '@/lib/codegen/templates'
import { executeIterationGitRelease } from './gitops'

const MAX_ITERATION_ATTEMPTS = 3

interface RunContext {
  runId: string
  projectId: string
  snapshot: PlanSnapshot
  sandboxPath: string
}

function isAssessmentResult(value: unknown): value is AssessmentResult {
  if (!value || typeof value !== 'object') return false

  const assessment = value as Partial<AssessmentResult>
  if (typeof assessment.complexityScore !== 'number') return false
  if (typeof assessment.recommendedIterations !== 'number') return false
  if (!['simple', 'medium', 'complex'].includes(String(assessment.complexityLevel))) return false
  if (!Array.isArray(assessment.factors)) return false

  return assessment.factors.every((factor) => (
    factor &&
    typeof factor === 'object' &&
    typeof factor.name === 'string' &&
    typeof factor.score === 'number' &&
    typeof factor.maxScore === 'number' &&
    typeof factor.detail === 'string'
  ))
}

function isIterationPlanItem(value: unknown): value is IterationPlanItem {
  if (!value || typeof value !== 'object') return false

  const iteration = value as Partial<IterationPlanItem>
  if (typeof iteration.index !== 'number') return false
  if (typeof iteration.name !== 'string') return false
  if (typeof iteration.slug !== 'string') return false
  if (typeof iteration.gherkinPath !== 'string') return false
  if (!iteration.scope || typeof iteration.scope !== 'object') return false

  const scope = iteration.scope as Partial<IterationPlanItem['scope']>
  return (
    Array.isArray(scope.goals) &&
    scope.goals.every((goal) => typeof goal === 'string') &&
    Array.isArray(scope.featureTags) &&
    scope.featureTags.every((tag) => typeof tag === 'string') &&
    Array.isArray(scope.risks) &&
    scope.risks.every((risk) => typeof risk === 'string')
  )
}

function getApprovedPlan(snapshot: PlanSnapshot): ApprovedDevelopmentPlan | null {
  if (!isAssessmentResult(snapshot.approvedAssessment)) {
    return null
  }

  if (
    !Array.isArray(snapshot.approvedIterations) ||
    snapshot.approvedIterations.length === 0 ||
    !snapshot.approvedIterations.every((iteration) => isIterationPlanItem(iteration))
  ) {
    return null
  }

  return {
    assessment: snapshot.approvedAssessment,
    iterations: snapshot.approvedIterations,
  }
}

interface TechnicalPlanLike {
  pages?: Array<{
    name?: string
    path?: string
    components?: string[]
  }>
  components?: Array<{
    name?: string
    description?: string
    props?: Record<string, string>
  }>
  dataModel?: {
    entities?: Array<{
      name?: string
      fields?: Array<{
        name?: string
        type?: string
        required?: boolean
        unique?: boolean
        default?: string
      }>
    }>
  }
  database?: {
    prismaSchema?: string
  }
  security?: {
    authentication?: string[]
  }
}

interface GeneratedWorkspaceFile {
  path: string
  content: string
}

const COMMIT_ARTIFACT_EXCLUDED_DIRS = new Set([
  'node_modules',
  '.next',
  '.git',
  '.turbo',
  'coverage',
  'dist',
])

function normalizeTechnicalPlan(snapshot: PlanSnapshot): TechnicalPlanLike {
  return (snapshot.technicalPlan ?? {}) as TechnicalPlanLike
}

function resolveProjectName(snapshot: PlanSnapshot): string {
  const nameFromSnapshot =
    typeof snapshot.projectName === 'string' && snapshot.projectName.trim().length > 0
      ? snapshot.projectName.trim()
      : null
  if (nameFromSnapshot) return nameFromSnapshot

  const businessPlan = snapshot.businessPlan
  if (businessPlan && typeof businessPlan === 'object') {
    const candidate = (businessPlan as { name?: unknown }).name
    if (typeof candidate === 'string' && candidate.trim().length > 0) {
      return candidate.trim()
    }
  }

  return 'True Coding App'
}

function resolveProjectDescription(snapshot: PlanSnapshot): string {
  const descriptionFromSnapshot =
    typeof snapshot.projectDescription === 'string' &&
    snapshot.projectDescription.trim().length > 0
      ? snapshot.projectDescription.trim()
      : null
  if (descriptionFromSnapshot) return descriptionFromSnapshot

  const businessPlan = snapshot.businessPlan
  if (businessPlan && typeof businessPlan === 'object') {
    const candidate = (businessPlan as { description?: unknown }).description
    if (typeof candidate === 'string' && candidate.trim().length > 0) {
      return candidate.trim()
    }
  }

  return 'Aplicação gerada automaticamente pelo pipeline autônomo.'
}

function sanitizeWorkspacePath(filePath: string): string {
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

function mergeWorkspaceFiles(batches: GeneratedWorkspaceFile[][]): GeneratedWorkspaceFile[] {
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

async function writeWorkspaceFiles(
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

async function ensureWorkspaceBootstrap(runContext: RunContext) {
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

async function ensureSandbox(runId: string, existingPath?: string | null) {
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

async function cleanupSandbox(runId: string) {
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

async function getRunSnapshot(runId: string): Promise<PlanSnapshot> {
  const run = await prisma.developmentRun.findUnique({
    where: { id: runId },
    select: { plansSnapshot: true },
  })

  const snapshot = (run?.plansSnapshot ?? {}) as Record<string, unknown>
  const baseSnapshot: PlanSnapshot = {
    businessPlan: snapshot.businessPlan ?? null,
    technicalPlan: snapshot.technicalPlan ?? null,
    uxPlan: snapshot.uxPlan ?? null,
    approvedAssessment: snapshot.approvedAssessment as PlanSnapshot['approvedAssessment'],
    approvedIterations: snapshot.approvedIterations as PlanSnapshot['approvedIterations'],
  }
  const approvedPlan = getApprovedPlan(baseSnapshot)

  return {
    ...baseSnapshot,
    approvedAssessment: approvedPlan?.assessment ?? null,
    approvedIterations: approvedPlan?.iterations ?? null,
  }
}

async function shouldStopRun(runId: string): Promise<boolean> {
  const run = await prisma.developmentRun.findUnique({
    where: { id: runId },
    select: { status: true },
  })

  if (!run) return true
  if (TERMINAL_RUN_STATUSES.has(run.status)) return true
  return run.status === 'WAITING_CHECKPOINT'
}

async function createAgentTask(input: {
  runId: string
  iterationId?: string
  agentName: string
  inputPayload: Record<string, unknown>
}) {
  const task = await prisma.agentTaskRun.create({
    data: {
      runId: input.runId,
      iterationId: input.iterationId,
      agentName: input.agentName,
      inputHash: hashInput(input.inputPayload),
      status: 'RUNNING',
      startedAt: new Date(),
    },
  })

  await appendRunEvent({
    runId: input.runId,
    iterationId: input.iterationId,
    eventType: 'AGENT_TASK',
    message: `${input.agentName} started`,
    payload: {
      taskId: task.id,
      agentName: input.agentName,
      status: 'RUNNING',
    },
  })

  return task
}

async function completeAgentTask(input: {
  runId: string
  iterationId?: string
  taskId: string
  agentName: string
  status: 'SUCCEEDED' | 'FAILED'
  output?: unknown
  tokenUsage?: number
  cost?: number
  errorMessage?: string
  startedAt: number
}) {
  const durationMs = Date.now() - input.startedAt

  await prisma.agentTaskRun.update({
    where: { id: input.taskId },
    data: {
      status: input.status,
      output:
        input.output && typeof input.output === 'object'
          ? (input.output as Prisma.JsonObject)
          : undefined,
      tokenUsage: input.tokenUsage,
      cost: input.cost,
      errorMessage: input.errorMessage,
      durationMs,
      finishedAt: new Date(),
    },
  })

  await appendRunEvent({
    runId: input.runId,
    iterationId: input.iterationId,
    eventType: 'AGENT_TASK',
    message: `${input.agentName} ${input.status.toLowerCase()}`,
    payload: {
      taskId: input.taskId,
      agentName: input.agentName,
      status: input.status,
      durationMs,
      ...(input.errorMessage ? { error: input.errorMessage } : {}),
    },
  })
}

async function executeAgent<TOutput extends object>(input: {
  runId: string
  iterationId?: string
  agentName: string
  payload: Record<string, unknown>
  run: () => Promise<{ output: TOutput; tokenUsage?: number; cost?: number }>
}) {
  const startedAt = Date.now()
  const task = await createAgentTask({
    runId: input.runId,
    iterationId: input.iterationId,
    agentName: input.agentName,
    inputPayload: input.payload,
  })

  try {
    const result = await input.run()

    await completeAgentTask({
      runId: input.runId,
      iterationId: input.iterationId,
      taskId: task.id,
      agentName: input.agentName,
      status: 'SUCCEEDED',
      output: result.output,
      tokenUsage: result.tokenUsage,
      cost: result.cost,
      startedAt,
    })

    return result
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Agent failed'
    const output =
      error && typeof error === 'object'
        ? (() => {
            const data = error as Record<string, unknown>
            const phase = typeof data.phase === 'string' ? data.phase : null
            const step = typeof data.step === 'string' ? data.step : null
            const summary = typeof data.summary === 'string' ? data.summary : null
            const details = typeof data.details === 'string' ? data.details : null
            if (!phase && !step && !summary && !details) return undefined
            return {
              ...(phase ? { phase } : {}),
              ...(step ? { step } : {}),
              ...(summary ? { summary } : {}),
              ...(details ? { details } : {}),
            }
          })()
        : undefined

    await completeAgentTask({
      runId: input.runId,
      iterationId: input.iterationId,
      taskId: task.id,
      agentName: input.agentName,
      status: 'FAILED',
      output,
      errorMessage: message,
      startedAt,
    })

    throw error
  }
}

async function persistQualityGates(
  runId: string,
  iterationId: string,
  gates: GateRunOutput[]
) {
  for (const gate of gates) {
    const summary = extractPrimaryGateFailureDetail(gate)
    const reason =
      gate.report && typeof gate.report.reason === 'string'
        ? gate.report.reason
        : null
    const skippedByDependency = reason === 'skipped_due_to_previous_failure'

    await prisma.qualityGateRun.upsert({
      where: {
        iterationId_gateType: {
          iterationId,
          gateType: gate.gateType,
        },
      },
      create: {
        iterationId,
        gateType: gate.gateType,
        passed: gate.passed,
        report: gate.report as Prisma.JsonObject | undefined,
        logsRef: gate.logsRef,
        durationMs: gate.durationMs,
        startedAt: new Date(Date.now() - gate.durationMs),
        finishedAt: new Date(),
      },
      update: {
        passed: gate.passed,
        report: gate.report as Prisma.JsonObject | undefined,
        logsRef: gate.logsRef,
        durationMs: gate.durationMs,
        startedAt: new Date(Date.now() - gate.durationMs),
        finishedAt: new Date(),
      },
    })

    await appendRunEvent({
      runId,
      iterationId,
      eventType: 'QUALITY_GATE',
      message: skippedByDependency
        ? `${gate.gateType} gate skipped`
        : `${gate.gateType} gate ${gate.passed ? 'passed' : 'failed'}`,
      payload: {
        gateType: gate.gateType,
        passed: gate.passed,
        durationMs: gate.durationMs,
        logsRef: gate.logsRef,
        ...(skippedByDependency ? { skipped: true } : {}),
        ...(summary ? { summary } : {}),
      },
    })
  }
}

async function ensureIterations(runContext: RunContext) {
  const run = await prisma.developmentRun.findUnique({
    where: { id: runContext.runId },
    include: {
      iterations: true,
    },
  })

  if (!run) {
    throw new Error('RUN_NOT_FOUND')
  }

  if (run.iterations.length > 0) {
    return run.iterations
  }

  const approvedPlan = getApprovedPlan(runContext.snapshot)

  if (approvedPlan) {
    const created = await prisma.$transaction(
      approvedPlan.iterations.map((iteration) =>
        prisma.iterationRun.create({
          data: {
            runId: runContext.runId,
            index: iteration.index,
            name: iteration.name,
            status: 'PENDING',
            scope: iteration.scope as unknown as Prisma.JsonObject,
            gherkinPath: iteration.gherkinPath,
            branchName: toBranchName(runContext.runId, iteration.index, iteration.name),
          },
        })
      )
    )

    await prisma.developmentRun.update({
      where: { id: runContext.runId },
      data: {
        totalIterations: created.length,
        currentIteration: created.length > 0 ? 1 : 0,
      },
    })

    await appendRunEvent({
      runId: runContext.runId,
      eventType: 'INFO',
      message: 'Using approved iteration plan from complexity assessment',
      payload: {
        totalIterations: created.length,
        complexityScore: approvedPlan.assessment.complexityScore,
      },
    })

    return created
  }

  const assessment = await executeAgent({
    runId: runContext.runId,
    agentName: 'AssessmentAgent',
    payload: {
      projectId: runContext.projectId,
      snapshot: runContext.snapshot,
    },
    run: () =>
      runAssessmentAgent({
        runId: runContext.runId,
        projectId: runContext.projectId,
        snapshot: runContext.snapshot,
      }),
  })

  const iterationPlan = await executeAgent({
    runId: runContext.runId,
    agentName: 'IterationPlannerAgent',
    payload: {
      projectId: runContext.projectId,
      assessment: assessment.output,
    },
    run: () =>
      runIterationPlannerAgent(
        {
          runId: runContext.runId,
          projectId: runContext.projectId,
          snapshot: runContext.snapshot,
        },
        assessment.output
      ),
  })

  const created = await prisma.$transaction(
    iterationPlan.output.iterations.map((iteration) =>
      prisma.iterationRun.create({
        data: {
          runId: runContext.runId,
          index: iteration.index,
          name: iteration.name,
          status: 'PENDING',
          scope: iteration.scope as unknown as Prisma.JsonObject,
          gherkinPath: iteration.gherkinPath,
          branchName: toBranchName(runContext.runId, iteration.index, iteration.name),
        },
      })
    )
  )

  await prisma.developmentRun.update({
    where: { id: runContext.runId },
    data: {
      totalIterations: created.length,
      currentIteration: created.length > 0 ? 1 : 0,
    },
  })

  await appendRunEvent({
    runId: runContext.runId,
    eventType: 'INFO',
    message: 'Iteration plan created',
    payload: {
      totalIterations: created.length,
      complexityScore: iterationPlan.output.assessment.complexityScore,
    },
  })

  return created
}

interface ReleaseFailureCheckpointInput {
  runId: string
  iterationId: string
  iterationIndex: number
  step: string
  summary: string
  attempt?: number
}

async function moveRunToReleaseCheckpoint(
  input: ReleaseFailureCheckpointInput
): Promise<void> {
  await prisma.iterationRun.update({
    where: { id: input.iterationId },
    data: {
      status: 'FAILED',
      finishedAt: new Date(),
    },
  })

  await prisma.developmentRun.update({
    where: { id: input.runId },
    data: {
      status: 'WAITING_CHECKPOINT',
      errorSummary: `Iteration ${input.iterationIndex} paused: phase=release step=${input.step} summary=${input.summary}`,
    },
  })

  await appendRunEvent({
    runId: input.runId,
    iterationId: input.iterationId,
    eventType: 'ERROR',
    message: `Release failed at ${input.step}`,
    payload: {
      phase: 'release',
      step: input.step,
      summary: input.summary,
      ...(typeof input.attempt === 'number' ? { attempt: input.attempt } : {}),
    },
  })

  await appendRunEvent({
    runId: input.runId,
    eventType: 'RUN_STATUS',
    message: 'Run waiting checkpoint',
    payload: {
      status: 'WAITING_CHECKPOINT',
      iterationIndex: input.iterationIndex,
      phase: 'release',
      step: input.step,
      ...(typeof input.attempt === 'number' ? { attempt: input.attempt } : {}),
    },
  })
}

export async function __moveRunToReleaseCheckpointForTest(
  input: ReleaseFailureCheckpointInput
) {
  return moveRunToReleaseCheckpoint(input)
}

async function processIteration(runContext: RunContext, iterationId: string): Promise<boolean> {
  const iteration = await prisma.iterationRun.findUnique({
    where: { id: iterationId },
  })

  if (!iteration) {
    throw new Error('ITERATION_NOT_FOUND')
  }

  const branchName =
    iteration.branchName ??
    toBranchName(runContext.runId, iteration.index, iteration.name)

  await prisma.iterationRun.update({
    where: { id: iteration.id },
    data: {
      status: 'RUNNING',
      branchName,
      startedAt: iteration.startedAt ?? new Date(),
    },
  })

  await prisma.developmentRun.update({
    where: { id: runContext.runId },
    data: { currentIteration: iteration.index },
  })

  await appendRunEvent({
    runId: runContext.runId,
    iterationId: iteration.id,
    eventType: 'ITERATION_STATUS',
    message: `Iteration ${iteration.index} running`,
    payload: {
      iterationIndex: iteration.index,
      iterationName: iteration.name,
      status: 'RUNNING',
      branchName,
    },
  })

  const scope = (iteration.scope ?? {}) as {
    goals?: string[]
    featureTags?: string[]
    risks?: string[]
  }

  const iterationPlanItem = {
    index: iteration.index,
    name: iteration.name,
    slug: iteration.name.toLowerCase().replace(/\s+/g, '-'),
    scope: {
      goals: scope.goals ?? [],
      featureTags: scope.featureTags ?? [],
      risks: scope.risks ?? [],
    },
    gherkinPath:
      iteration.gherkinPath ??
      `docs/specifications/generated/iter-${iteration.index}-${iteration.name
        .toLowerCase()
        .replace(/\s+/g, '-')}.feature`,
  }

  const startAttempt = iteration.attemptCount + 1

  if (startAttempt > MAX_ITERATION_ATTEMPTS) {
    const message =
      `Iteration ${iteration.index} exceeded max attempts (${iteration.attemptCount}) and requires retry reset`

    await prisma.iterationRun.update({
      where: { id: iteration.id },
      data: {
        status: 'FAILED',
        finishedAt: new Date(),
      },
    })

    await prisma.developmentRun.update({
      where: { id: runContext.runId },
      data: {
        status: 'WAITING_CHECKPOINT',
        errorSummary: message,
      },
    })

    await appendRunEvent({
      runId: runContext.runId,
      iterationId: iteration.id,
      eventType: 'ERROR',
      message: `Iteration ${iteration.index} blocked: exhausted attempts`,
      payload: {
        attemptsUsed: iteration.attemptCount,
        maxAttempts: MAX_ITERATION_ATTEMPTS,
      },
    })

    await appendRunEvent({
      runId: runContext.runId,
      eventType: 'RUN_STATUS',
      message: 'Run waiting checkpoint',
      payload: {
        status: 'WAITING_CHECKPOINT',
        iterationIndex: iteration.index,
      },
    })

    return false
  }

  for (let attempt = startAttempt; attempt <= MAX_ITERATION_ATTEMPTS; attempt += 1) {
    if (await shouldStopRun(runContext.runId)) {
      return false
    }

    await prisma.iterationRun.update({
      where: { id: iteration.id },
      data: {
        attemptCount: attempt,
      },
    })

    const agentContext = {
      runId: runContext.runId,
      projectId: runContext.projectId,
      iterationId: iteration.id,
      iterationIndex: iteration.index,
      attempt,
      snapshot: runContext.snapshot,
    }

    const specResult = await executeAgent({
      runId: runContext.runId,
      iterationId: iteration.id,
      agentName: 'SpecAgent',
      payload: { iteration: iterationPlanItem, attempt },
      run: () => runSpecAgent(agentContext, iterationPlanItem),
    })

    await prisma.iterationRun.update({
      where: { id: iteration.id },
      data: {
        gherkinPath:
          typeof specResult.output.gherkinPath === 'string'
            ? specResult.output.gherkinPath
            : iterationPlanItem.gherkinPath,
      },
    })

    const testResult = await executeAgent({
      runId: runContext.runId,
      iterationId: iteration.id,
      agentName: 'TestAgent',
      payload: { iteration: iterationPlanItem, attempt },
      run: () => runTestAgent(agentContext, iterationPlanItem),
    })

    const codeResult = await executeAgent({
      runId: runContext.runId,
      iterationId: iteration.id,
      agentName: 'CodeAgent',
      payload: { iteration: iterationPlanItem, attempt },
      run: () => runCodeAgent(agentContext, iterationPlanItem, attempt),
    })

    const generatedFiles = mergeWorkspaceFiles([
      __extractGeneratedFilesFromAgentOutput(specResult.output),
      __extractGeneratedFilesFromAgentOutput(testResult.output),
      __extractGeneratedFilesFromAgentOutput(codeResult.output),
    ])

    if (generatedFiles.length > 0) {
      await writeWorkspaceFiles(runContext.sandboxPath, generatedFiles)
      await appendRunEvent({
        runId: runContext.runId,
        iterationId: iteration.id,
        eventType: 'INFO',
        message: 'Iteration artifacts written to workspace',
        payload: {
          attempt,
          files: generatedFiles.length,
        },
      })
    }

    await executeAgent({
      runId: runContext.runId,
      iterationId: iteration.id,
      agentName: 'ReviewAgent',
      payload: { iteration: iterationPlanItem, attempt },
      run: () => runReviewAgent(agentContext, iterationPlanItem),
    })

    const gates = await runQualityGates({
      runId: runContext.runId,
      iterationId: iteration.id,
      iterationIndex: iteration.index,
      projectId: runContext.projectId,
      workspacePath: runContext.sandboxPath,
      featureTags: iterationPlanItem.scope.featureTags,
    })

    await persistQualityGates(runContext.runId, iteration.id, gates)

    const failedGateOutputs = gates.filter((gate) => !gate.passed)
    const failedGates = failedGateOutputs.map((gate) => gate.gateType)
    const failedGateSummary =
      buildFailedGateSummary(failedGateOutputs) || failedGates.join(', ')

    if (failedGates.length === 0) {
      await prisma.iterationRun.update({
        where: { id: iteration.id },
        data: { status: 'GATED' },
      })

      await appendRunEvent({
        runId: runContext.runId,
        iterationId: iteration.id,
        eventType: 'ITERATION_STATUS',
        message: `Iteration ${iteration.index} gated`,
        payload: {
          status: 'GATED',
          iterationIndex: iteration.index,
        },
      })

      let releaseResult: {
        output: Record<string, unknown>
        tokenUsage?: number
        cost?: number
      }

      try {
        releaseResult = await executeAgent({
          runId: runContext.runId,
          iterationId: iteration.id,
          agentName: 'ReleaseAgent',
          payload: { iteration: iterationPlanItem, branchName },
          run: async () => {
            const releaseAgentResult = await runReleaseAgent(
              agentContext,
              iterationPlanItem,
              branchName
            )

            const gherkinPath =
              typeof specResult.output.gherkinPath === 'string'
                ? sanitizeWorkspacePath(specResult.output.gherkinPath)
                : iterationPlanItem.gherkinPath
            const gherkinContent =
              typeof specResult.output.gherkin === 'string'
                ? specResult.output.gherkin
                : ''

            const artifactsForCommit = await __collectWorkspaceArtifactsForCommit(
              runContext.sandboxPath
            )

            const gitReleaseResult = await executeIterationGitRelease({
              projectId: runContext.projectId,
              iterationIndex: iteration.index,
              iterationName: iteration.name,
              branchName,
              gherkinPath,
              gherkinContent,
              artifacts: artifactsForCommit,
              onCheckpoint: async (checkpoint) => {
                await appendRunEvent({
                  runId: runContext.runId,
                  iterationId: iteration.id,
                  eventType: 'INFO',
                  message: `Release ${checkpoint.step}: ${checkpoint.summary}`,
                  payload: {
                    phase: checkpoint.phase,
                    step: checkpoint.step,
                    summary: checkpoint.summary,
                    durationMs: checkpoint.durationMs,
                    attempt,
                  },
                })
              },
            })

            return {
              output: {
                ...releaseAgentResult.output,
                ...gitReleaseResult,
                artifactsCommitted: artifactsForCommit.length,
              },
              tokenUsage: releaseAgentResult.tokenUsage,
              cost: releaseAgentResult.cost,
            }
          },
        })
      } catch (error) {
        const releaseError = error as Partial<{
          step: string
          summary: string
        }>

        await moveRunToReleaseCheckpoint({
          runId: runContext.runId,
          iterationId: iteration.id,
          iterationIndex: iteration.index,
          step:
            typeof releaseError.step === 'string' && releaseError.step.length > 0
              ? releaseError.step
              : 'unknown',
          summary:
            typeof releaseError.summary === 'string' && releaseError.summary.length > 0
              ? releaseError.summary
              : (error instanceof Error ? error.message : 'release_failed'),
          attempt,
        })

        return false
      }

      await prisma.iterationRun.update({
        where: { id: iteration.id },
        data: { status: 'MERGED' },
      })

      await appendRunEvent({
        runId: runContext.runId,
        iterationId: iteration.id,
        eventType: 'ITERATION_STATUS',
        message: `Iteration ${iteration.index} merged`,
        payload: {
          status: 'MERGED',
          iterationIndex: iteration.index,
          branchName,
          pullRequestNumber:
            typeof releaseResult.output.pullRequestNumber === 'number'
              ? releaseResult.output.pullRequestNumber
              : undefined,
          pullRequestUrl:
            typeof releaseResult.output.pullRequestUrl === 'string'
              ? releaseResult.output.pullRequestUrl
              : undefined,
          mergeCommitSha:
            typeof releaseResult.output.mergeCommitSha === 'string'
              ? releaseResult.output.mergeCommitSha
              : undefined,
        },
      })

      await prisma.project.update({
        where: { id: runContext.projectId },
        data: { status: 'DEPLOYING' },
      })

      await executeAgent({
        runId: runContext.runId,
        iterationId: iteration.id,
        agentName: 'DeployAgent',
        payload: { iteration: iterationPlanItem },
        run: () => runDeployAgent(agentContext, iterationPlanItem),
      })

      await prisma.iterationRun.update({
        where: { id: iteration.id },
        data: {
          status: 'DEPLOYED',
          finishedAt: new Date(),
        },
      })

      await prisma.project.update({
        where: { id: runContext.projectId },
        data: { status: 'GENERATING' },
      })

      await appendRunEvent({
        runId: runContext.runId,
        iterationId: iteration.id,
        eventType: 'DEPLOY_STATUS',
        message: `Iteration ${iteration.index} deployed`,
        payload: {
          status: 'DEPLOYED',
          iterationIndex: iteration.index,
        },
      })

      return true
    }

    await executeAgent({
      runId: runContext.runId,
      iterationId: iteration.id,
      agentName: 'RecoveryAgent',
      payload: {
        iteration: iterationPlanItem,
        attempt,
        failedGates,
      },
      run: () =>
        runRecoveryAgent(agentContext, iterationPlanItem, attempt, failedGates),
    })

    if (
      shouldPauseForBabyStepCheckpoint({
        babyStepModeEnabled: isBabyStepModeEnabledFromEnv(process.env),
        attempt,
        maxAttempts: MAX_ITERATION_ATTEMPTS,
      })
    ) {
      await prisma.iterationRun.update({
        where: { id: iteration.id },
        data: {
          status: 'FAILED',
          finishedAt: new Date(),
        },
      })

      await prisma.developmentRun.update({
        where: { id: runContext.runId },
        data: {
          status: 'WAITING_CHECKPOINT',
          errorSummary: `Iteration ${iteration.index} pausada em baby steps após tentativa ${attempt}. Failed gates: ${failedGateSummary}`,
        },
      })

      await appendRunEvent({
        runId: runContext.runId,
        iterationId: iteration.id,
        eventType: 'ERROR',
        message: `Iteration ${iteration.index} paused for baby-step checkpoint`,
        payload: {
          failedGates,
          failedGateSummary,
          attempts: attempt,
          mode: 'baby_steps',
        },
      })

      await appendRunEvent({
        runId: runContext.runId,
        eventType: 'RUN_STATUS',
        message: 'Run waiting checkpoint (baby steps)',
        payload: {
          status: 'WAITING_CHECKPOINT',
          iterationIndex: iteration.index,
          action: 'baby_step_pause',
          attempt,
        },
      })

      return false
    }

    if (attempt === MAX_ITERATION_ATTEMPTS) {
      await prisma.iterationRun.update({
        where: { id: iteration.id },
        data: {
          status: 'FAILED',
          finishedAt: new Date(),
        },
      })

      await prisma.developmentRun.update({
        where: { id: runContext.runId },
        data: {
          status: 'WAITING_CHECKPOINT',
          errorSummary: `Iteration ${iteration.index} failed after ${MAX_ITERATION_ATTEMPTS} attempts. Failed gates: ${failedGateSummary}`,
        },
      })

      await appendRunEvent({
        runId: runContext.runId,
        iterationId: iteration.id,
        eventType: 'ERROR',
        message: `Iteration ${iteration.index} failed after retries`,
        payload: {
          failedGates,
          failedGateSummary,
          attempts: MAX_ITERATION_ATTEMPTS,
        },
      })

      await appendRunEvent({
        runId: runContext.runId,
        eventType: 'RUN_STATUS',
        message: 'Run waiting checkpoint',
        payload: {
          status: 'WAITING_CHECKPOINT',
          iterationIndex: iteration.index,
        },
      })

      return false
    }
  }

  return false
}

async function processRunInternal(runId: string): Promise<void> {
  const run = await prisma.developmentRun.findUnique({
    where: { id: runId },
    select: {
      id: true,
      projectId: true,
      status: true,
      workerSandboxPath: true,
    },
  })

  if (!run) {
    return
  }

  if (TERMINAL_RUN_STATUSES.has(run.status)) {
    return
  }

  if (run.status !== 'RUNNING') {
    await prisma.developmentRun.update({
      where: { id: runId },
      data: {
        status: 'RUNNING',
        startedAt: run.status === 'QUEUED' ? new Date() : undefined,
      },
    })

    await prisma.project.update({
      where: { id: run.projectId },
      data: {
        status: 'GENERATING',
      },
    })

    await appendRunEvent({
      runId,
      eventType: 'RUN_STATUS',
      message: 'Run started',
      payload: { status: 'RUNNING' },
    })
  }

  const snapshot = await getRunSnapshot(runId)
  const sandboxPath = await ensureSandbox(runId, run.workerSandboxPath)

  const context: RunContext = {
    runId,
    projectId: run.projectId,
    snapshot,
    sandboxPath,
  }

  await ensureWorkspaceBootstrap(context)

  const iterations = await ensureIterations(context)

  const sorted = [...iterations].sort((a, b) => a.index - b.index)

  for (const iteration of sorted) {
    if (iteration.status === 'DEPLOYED') {
      continue
    }

    if (await shouldStopRun(runId)) {
      return
    }

    const succeeded = await processIteration(context, iteration.id)
    if (!succeeded) {
      return
    }
  }

  await prisma.developmentRun.update({
    where: { id: runId },
    data: {
      status: 'SUCCEEDED',
      finishedAt: new Date(),
      errorSummary: null,
    },
  })

  await prisma.project.update({
    where: { id: run.projectId },
    data: {
      status: 'LIVE',
      lastDeployAt: new Date(),
    },
  })

  await appendRunEvent({
    runId,
    eventType: 'RUN_STATUS',
    message: 'Run succeeded',
    payload: { status: 'SUCCEEDED' },
  })
}

export async function processDevelopmentRun(runId: string): Promise<void> {
  if (!markRunActive(runId)) {
    return
  }

  try {
    await processRunInternal(runId)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown orchestrator error'

    await prisma.developmentRun
      .update({
        where: { id: runId },
        data: {
          status: 'FAILED',
          finishedAt: new Date(),
          errorSummary: message,
        },
      })
      .catch(() => undefined)

    const run = await prisma.developmentRun
      .findUnique({
        where: { id: runId },
        select: { projectId: true },
      })
      .catch(() => null)

    if (run?.projectId) {
      await prisma.project
        .update({
          where: { id: run.projectId },
          data: { status: 'FAILED' },
        })
        .catch(() => undefined)
    }

    await appendRunEvent({
      runId,
      eventType: 'ERROR',
      message: 'Run failed',
      payload: { error: message },
    }).catch(() => undefined)

    await appendRunEvent({
      runId,
      eventType: 'RUN_STATUS',
      message: 'Run failed',
      payload: { status: 'FAILED' },
    }).catch(() => undefined)
  } finally {
    const run = await prisma.developmentRun
      .findUnique({ where: { id: runId }, select: { status: true } })
      .catch(() => null)

    if (run && (TERMINAL_RUN_STATUSES.has(run.status) || run.status === 'WAITING_CHECKPOINT')) {
      await cleanupSandbox(runId).catch(() => undefined)
    }

    unmarkRunActive(runId)
  }
}

export function enqueueDevelopmentRun(runId: string) {
  setTimeout(() => {
    void processDevelopmentRun(runId)
  }, 0)
}

export async function createDevelopmentRun(
  projectId: string,
  approvedPlan?: ApprovedDevelopmentPlan
) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      id: true,
      status: true,
      businessPlan: true,
      technicalPlan: true,
      uxPlan: true,
      name: true,
      description: true,
      developmentRuns: {
        where: {
          status: {
            in: ['QUEUED', 'RUNNING', 'WAITING_CHECKPOINT'],
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 1,
        select: {
          id: true,
          status: true,
          createdAt: true,
        },
      },
    },
  })

  if (!project) {
    throw new Error('PROJECT_NOT_FOUND')
  }

  if (project.developmentRuns.length > 0) {
    return {
      run: project.developmentRuns[0],
      alreadyActive: true,
    }
  }

  if (!project.businessPlan || !project.technicalPlan || !project.uxPlan) {
    throw new Error('PLAN_PREREQUISITES_NOT_MET')
  }

  const run = await prisma.developmentRun.create({
    data: {
      projectId,
      status: 'QUEUED',
      plansSnapshot: {
        projectName: project.name,
        projectDescription: project.description,
        businessPlan: project.businessPlan,
        technicalPlan: project.technicalPlan,
        uxPlan: project.uxPlan,
        approvedAssessment: approvedPlan?.assessment ?? null,
        approvedIterations: approvedPlan?.iterations ?? null,
      } as unknown as Prisma.JsonObject,
    },
  })

  await appendRunEvent({
    runId: run.id,
    eventType: 'RUN_STATUS',
    message: 'Run queued',
    payload: { status: 'QUEUED' },
  })

  enqueueDevelopmentRun(run.id)

  return {
    run,
    alreadyActive: false,
  }
}

export async function getDevelopmentRun(projectId: string, runId: string) {
  return prisma.developmentRun.findFirst({
    where: {
      id: runId,
      projectId,
    },
    include: {
      iterations: {
        orderBy: { index: 'asc' },
        include: {
          qualityGates: {
            orderBy: { gateType: 'asc' },
          },
          agentTasks: {
            orderBy: { createdAt: 'asc' },
          },
        },
      },
    },
  })
}

export async function getDevelopmentRunEvents(runId: string, afterSequence = 0) {
  return listRunEvents(runId, afterSequence)
}

export function isDevelopmentRunActiveInWorker(runId: string): boolean {
  return isRunActive(runId)
}

export async function getDevelopmentRunRetryBoundary(runId: string) {
  return getLatestRetryBoundarySequence(runId)
}

export async function recoverDevelopmentRun(projectId: string, runId: string) {
  const run = await prisma.developmentRun.findFirst({
    where: {
      id: runId,
      projectId,
    },
    select: {
      id: true,
      status: true,
      startedAt: true,
      currentIteration: true,
    },
  })

  if (!run) {
    throw new Error('RUN_NOT_FOUND')
  }

  if (run.status !== 'QUEUED' && run.status !== 'RUNNING') {
    throw new Error('RUN_NOT_RECOVERABLE')
  }

  if (isRunActive(run.id)) {
    return {
      run,
      alreadyProcessing: true,
    }
  }

  if (run.currentIteration > 0) {
    const currentIteration = await prisma.iterationRun.findFirst({
      where: {
        runId: run.id,
        index: run.currentIteration,
      },
      select: {
        id: true,
        index: true,
        status: true,
        attemptCount: true,
      },
    })

    if (currentIteration && currentIteration.attemptCount >= MAX_ITERATION_ATTEMPTS) {
      await prisma.iterationRun.update({
        where: { id: currentIteration.id },
        data: {
          status: 'PENDING',
          finishedAt: null,
          attemptCount: 0,
        },
      })

      await appendRunEvent({
        runId: run.id,
        iterationId: currentIteration.id,
        eventType: 'INFO',
        message: 'Iteration retries reset before manual resume',
        payload: {
          iterationIndex: currentIteration.index,
          previousAttemptCount: currentIteration.attemptCount,
        },
      })
    }
  }

  await cleanupSandbox(run.id)

  const updatedRun = await prisma.developmentRun.update({
    where: { id: run.id },
    data: {
      status: 'RUNNING',
      startedAt: run.startedAt ?? new Date(),
      finishedAt: null,
      canceledAt: null,
    },
    select: {
      id: true,
      status: true,
      startedAt: true,
    },
  })

  await appendRunEvent({
    runId: run.id,
    eventType: 'RUN_STATUS',
    message: 'Run manually resumed by user',
    payload: {
      status: 'RUNNING',
      action: 'manual_resume',
    },
  })

  enqueueDevelopmentRun(run.id)

  return {
    run: updatedRun,
    alreadyProcessing: false,
  }
}

export async function cancelDevelopmentRun(projectId: string, runId: string) {
  const run = await prisma.developmentRun.findFirst({
    where: { id: runId, projectId },
    select: { id: true, status: true },
  })

  if (!run) {
    throw new Error('RUN_NOT_FOUND')
  }

  if (TERMINAL_RUN_STATUSES.has(run.status)) {
    return run
  }

  const updated = await prisma.developmentRun.update({
    where: { id: run.id },
    data: {
      status: 'CANCELED',
      canceledAt: new Date(),
      finishedAt: new Date(),
    },
  })

  await prisma.project.update({
    where: { id: projectId },
    data: { status: 'FAILED' },
  })

  await appendRunEvent({
    runId,
    eventType: 'RUN_STATUS',
    message: 'Run canceled',
    payload: { status: 'CANCELED' },
  })

  return updated
}

export async function checkpointAction(input: {
  projectId: string
  runId: string
  iterationIndex: number
  action: 'pause' | 'resume' | 'approve'
}) {
  const run = await prisma.developmentRun.findFirst({
    where: { id: input.runId, projectId: input.projectId },
    select: { id: true, status: true },
  })

  if (!run) {
    throw new Error('RUN_NOT_FOUND')
  }

  const iteration = await prisma.iterationRun.findFirst({
    where: {
      runId: input.runId,
      index: input.iterationIndex,
    },
    select: { id: true, index: true, status: true },
  })

  if (!iteration) {
    throw new Error('ITERATION_NOT_FOUND')
  }

  if (input.action === 'pause') {
    const updated = await prisma.developmentRun.update({
      where: { id: run.id },
      data: {
        status: 'WAITING_CHECKPOINT',
        errorSummary: `Paused manually at iteration ${iteration.index}`,
      },
    })

    await appendRunEvent({
      runId: run.id,
      iterationId: iteration.id,
      eventType: 'RUN_STATUS',
      message: 'Run paused by checkpoint',
      payload: { status: 'WAITING_CHECKPOINT', iterationIndex: iteration.index },
    })

    return updated
  }

  await cleanupSandbox(run.id)

  await prisma.iterationRun.update({
    where: { id: iteration.id },
    data: {
      status: 'PENDING',
      finishedAt: null,
      attemptCount: 0,
    },
  })

  const updatedRun = await prisma.developmentRun.update({
    where: { id: run.id },
    data: {
      status: 'RUNNING',
      errorSummary: null,
    },
  })

  await appendRunEvent({
    runId: run.id,
    iterationId: iteration.id,
    eventType: 'RUN_STATUS',
    message: `Run resumed from checkpoint (${input.action})`,
    payload: { status: 'RUNNING', action: input.action, iterationIndex: iteration.index },
  })

  enqueueDevelopmentRun(run.id)

  return updatedRun
}

export async function retryDevelopmentRun(projectId: string, runId: string) {
  const run = await prisma.developmentRun.findFirst({
    where: { id: runId, projectId },
    select: { id: true, status: true, currentIteration: true },
  })

  if (!run) {
    throw new Error('RUN_NOT_FOUND')
  }

  if (run.status !== 'WAITING_CHECKPOINT' && run.status !== 'FAILED') {
    throw new Error('RUN_NOT_RETRYABLE')
  }

  await cleanupSandbox(run.id)

  const failedIteration = await prisma.iterationRun.findFirst({
    where: {
      runId,
      OR: [{ status: 'FAILED' }, { index: run.currentIteration }],
    },
    orderBy: { index: 'asc' },
  })

  if (failedIteration) {
    await prisma.iterationRun.update({
      where: { id: failedIteration.id },
      data: {
        status: 'PENDING',
        finishedAt: null,
        attemptCount: 0,
      },
    })
  }

  const updatedRun = await prisma.developmentRun.update({
    where: { id: run.id },
    data: {
      status: 'RUNNING',
      finishedAt: null,
      errorSummary: null,
    },
  })

  await appendRunEvent({
    runId,
    iterationId: failedIteration?.id,
    eventType: 'RUN_STATUS',
    message: 'Run retry requested',
    payload: {
      status: 'RUNNING',
      action: 'retry',
      iterationIndex: failedIteration?.index,
    },
  })

  enqueueDevelopmentRun(run.id)

  return updatedRun
}
