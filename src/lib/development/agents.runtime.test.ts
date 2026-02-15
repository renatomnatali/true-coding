import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { runClaudeAgentMock } = vi.hoisted(() => ({
  runClaudeAgentMock: vi.fn(),
}))

vi.mock('./agent-runtime', () => ({
  isClaudeAgentRuntimeEnabled: vi.fn(() => true),
  runClaudeAgent: runClaudeAgentMock,
}))

import { runSpecAgent, runTestAgent } from './agents'
import type { IterationPlanItem } from '@/types/development'

const context = {
  runId: 'run-1',
  projectId: 'proj-1',
  iterationId: 'iter-1',
  iterationIndex: 1,
  attempt: 1,
  snapshot: {
    businessPlan: { name: 'App XPTO' },
    technicalPlan: { pages: [{ name: 'Home', path: '/' }] },
    uxPlan: { personas: [{ name: 'Maria' }] },
  },
}

const iteration: IterationPlanItem = {
  index: 1,
  name: 'Fundacao',
  slug: 'fundacao',
  scope: {
    goals: ['Criar estrutura base'],
    featureTags: ['@iter-fundacao'],
    risks: ['Acoplamento'],
  },
  gherkinPath: 'docs/specifications/generated/iter-1-fundacao.feature',
}

describe('agents runtime mode', () => {
  const originalFlag = process.env.AUTONOMOUS_DEV_LLM_AGENTS

  beforeEach(() => {
    vi.clearAllMocks()
    process.env.AUTONOMOUS_DEV_LLM_AGENTS = 'true'
  })

  afterEach(() => {
    if (typeof originalFlag === 'undefined') {
      delete process.env.AUTONOMOUS_DEV_LLM_AGENTS
    } else {
      process.env.AUTONOMOUS_DEV_LLM_AGENTS = originalFlag
    }
  })

  it('uses Claude runtime for SpecAgent when enabled', async () => {
    runClaudeAgentMock.mockResolvedValue({
      output: {
        gherkinPath: iteration.gherkinPath,
        featureTags: ['@iter-fundacao'],
        gherkin: '# language: pt',
        files: [
          {
            path: iteration.gherkinPath,
            content: '# language: pt',
          },
        ],
      },
      tokenUsage: 200,
      cost: 0.01,
    })

    const result = await runSpecAgent(context, iteration)

    expect(runClaudeAgentMock).toHaveBeenCalledTimes(1)
    expect(result.output.gherkinPath).toBe(iteration.gherkinPath)
  })

  it('uses Claude runtime for TestAgent when enabled', async () => {
    runClaudeAgentMock.mockResolvedValue({
      output: {
        redStateConfirmed: true,
        testTargets: ['Criar estrutura base'],
        command: 'npm run test',
        files: [
          {
            path: 'src/lib/iterations/iter-1.test.ts',
            content: "import { describe, it, expect } from 'vitest'",
          },
        ],
      },
      tokenUsage: 180,
      cost: 0.01,
    })

    const result = await runTestAgent(context, iteration)

    expect(runClaudeAgentMock).toHaveBeenCalledTimes(1)
    expect(result.output.redStateConfirmed).toBe(true)
  })
})
