import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { scanWorkspaceFiles, scanWorkspaceForEnvFiles, type ScanCheck } from './code-scanner'
import { __runQualityGatesWithExecutorForTest } from './quality-gates'

const tempDirs: string[] = []

async function createWorkspace(): Promise<string> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'tc-scanner-'))
  tempDirs.push(dir)
  return dir
}

describe('code-scanner', () => {
  afterEach(async () => {
    await Promise.all(
      tempDirs.splice(0).map((dir) => fs.rm(dir, { recursive: true, force: true }))
    )
  })

  it('detects patterns matching scan checks', async () => {
    const workspace = await createWorkspace()
    await fs.mkdir(path.join(workspace, 'src'), { recursive: true })

    await fs.writeFile(
      path.join(workspace, 'src/bad.ts'),
      [
        'const result = eval("1 + 2")',
        'console.log("debug")',
        'const safe = 42',
      ].join('\n'),
      'utf-8'
    )

    const checks: ScanCheck[] = [
      { name: 'eval_usage', pattern: /\beval\s*\(/, severity: 'fail' },
      { name: 'console_debug', pattern: /\bconsole\.log\s*\(/, severity: 'warn' },
    ]

    const findings = await scanWorkspaceFiles(workspace, checks)

    expect(findings).toHaveLength(2)
    expect(findings[0]).toEqual(
      expect.objectContaining({ file: 'src/bad.ts', line: 1, check: 'eval_usage', severity: 'fail' })
    )
    expect(findings[1]).toEqual(
      expect.objectContaining({ file: 'src/bad.ts', line: 2, check: 'console_debug', severity: 'warn' })
    )
  })

  it('skips node_modules and non-source files', async () => {
    const workspace = await createWorkspace()
    await fs.mkdir(path.join(workspace, 'node_modules/pkg'), { recursive: true })
    await fs.mkdir(path.join(workspace, 'src'), { recursive: true })

    await fs.writeFile(path.join(workspace, 'node_modules/pkg/index.js'), 'eval("x")', 'utf-8')
    await fs.writeFile(path.join(workspace, 'README.md'), 'eval("y")', 'utf-8')
    await fs.writeFile(path.join(workspace, 'src/ok.ts'), 'const x = 1', 'utf-8')

    const checks: ScanCheck[] = [
      { name: 'eval_usage', pattern: /\beval\s*\(/, severity: 'fail' },
    ]

    const findings = await scanWorkspaceFiles(workspace, checks)
    expect(findings).toHaveLength(0)
  })

  it('detects .env files but not .env.example', async () => {
    const workspace = await createWorkspace()
    await fs.writeFile(path.join(workspace, '.env'), 'SECRET=abc', 'utf-8')
    await fs.writeFile(path.join(workspace, '.env.local'), 'SECRET=def', 'utf-8')
    await fs.writeFile(path.join(workspace, '.env.example'), 'SECRET=xxx', 'utf-8')

    const findings = await scanWorkspaceForEnvFiles(workspace)
    expect(findings).toHaveLength(2)
    expect(findings.map((f) => f.file).sort()).toEqual(['.env', '.env.local'])
    expect(findings.every((f) => f.severity === 'fail')).toBe(true)
  })
})

describe('REVIEW gate', () => {
  afterEach(async () => {
    await Promise.all(
      tempDirs.splice(0).map((dir) => fs.rm(dir, { recursive: true, force: true }))
    )
  })

  it('fails when eval() is found in workspace code', async () => {
    process.env.AUTONOMOUS_DEV_EXECUTE_GATES = 'true'
    const workspace = await createWorkspace()
    await fs.mkdir(path.join(workspace, 'src'), { recursive: true })

    await fs.writeFile(
      path.join(workspace, 'package.json'),
      JSON.stringify({ name: 'app', scripts: { build: 'echo ok', test: 'echo ok' } }),
      'utf-8'
    )
    await fs.writeFile(
      path.join(workspace, 'src/danger.ts'),
      'export const x = eval("1+2")\n',
      'utf-8'
    )

    const gates = await __runQualityGatesWithExecutorForTest(
      {
        runId: 'run_review',
        iterationId: 'iter_1',
        iterationIndex: 1,
        projectId: 'proj_1',
        workspacePath: workspace,
        featureTags: ['@test'],
      },
      async () => ({ passed: true, log: 'ok' }),
      async () => ({ ok: true })
    )

    const review = gates.find((g) => g.gateType === 'REVIEW')
    expect(review?.passed).toBe(false)
    expect(review?.report?.mode).toBe('static_analysis')

    const findings = review?.report?.findings as Array<{ check: string; severity: string }>
    expect(findings.some((f) => f.check === 'eval_usage' && f.severity === 'fail')).toBe(true)
  })

  it('passes when workspace has only warnings', async () => {
    process.env.AUTONOMOUS_DEV_EXECUTE_GATES = 'true'
    const workspace = await createWorkspace()
    await fs.mkdir(path.join(workspace, 'src'), { recursive: true })

    await fs.writeFile(
      path.join(workspace, 'package.json'),
      JSON.stringify({ name: 'app', scripts: { build: 'echo ok', test: 'echo ok' } }),
      'utf-8'
    )
    await fs.writeFile(
      path.join(workspace, 'src/app.ts'),
      'console.log("hello")\n',
      'utf-8'
    )

    const gates = await __runQualityGatesWithExecutorForTest(
      {
        runId: 'run_review_pass',
        iterationId: 'iter_1',
        iterationIndex: 1,
        projectId: 'proj_1',
        workspacePath: workspace,
        featureTags: ['@test'],
      },
      async () => ({ passed: true, log: 'ok' }),
      async () => ({ ok: true })
    )

    const review = gates.find((g) => g.gateType === 'REVIEW')
    expect(review?.passed).toBe(true)

    const summary = review?.report?.summary as { warnCount: number }
    expect(summary.warnCount).toBeGreaterThanOrEqual(1)
  })

  it('detects dangerouslySetInnerHTML as fail', async () => {
    process.env.AUTONOMOUS_DEV_EXECUTE_GATES = 'true'
    const workspace = await createWorkspace()
    await fs.mkdir(path.join(workspace, 'src'), { recursive: true })

    await fs.writeFile(
      path.join(workspace, 'package.json'),
      JSON.stringify({ name: 'app', scripts: { build: 'echo ok', test: 'echo ok' } }),
      'utf-8'
    )
    await fs.writeFile(
      path.join(workspace, 'src/page.tsx'),
      '<div dangerouslySetInnerHTML={{ __html: userInput }} />\n',
      'utf-8'
    )

    const gates = await __runQualityGatesWithExecutorForTest(
      {
        runId: 'run_review_html',
        iterationId: 'iter_1',
        iterationIndex: 1,
        projectId: 'proj_1',
        workspacePath: workspace,
        featureTags: ['@test'],
      },
      async () => ({ passed: true, log: 'ok' }),
      async () => ({ ok: true })
    )

    const review = gates.find((g) => g.gateType === 'REVIEW')
    expect(review?.passed).toBe(false)
  })
})

describe('SECURITY gate', () => {
  afterEach(async () => {
    await Promise.all(
      tempDirs.splice(0).map((dir) => fs.rm(dir, { recursive: true, force: true }))
    )
  })

  it('fails when .env file is present in workspace', async () => {
    process.env.AUTONOMOUS_DEV_EXECUTE_GATES = 'true'
    const workspace = await createWorkspace()

    await fs.writeFile(
      path.join(workspace, 'package.json'),
      JSON.stringify({ name: 'app', scripts: { build: 'echo ok', test: 'echo ok' } }),
      'utf-8'
    )
    await fs.writeFile(path.join(workspace, '.env'), 'API_KEY=secret', 'utf-8')

    const gates = await __runQualityGatesWithExecutorForTest(
      {
        runId: 'run_sec_env',
        iterationId: 'iter_1',
        iterationIndex: 1,
        projectId: 'proj_1',
        workspacePath: workspace,
        featureTags: ['@test'],
      },
      async () => ({ passed: true, log: 'ok' }),
      async () => ({ ok: true })
    )

    const security = gates.find((g) => g.gateType === 'SECURITY')
    expect(security?.passed).toBe(false)

    const findings = security?.report?.findings as Array<{ check: string }>
    expect(findings.some((f) => f.check === 'env_file_committed')).toBe(true)
  })

  it('fails when innerHTML assignment is found', async () => {
    process.env.AUTONOMOUS_DEV_EXECUTE_GATES = 'true'
    const workspace = await createWorkspace()
    await fs.mkdir(path.join(workspace, 'src'), { recursive: true })

    await fs.writeFile(
      path.join(workspace, 'package.json'),
      JSON.stringify({ name: 'app', scripts: { build: 'echo ok', test: 'echo ok' } }),
      'utf-8'
    )
    await fs.writeFile(
      path.join(workspace, 'src/xss.ts'),
      'element.innerHTML = userInput\n',
      'utf-8'
    )

    const gates = await __runQualityGatesWithExecutorForTest(
      {
        runId: 'run_sec_xss',
        iterationId: 'iter_1',
        iterationIndex: 1,
        projectId: 'proj_1',
        workspacePath: workspace,
        featureTags: ['@test'],
      },
      async () => ({ passed: true, log: 'ok' }),
      async () => ({ ok: true })
    )

    const security = gates.find((g) => g.gateType === 'SECURITY')
    expect(security?.passed).toBe(false)

    const findings = security?.report?.findings as Array<{ check: string }>
    expect(findings.some((f) => f.check === 'xss_vector')).toBe(true)
  })

  it('passes clean workspace with only warnings', async () => {
    process.env.AUTONOMOUS_DEV_EXECUTE_GATES = 'true'
    const workspace = await createWorkspace()
    await fs.mkdir(path.join(workspace, 'src'), { recursive: true })

    await fs.writeFile(
      path.join(workspace, 'package.json'),
      JSON.stringify({ name: 'app', scripts: { build: 'echo ok', test: 'echo ok' } }),
      'utf-8'
    )
    await fs.writeFile(path.join(workspace, '.env.example'), 'KEY=xxx', 'utf-8')
    await fs.writeFile(
      path.join(workspace, 'src/safe.ts'),
      'export const greeting = "olá"\n',
      'utf-8'
    )

    const gates = await __runQualityGatesWithExecutorForTest(
      {
        runId: 'run_sec_clean',
        iterationId: 'iter_1',
        iterationIndex: 1,
        projectId: 'proj_1',
        workspacePath: workspace,
        featureTags: ['@test'],
      },
      async () => ({ passed: true, log: 'ok' }),
      async () => ({ ok: true })
    )

    const security = gates.find((g) => g.gateType === 'SECURITY')
    expect(security?.passed).toBe(true)
  })

  it('detects hardcoded secrets as fail', async () => {
    process.env.AUTONOMOUS_DEV_EXECUTE_GATES = 'true'
    const workspace = await createWorkspace()
    await fs.mkdir(path.join(workspace, 'src'), { recursive: true })

    await fs.writeFile(
      path.join(workspace, 'package.json'),
      JSON.stringify({ name: 'app', scripts: { build: 'echo ok', test: 'echo ok' } }),
      'utf-8'
    )
    await fs.writeFile(
      path.join(workspace, 'src/config.ts'),
      'const apiKey = "sk-1234567890abcdefghijklmnop"\n',
      'utf-8'
    )

    const gates = await __runQualityGatesWithExecutorForTest(
      {
        runId: 'run_sec_secret',
        iterationId: 'iter_1',
        iterationIndex: 1,
        projectId: 'proj_1',
        workspacePath: workspace,
        featureTags: ['@test'],
      },
      async () => ({ passed: true, log: 'ok' }),
      async () => ({ ok: true })
    )

    const security = gates.find((g) => g.gateType === 'SECURITY')
    expect(security?.passed).toBe(false)

    const findings = security?.report?.findings as Array<{ check: string }>
    expect(findings.some((f) => f.check === 'hardcoded_secret')).toBe(true)
  })
})
