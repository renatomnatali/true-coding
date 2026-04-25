import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { IterationPlanItem } from '@/types/development'
import type { AgentExecutionContext, FileManifest } from './types'

const mocks = vi.hoisted(() => ({
  runClaudeAgentMock: vi.fn(),
  buildManifestFromSnapshotMock: vi.fn(),
  shouldUseSingleShotMock: vi.fn(),
  generateFilesFromManifestMock: vi.fn(),
}))

const BASE_CONTEXT: AgentExecutionContext = {
  runId: 'run_1',
  projectId: 'proj_1',
  iterationId: 'iter_1',
  snapshot: {
    businessPlan: { name: 'App X' },
    technicalPlan: {},
    uxPlan: {},
  },
}

const BASE_ITERATION: IterationPlanItem = {
  index: 1,
  name: 'Core Features',
  slug: 'core-features',
  scope: {
    goals: ['Implementar fluxo principal'],
    featureTags: ['@core-features'],
    risks: [],
  },
  gherkinPath: 'docs/specifications/generated/iter-1-core-features.feature',
}

const LARGE_MANIFEST: FileManifest = {
  entries: [
    {
      path: 'src/types/iter-1.ts',
      kind: 'type',
      dependsOn: [],
      estimatedTokens: 800,
    },
    {
      path: 'src/components/order-card.tsx',
      kind: 'component',
      dependsOn: ['src/types/iter-1.ts'],
      estimatedTokens: 1500,
    },
    {
      path: 'src/components/order-card.test.tsx',
      kind: 'test',
      dependsOn: ['src/components/order-card.tsx'],
      estimatedTokens: 1000,
    },
    {
      path: 'docs/specifications/generated/iter-1-core-features.feature',
      kind: 'spec',
      dependsOn: [],
      estimatedTokens: 800,
    },
  ],
  totalEstimatedTokens: 8000,
}

async function importSubject(pipelineV2: boolean) {
  vi.resetModules()

  vi.doMock('@/config/features', () => ({
    FEATURES: {
      STRUCTURED_DISCOVERY: false,
      QUICK_REPLIES: true,
      PROGRESS_TRACKING: true,
      AUTONOMOUS_DEVELOPMENT_V1: true,
      PIPELINE_V2: pipelineV2,
    },
  }))

  vi.doMock('./agent-runtime', () => ({
    runClaudeAgent: mocks.runClaudeAgentMock,
    isClaudeAgentRuntimeEnabled: () => true,
  }))

  vi.doMock('./file-manifest', () => ({
    buildManifestFromSnapshot: mocks.buildManifestFromSnapshotMock,
    shouldUseSingleShot: mocks.shouldUseSingleShotMock,
    SINGLE_SHOT_THRESHOLD: 4000,
  }))

  vi.doMock('./file-generator', () => ({
    generateFilesFromManifest: mocks.generateFilesFromManifestMock,
  }))

  return import('./agents')
}

