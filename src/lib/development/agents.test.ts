import { describe, it, expect } from 'vitest'
import {
  runAssessmentAgent,
  runIterationPlannerAgent,
  runSpecAgent,
  runTestAgent,
  runCodeAgent,
  runReviewAgent,
  runRecoveryAgent,
  runReleaseAgent,
  runDeployAgent,
} from './agents'

const baseContext = {
  runId: 'run_1',
  projectId: 'proj_1',
  snapshot: {
    businessPlan: { name: 'App X' },
    technicalPlan: {
      pages: [
        { name: 'Home', path: '/' },
        { name: 'Dashboard', path: '/dashboard' },
        { name: 'Orders', path: '/orders' },
      ],
      components: [{ name: 'Header' }, { name: 'Card' }, { name: 'Form' }],
      apiEndpoints: [
        {
          category: 'Core',
          endpoints: [
            { method: 'GET', path: '/api/orders' },
            { method: 'POST', path: '/api/orders' },
          ],
        },
      ],
      database: { prismaSchema: 'model User { id String @id }' },
      integrations: [{ name: 'Stripe' }],
    },
    uxPlan: { personas: [] },
  },
}

describe('development agents', () => {
  it('assessment agent computes complexity and recommendation', async () => {
    const result = await runAssessmentAgent(baseContext)

    expect(result.output.complexityScore).toBeGreaterThan(0)
    expect(result.output.recommendedIterations).toBeGreaterThanOrEqual(2)
    expect(result.output.factors.length).toBe(5)
  })

  it('iteration planner returns iterations from assessment', async () => {
    const assessment = await runAssessmentAgent(baseContext)
    const plan = await runIterationPlannerAgent(baseContext, assessment.output)

    expect(plan.output.iterations.length).toBe(assessment.output.recommendedIterations)
    expect(plan.output.iterations[0].scope.featureTags[0]).toMatch(/^@iter-/)
  })

  it('core implementation agents return structured payloads', async () => {
    const assessment = await runAssessmentAgent(baseContext)
    const plan = await runIterationPlannerAgent(baseContext, assessment.output)
    const first = plan.output.iterations[0]

    const spec = await runSpecAgent({ ...baseContext, iterationId: 'iter_1' }, first)
    expect(spec.output.gherkinPath).toBe(first.gherkinPath)
    expect(Array.isArray(spec.output.files)).toBe(true)
    expect(spec.output.files).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: first.gherkinPath,
        }),
      ])
    )

    const tests = await runTestAgent({ ...baseContext, iterationId: 'iter_1' }, first)
    expect(tests.output.redStateConfirmed).toBe(true)
    expect(Array.isArray(tests.output.files)).toBe(true)
    expect(tests.output.files).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: expect.stringContaining('tests/e2e/steps/'),
        }),
        expect.objectContaining({
          path: expect.stringContaining('src/lib/iterations/'),
        }),
      ])
    )

    const code = await runCodeAgent({ ...baseContext, iterationId: 'iter_1' }, first, 1)
    expect(code.output.commitMessage).toContain('feat(iter-')
    expect(Array.isArray(code.output.files)).toBe(true)
    expect(code.output.files).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: expect.stringContaining(`src/lib/iterations/iter-${first.index}.ts`),
        }),
      ])
    )

    const review = await runReviewAgent({ ...baseContext, iterationId: 'iter_1' }, first)
    expect(review.output.approved).toBe(true)

    const recovery = await runRecoveryAgent(
      { ...baseContext, iterationId: 'iter_1' },
      first,
      1,
      ['BUILD']
    )
    expect(recovery.output.nextAttempt).toBe(2)

    const release = await runReleaseAgent(
      { ...baseContext, iterationId: 'iter_1' },
      first,
      'iter/run-1'
    )
    expect(release.output.mergeStrategy).toBe('squash')

    const deploy = await runDeployAgent({ ...baseContext, iterationId: 'iter_1' }, first)
    expect(deploy.output.deployed).toBe(true)
  })

  it('fails outside test mode when Claude runtime is not enabled', async () => {
    const originalNodeEnv = process.env.NODE_ENV
    const originalRuntimeFlag = process.env.AUTONOMOUS_DEV_LLM_AGENTS
    const originalApiKey = process.env.ANTHROPIC_API_KEY

    try {
      process.env.NODE_ENV = 'production'
      process.env.AUTONOMOUS_DEV_LLM_AGENTS = 'false'
      delete process.env.ANTHROPIC_API_KEY

      const assessment = await runAssessmentAgent(baseContext)
      const plan = await runIterationPlannerAgent(baseContext, assessment.output)
      const first = plan.output.iterations[0]

      await expect(
        runSpecAgent({ ...baseContext, iterationId: 'iter_1' }, first)
      ).rejects.toThrow('AGENT_RUNTIME_DISABLED:SpecAgent')
    } finally {
      if (typeof originalNodeEnv === 'undefined') {
        delete process.env.NODE_ENV
      } else {
        process.env.NODE_ENV = originalNodeEnv
      }

      if (typeof originalRuntimeFlag === 'undefined') {
        delete process.env.AUTONOMOUS_DEV_LLM_AGENTS
      } else {
        process.env.AUTONOMOUS_DEV_LLM_AGENTS = originalRuntimeFlag
      }

      if (typeof originalApiKey === 'undefined') {
        delete process.env.ANTHROPIC_API_KEY
      } else {
        process.env.ANTHROPIC_API_KEY = originalApiKey
      }
    }
  })
})
