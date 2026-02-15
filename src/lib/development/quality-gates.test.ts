import os from 'node:os'
import path from 'node:path'
import fs from 'node:fs/promises'
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { __runQualityGatesWithExecutorForTest, runQualityGates } from './quality-gates'

describe('runQualityGates', () => {
  const originalExecuteGates = process.env.AUTONOMOUS_DEV_EXECUTE_GATES

  beforeEach(() => {
    process.env.AUTONOMOUS_DEV_EXECUTE_GATES = 'false'
  })

  afterEach(() => {
    if (typeof originalExecuteGates === 'undefined') {
      delete process.env.AUTONOMOUS_DEV_EXECUTE_GATES
    } else {
      process.env.AUTONOMOUS_DEV_EXECUTE_GATES = originalExecuteGates
    }
  })

  it('fails build/unit/bdd when execution is disabled in environment', async () => {
    const gates = await runQualityGates({
      runId: 'run_1',
      iterationId: 'iter_1',
      iterationIndex: 1,
      projectId: 'proj_1',
      workspacePath: process.cwd(),
      featureTags: ['@iter_core_features'],
    })

    expect(gates).toHaveLength(5)
    const build = gates.find((gate) => gate.gateType === 'BUILD')
    const unit = gates.find((gate) => gate.gateType === 'UNIT')
    const bdd = gates.find((gate) => gate.gateType === 'BDD')
    const review = gates.find((gate) => gate.gateType === 'REVIEW')
    const security = gates.find((gate) => gate.gateType === 'SECURITY')

    expect(build?.passed).toBe(false)
    expect(unit?.passed).toBe(false)
    expect(bdd?.passed).toBe(false)
    expect(build?.report?.reason).toBe('execution_disabled')
    expect(unit?.report?.reason).toBe('execution_disabled')
    expect(bdd?.report?.reason).toBe('execution_disabled')
    expect(review?.passed).toBe(true)
    expect(security?.passed).toBe(true)
  })

  it('fails build/unit/bdd with explicit reason when workspace is not prepared', async () => {
    process.env.AUTONOMOUS_DEV_EXECUTE_GATES = 'true'
    const workspacePath = await fs.mkdtemp(path.join(os.tmpdir(), 'tc-gates-'))

    try {
      const gates = await runQualityGates({
        runId: 'run_2',
        iterationId: 'iter_2',
        iterationIndex: 1,
        projectId: 'proj_1',
        workspacePath,
        featureTags: ['@iter_fundacao'],
      })

      const build = gates.find((gate) => gate.gateType === 'BUILD')
      const unit = gates.find((gate) => gate.gateType === 'UNIT')
      const bdd = gates.find((gate) => gate.gateType === 'BDD')

      expect(build?.passed).toBe(false)
      expect(unit?.passed).toBe(false)
      expect(bdd?.passed).toBe(false)
      expect(build?.report?.reason).toBe('workspace_not_prepared')
      expect(unit?.report?.reason).toBe('workspace_not_prepared')
      expect(bdd?.report?.reason).toBe('workspace_not_prepared')
    } finally {
      await fs.rm(workspacePath, { recursive: true, force: true })
    }
  })

  it('executes gates sequentially and marks downstream gates as skipped after first failure', async () => {
    process.env.AUTONOMOUS_DEV_EXECUTE_GATES = 'true'

    const executedCommands: string[] = []
    const gates = await __runQualityGatesWithExecutorForTest(
      {
        runId: 'run_3',
        iterationId: 'iter_3',
        iterationIndex: 1,
        projectId: 'proj_1',
        workspacePath: process.cwd(),
        featureTags: ['@iter_fundacao'],
      },
      async (command) => {
        const joined = command.join(' ')
        executedCommands.push(joined)

        if (joined === 'npm run build') {
          return {
            passed: false,
            log: [
              '> app@0.1.0 build',
              '> next build',
              'Error: build exploded',
            ].join('\n'),
          }
        }

        return { passed: true, log: 'ok' }
      },
      async () => ({ ok: true })
    )

    const build = gates.find((gate) => gate.gateType === 'BUILD')
    const unit = gates.find((gate) => gate.gateType === 'UNIT')
    const bdd = gates.find((gate) => gate.gateType === 'BDD')

    expect(executedCommands).toContain('npm run build')
    expect(executedCommands).not.toContain('npm run test')
    expect(executedCommands).not.toContain('npx vitest run tests/e2e/steps')

    expect(build?.passed).toBe(false)
    expect(unit?.passed).toBe(false)
    expect(bdd?.passed).toBe(false)
    expect(unit?.report?.reason).toBe('skipped_due_to_previous_failure')
    expect(bdd?.report?.reason).toBe('skipped_due_to_previous_failure')
  })
})