describe('runCodeAgent com PIPELINE_V2', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.buildManifestFromSnapshotMock.mockReturnValue(LARGE_MANIFEST)
    mocks.runClaudeAgentMock.mockResolvedValue({
      output: {
        appliedChanges: ['single-shot'],
        branchStrategy: 'trunk-based-short-branch',
        commitMessage: 'feat(iter-1): Core Features',
        files: [{ path: 'src/lib/iterations/iter-1.ts', content: 'export const x = 1' }],
      },
      tokenUsage: 120,
    })
    mocks.generateFilesFromManifestMock.mockResolvedValue({
      files: [{ path: 'src/app/dashboard/page.tsx', content: 'export default function Page() { return null }' }],
      interfaceMap: [],
      totalTokensUsed: 340,
    })
  })

  it('usa single-shot quando PIPELINE_V2 está desativado', async () => {
    const { runCodeAgent } = await importSubject(false)

    const result = await runCodeAgent(BASE_CONTEXT, BASE_ITERATION, 1)

    expect(mocks.runClaudeAgentMock).toHaveBeenCalledTimes(1)
    expect(mocks.buildManifestFromSnapshotMock).not.toHaveBeenCalled()
    expect(mocks.generateFilesFromManifestMock).not.toHaveBeenCalled()
    expect(result.output.files).toHaveLength(1)
  })

  it('remove arquivos de teste do resultado single-shot do CodeAgent', async () => {
    mocks.runClaudeAgentMock.mockResolvedValueOnce({
      output: {
        appliedChanges: ['single-shot'],
        branchStrategy: 'trunk-based-short-branch',
        commitMessage: 'feat(iter-1): Core Features',
        files: [
          { path: 'src/app/dashboard/page.tsx', content: 'export default function Page() { return null }' },
          { path: 'tests/e2e/steps/dashboard.test.ts', content: 'describe("dashboard", () => {})' },
        ],
      },
      tokenUsage: 120,
    })

    const { runCodeAgent } = await importSubject(false)
    const result = await runCodeAgent(BASE_CONTEXT, BASE_ITERATION, 1)

    expect(result.output.files).toEqual([
      { path: 'src/app/dashboard/page.tsx', content: 'export default function Page() { return null }' },
    ])
    expect(result.output.appliedChanges).toContain(
      'Arquivos de teste removidos do escopo do CodeAgent'
    )
  })

  it('usa single-shot quando PIPELINE_V2 está ativo mas fallback está habilitado', async () => {
    mocks.shouldUseSingleShotMock.mockReturnValue(true)
    const { runCodeAgent } = await importSubject(true)

    await runCodeAgent(BASE_CONTEXT, BASE_ITERATION, 1)

    expect(mocks.buildManifestFromSnapshotMock).toHaveBeenCalledTimes(1)
    expect(mocks.shouldUseSingleShotMock).toHaveBeenCalledWith({
      entries: expect.arrayContaining([
        expect.objectContaining({ kind: 'type' }),
        expect.objectContaining({ kind: 'component' }),
      ]),
      totalEstimatedTokens: expect.any(Number),
    })
    expect(mocks.runClaudeAgentMock).toHaveBeenCalledTimes(1)
    expect(mocks.runClaudeAgentMock).toHaveBeenCalledWith(
      expect.objectContaining({
        userPrompt: expect.stringContaining('Não gerar arquivos de teste'),
      })
    )
    expect(mocks.generateFilesFromManifestMock).not.toHaveBeenCalled()
  })

  it('usa geração incremental quando PIPELINE_V2 está ativo e sem fallback', async () => {
    mocks.shouldUseSingleShotMock.mockReturnValue(false)
    const { runCodeAgent } = await importSubject(true)

    const result = await runCodeAgent(BASE_CONTEXT, BASE_ITERATION, 1)

    expect(mocks.buildManifestFromSnapshotMock).toHaveBeenCalledTimes(1)
    expect(mocks.shouldUseSingleShotMock).toHaveBeenCalledWith({
      entries: expect.arrayContaining([
        expect.objectContaining({ kind: 'type' }),
        expect.objectContaining({ kind: 'component' }),
      ]),
      totalEstimatedTokens: expect.any(Number),
    })
    expect(mocks.generateFilesFromManifestMock).toHaveBeenCalledWith({
      runId: 'run_1',
      iterationId: 'iter_1',
      projectId: 'proj_1',
      snapshot: BASE_CONTEXT.snapshot,
      iteration: BASE_ITERATION,
      manifest: {
        entries: [
          {
            path: 'src/types/iter-1.ts',
            kind: 'type',
            dependsOn: [],
            estimatedTokens: 800,
          },
          {
            path: 'src/components/order-card.tsx',
            kind: 'component',
            dependsOn: ['src/types/iter-1.ts'],
            estimatedTokens: 1500,
          },
        ],
        totalEstimatedTokens: 2300,
      },
    })
    expect(mocks.runClaudeAgentMock).not.toHaveBeenCalled()
    expect(result.tokenUsage).toBe(340)
    expect(result.output.files).toHaveLength(1)
    expect(result.output.commitMessage).toContain('feat(iter-1):')
    expect(result.output.branchStrategy).toBe('trunk-based-short-branch')
  })

  it('falha com erro explícito quando modo incremental não possui iterationId', async () => {
    mocks.shouldUseSingleShotMock.mockReturnValue(false)
    const { runCodeAgent } = await importSubject(true)
    const contextWithoutIteration: AgentExecutionContext = {
      ...BASE_CONTEXT,
      iterationId: undefined,
    }

    await expect(
      runCodeAgent(contextWithoutIteration, BASE_ITERATION, 1)
    ).rejects.toThrow('MISSING_ITERATION_ID:CodeAgent')

    expect(mocks.generateFilesFromManifestMock).not.toHaveBeenCalled()
    expect(mocks.runClaudeAgentMock).not.toHaveBeenCalled()
  })
})

