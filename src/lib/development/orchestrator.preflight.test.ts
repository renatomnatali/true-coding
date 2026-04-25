import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { __resolveQualityGatePreflightForTest } from './orchestrator'

describe('orchestrator quality gate preflight', () => {
  it('reporta status do workspace com package.json e node_modules', async () => {
    const workspacePath = await fs.mkdtemp(path.join(os.tmpdir(), 'tc-preflight-ok-'))

    try {
      await fs.writeFile(path.join(workspacePath, 'package.json'), '{"name":"app"}', 'utf-8')
      await fs.mkdir(path.join(workspacePath, 'node_modules'), { recursive: true })

      const preflight = await __resolveQualityGatePreflightForTest(workspacePath)

      expect(preflight.workspacePath).toBe(workspacePath)
      expect(preflight.packageJsonPath).toBe(path.join(workspacePath, 'package.json'))
      expect(preflight.hasPackageJson).toBe(true)
      expect(preflight.hasNodeModules).toBe(true)
    } finally {
      await fs.rm(workspacePath, { recursive: true, force: true })
    }
  })

  it('reporta workspace sem package.json como não preparado', async () => {
    const workspacePath = await fs.mkdtemp(path.join(os.tmpdir(), 'tc-preflight-missing-'))

    try {
      const preflight = await __resolveQualityGatePreflightForTest(workspacePath)

      expect(preflight.hasPackageJson).toBe(false)
      expect(preflight.hasNodeModules).toBe(false)
    } finally {
      await fs.rm(workspacePath, { recursive: true, force: true })
    }
  })
})
