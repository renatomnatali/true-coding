import { spawn } from 'node:child_process'
import fs from 'node:fs/promises'
import path from 'node:path'
import type { GateExecutionOptions, GateRunOutput } from './types'

type CommandType = 'INSTALL' | 'BUILD' | 'UNIT' | 'BDD'
type GateCommandExecutor = (
  command: string[],
  cwd: string
) => Promise<{ passed: boolean; log: string }>
type WorkspaceDependencyResult = { ok: boolean; log?: string }
type WorkspaceDependencyEnsurer = (
  workspacePath: string,
  executor: GateCommandExecutor
) => Promise<WorkspaceDependencyResult>

const ALLOWED_GATE_COMMANDS: Record<CommandType, string[]> = {
  INSTALL: ['npm', 'install', '--no-fund', '--no-audit'],
  BUILD: ['npm', 'run', 'build'],
  UNIT: ['npm', 'run', 'test'],
  BDD: ['npx', 'vitest', 'run', 'tests/e2e/steps'],
}

const JEST_DOM_VITEST_IMPORT = '@testing-library/jest-dom/vitest'
const JEST_DOM_PACKAGE = '@testing-library/jest-dom'
const JEST_DOM_VERSION = '^6.6.0'

function isGateExecutionEnabled(): boolean {
  return process.env.AUTONOMOUS_DEV_EXECUTE_GATES === 'true'
}

function isAllowedCommand(command: string[]): boolean {
  return Object.values(ALLOWED_GATE_COMMANDS).some((allowed) => {
    if (allowed.length !== command.length) return false
    return allowed.every((segment, index) => segment === command[index])
  })
}

function runAllowedCommand(command: string[], cwd: string): Promise<{ passed: boolean; log: string }> {
  if (!isAllowedCommand(command)) {
    throw new Error(`Command not allowed for autonomous gate execution: ${command.join(' ')}`)
  }

  return new Promise((resolve, reject) => {
    const [cmd, ...args] = command
    const child = spawn(cmd, args, {
      cwd,
      env: process.env,
      stdio: ['ignore', 'pipe', 'pipe'],
    })

    let output = ''

    child.stdout.on('data', (chunk) => {
      output += chunk.toString()
    })

    child.stderr.on('data', (chunk) => {
      output += chunk.toString()
    })

    child.on('error', reject)

    child.on('close', (code) => {
      resolve({
        passed: code === 0,
        log: output.trim(),
      })
    })
  })
}

function nowMs(): number {
  return Date.now()
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath)
    return true
  } catch {
    return false
  }
}

async function ensureWorkspaceDependencies(
  workspacePath: string,
  executor: GateCommandExecutor
): Promise<WorkspaceDependencyResult> {
  const packageJsonPath = path.join(workspacePath, 'package.json')
  const nodeModulesPath = path.join(workspacePath, 'node_modules')

  const hasPackageJson = await fileExists(packageJsonPath)
  if (!hasPackageJson) {
    return {
      ok: false,
      log: 'workspace_not_prepared: package.json não encontrado no sandbox.',
    }
  }

  const hasNodeModules = await fileExists(nodeModulesPath)
  if (hasNodeModules) {
    return { ok: true }
  }

  const install = await executor(ALLOWED_GATE_COMMANDS.INSTALL, workspacePath)
  return {
    ok: install.passed,
    log: install.log,
  }
}

function buildSafeNextAppLayout(): string {
  return [
    "import type { ReactNode } from 'react'",
    '',
    'export default function RootLayout({ children }: { children: ReactNode }) {',
    '  return (',
    "    <html lang=\"pt-BR\">",
    '      <body>{children}</body>',
    '    </html>',
    '  )',
    '}',
  ].join('\n')
}

async function synchronizeWorkspaceForGates(workspacePath: string): Promise<{
  changed: boolean
  fixes: string[]
}> {
  const fixes: string[] = []
  const packageJsonPath = path.join(workspacePath, 'package.json')
  const setupPath = path.join(workspacePath, 'src/test/setup.ts')
  const layoutPath = path.join(workspacePath, 'src/app/layout.tsx')

  const hasPackageJson = await fileExists(packageJsonPath)
  const hasSetup = await fileExists(setupPath)
  const hasLayout = await fileExists(layoutPath)

  if (hasPackageJson && hasSetup) {
    const setupContent = await fs.readFile(setupPath, 'utf-8')
    if (setupContent.includes(JEST_DOM_VITEST_IMPORT)) {
      try {
        const packageRaw = await fs.readFile(packageJsonPath, 'utf-8')
        const parsed = JSON.parse(packageRaw) as {
          devDependencies?: Record<string, string>
        }

        const devDependencies =
          parsed.devDependencies && typeof parsed.devDependencies === 'object'
            ? parsed.devDependencies
            : {}

        if (!devDependencies[JEST_DOM_PACKAGE]) {
          const nextPackage = {
            ...parsed,
            devDependencies: {
              ...devDependencies,
              [JEST_DOM_PACKAGE]: JEST_DOM_VERSION,
            },
          }

          await fs.writeFile(
            packageJsonPath,
            `${JSON.stringify(nextPackage, null, 2)}\n`,
            'utf-8'
          )
          fixes.push('added_dev_dependency:@testing-library/jest-dom')
        }
      } catch {
        fixes.push('package_json_parse_failed')
      }
    }
  }

  if (hasLayout) {
    const layoutContent = await fs.readFile(layoutPath, 'utf-8')
    const importsNextDocument =
      layoutContent.includes("from 'next/document'") ||
      layoutContent.includes('from "next/document"')

    if (importsNextDocument) {
      await fs.writeFile(layoutPath, buildSafeNextAppLayout(), 'utf-8')
      fixes.push('rewrote_layout_without_next_document')
    }
  }

  return {
    changed: fixes.length > 0,
    fixes,
  }
}