describe('runTestAgent com PIPELINE_V2', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.buildManifestFromSnapshotMock.mockReturnValue(LARGE_MANIFEST)
    mocks.runClaudeAgentMock.mockResolvedValue({
      output: {
        redStateConfirmed: true,
        testTargets: ['Implementar fluxo principal'],
        command: 'npm run test',
        files: [{ path: 'src/components/order-card.test.tsx', content: 'describe("x", () => {})' }],
      },
      tokenUsage: 120,
    })
    mocks.generateFilesFromManifestMock.mockResolvedValue({
      files: [{ path: 'src/components/order-card.test.tsx', content: 'describe("x", () => {})' }],
      interfaceMap: [],
      totalTokensUsed: 220,
    })
  })

  it('usa single-shot quando PIPELINE_V2 está desativado', async () => {
    const { runTestAgent } = await importSubject(false)

    const result = await runTestAgent(BASE_CONTEXT, BASE_ITERATION)

    expect(mocks.runClaudeAgentMock).toHaveBeenCalledTimes(1)
    expect(mocks.buildManifestFromSnapshotMock).not.toHaveBeenCalled()
    expect(mocks.generateFilesFromManifestMock).not.toHaveBeenCalled()
    expect(result.output.redStateConfirmed).toBe(true)
  })

  it('usa geração incremental de arquivos de teste quando PIPELINE_V2 está ativo', async () => {
    const { runTestAgent } = await importSubject(true)

    const result = await runTestAgent(BASE_CONTEXT, BASE_ITERATION)

    expect(mocks.buildManifestFromSnapshotMock).toHaveBeenCalledTimes(1)
    expect(mocks.generateFilesFromManifestMock).toHaveBeenCalledWith({
      runId: 'run_1',
      iterationId: 'iter_1',
      projectId: 'proj_1',
      snapshot: BASE_CONTEXT.snapshot,
      iteration: BASE_ITERATION,
      manifest: {
        entries: [
          {
            path: 'src/components/order-card.test.tsx',
            kind: 'test',
            dependsOn: ['src/components/order-card.tsx'],
            estimatedTokens: 1000,
          },
        ],
        totalEstimatedTokens: 1000,
      },
    })
    expect(mocks.runClaudeAgentMock).not.toHaveBeenCalled()
    expect(result.output.redStateConfirmed).toBe(true)
    expect(result.output.files).toHaveLength(1)
  })

  it('falha com erro explícito quando modo incremental não possui iterationId', async () => {
    const { runTestAgent } = await importSubject(true)
    const contextWithoutIteration: AgentExecutionContext = {
      ...BASE_CONTEXT,
      iterationId: undefined,
    }

    await expect(
      runTestAgent(contextWithoutIteration, BASE_ITERATION)
    ).rejects.toThrow('MISSING_ITERATION_ID:TestAgent')

    expect(mocks.generateFilesFromManifestMock).not.toHaveBeenCalled()
    expect(mocks.runClaudeAgentMock).not.toHaveBeenCalled()
  })
})
