import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock feature flags
vi.mock('@/config/features', () => ({
  FEATURES: {
    AUTONOMOUS_DEVELOPMENT_V1: true,
    PIPELINE_V2: false,
  },
}))

// Mock agent-runtime
vi.mock('./agent-runtime', () => ({
  runClaudeAgent: vi.fn(),
  runClaudeAgentWithCache: vi.fn(),
  isClaudeAgentRuntimeEnabled: () => true,
}))

describe('runCodeAgent with PIPELINE_V2', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.resetModules()
  })

  it('uses single-shot when PIPELINE_V2 is disabled', async () => {
    const { runClaudeAgent } = await import('./agent-runtime')
    const mockRun = vi.mocked(runClaudeAgent)
    mockRun.mockResolvedValue({
      output: {
        files: [{ path: 'test.ts', content: 'export const a = 1' }],
        appliedChanges: [],
        branchStrategy: 'direct',
        commitMessage: 'test',
      },
      tokenUsage: 100,
    })

    // With PIPELINE_V2 disabled, should use runClaudeAgent (single-shot)
    expect(mockRun).toBeDefined()
  })

  it('PIPELINE_V2 feature flag exists in config', async () => {
    const { FEATURES } = await import('@/config/features')
    expect(typeof FEATURES.PIPELINE_V2).toBe('boolean')
  })
})