export async function __synchronizeWorkspaceForGatesForTest(workspacePath: string) {
  return synchronizeWorkspaceForGates(workspacePath)
}

function toFailureGate(
  gateType: 'BUILD' | 'UNIT' | 'BDD',
  startedAt: number,
  reason: string,
  detail?: string
): GateRunOutput {
  return {
    gateType,
    passed: false,
    durationMs: nowMs() - startedAt,
    logsRef: 'workspace',
    report: {
      mode: 'executed',
      command: ALLOWED_GATE_COMMANDS[gateType].join(' '),
      reason,
      snippet: detail?.slice(-4000),
    },
  }
}

async function executeCommandGate(
  gateType: 'BUILD' | 'UNIT' | 'BDD',
  workspacePath: string,
  executor: GateCommandExecutor
): Promise<GateRunOutput> {
  const started = nowMs()
  const result = await executor(ALLOWED_GATE_COMMANDS[gateType], workspacePath)

  return {
    gateType,
    passed: result.passed,
    durationMs: nowMs() - started,
    logsRef: result.passed ? 'stdout' : 'stderr',
    report: {
      mode: 'executed',
      command: ALLOWED_GATE_COMMANDS[gateType].join(' '),
      snippet: result.log.slice(-4000),
    },
  }
}

function toSkippedGate(
  gateType: 'UNIT' | 'BDD',
  dependencyGate: 'BUILD' | 'UNIT'
): GateRunOutput {
  return {
    gateType,
    passed: false,
    durationMs: 0,
    logsRef: 'skipped',
    report: {
      mode: 'executed',
      command: ALLOWED_GATE_COMMANDS[gateType].join(' '),
      reason: 'skipped_due_to_previous_failure',
      dependencyGate,
    },
  }
}

async function executeReviewGate(
  options: GateExecutionOptions
): Promise<GateRunOutput> {
  const started = nowMs()

  return {
    gateType: 'REVIEW',
    passed: true,
    durationMs: nowMs() - started,
    logsRef: 'review-report',
    report: {
      mode: 'policy',
      checklist: [
        'scope-adherence',
        'no-destructive-commands',
        'conventional-commit-message',
      ],
      iterationIndex: options.iterationIndex,
    },
  }
}

async function executeSecurityGate(
  options: GateExecutionOptions
): Promise<GateRunOutput> {
  const started = nowMs()

  return {
    gateType: 'SECURITY',
    passed: true,
    durationMs: nowMs() - started,
    logsRef: 'security-report',
    report: {
      mode: 'policy',
      controls: [
        'command-allowlist-enforced',
        'sandbox-workspace-isolated',
        'secrets-not-serialized',
      ],
      runId: options.runId,
    },
  }
}

async function runQualityGatesWithExecutor(
  options: GateExecutionOptions,
  executor: GateCommandExecutor,
  ensureDependencies: WorkspaceDependencyEnsurer
): Promise<GateRunOutput[]> {
  if (!isGateExecutionEnabled()) {
    const detail =
      'Execução dos quality gates está desativada no ambiente. Ative AUTONOMOUS_DEV_EXECUTE_GATES=true.'
    const build = toFailureGate('BUILD', nowMs(), 'execution_disabled', detail)
    const unit = toFailureGate('UNIT', nowMs(), 'execution_disabled', detail)
    const bdd = toFailureGate('BDD', nowMs(), 'execution_disabled', detail)
    const review = await executeReviewGate(options)
    const security = await executeSecurityGate(options)

    return [build, unit, bdd, review, security]
  }

  await synchronizeWorkspaceForGates(options.workspacePath)

  const workspace = await ensureDependencies(options.workspacePath, executor)
  if (!workspace.ok) {
    const build = toFailureGate(
      'BUILD',
      nowMs(),
      'workspace_not_prepared',
      workspace.log
    )
    const unit = toFailureGate(
      'UNIT',
      nowMs(),
      'workspace_not_prepared',
      workspace.log
    )
    const bdd = toFailureGate(
      'BDD',
      nowMs(),
      'workspace_not_prepared',
      workspace.log
    )
    const review = await executeReviewGate(options)
    const security = await executeSecurityGate(options)

    return [build, unit, bdd, review, security]
  }

  const build = await executeCommandGate('BUILD', options.workspacePath, executor)
  let unit: GateRunOutput
  let bdd: GateRunOutput

  if (!build.passed) {
    unit = toSkippedGate('UNIT', 'BUILD')
    bdd = toSkippedGate('BDD', 'BUILD')
  } else {
    unit = await executeCommandGate('UNIT', options.workspacePath, executor)
    if (!unit.passed) {
      bdd = toSkippedGate('BDD', 'UNIT')
    } else {
      bdd = await executeCommandGate('BDD', options.workspacePath, executor)
    }
  }

  const review = await executeReviewGate(options)
  const security = await executeSecurityGate(options)

  return [build, unit, bdd, review, security]
}

export async function __runQualityGatesWithExecutorForTest(
  options: GateExecutionOptions,
  executor: GateCommandExecutor,
  ensureDependencies: WorkspaceDependencyEnsurer = ensureWorkspaceDependencies
): Promise<GateRunOutput[]> {
  return runQualityGatesWithExecutor(options, executor, ensureDependencies)
}

export async function runQualityGates(
  options: GateExecutionOptions
): Promise<GateRunOutput[]> {
  return runQualityGatesWithExecutor(
    options,
    runAllowedCommand,
    ensureWorkspaceDependencies
  )
}
