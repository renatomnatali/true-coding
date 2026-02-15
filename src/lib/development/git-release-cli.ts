import { spawn } from 'node:child_process'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

export type GitReleaseStep = 'clone' | 'checkout' | 'write' | 'commit' | 'push'

export interface GitCliReleaseArtifact {
  path: string
  content: string
}

export interface GitReleaseCheckpoint {
  phase: 'release'
  step: GitReleaseStep
  summary: string
  durationMs: number
}

export interface ExecuteGitCliReleaseInput {
  repositoryCloneUrl: string
  repositoryHtmlUrl: string
  baseBranch: string
  branchName: string
  commitMessage: string
  artifacts: GitCliReleaseArtifact[]
  accessToken: string
  workspaceRoot?: string
  keepWorkspace?: boolean
  runCommand?: GitCommandRunner
  onCheckpoint?: (checkpoint: GitReleaseCheckpoint) => Promise<void> | void
}

export interface ExecuteGitCliReleaseResult {
  branchName: string
  commitSha: string
  checkpoints: GitReleaseCheckpoint[]
}

export interface GitCommandInput {
  cmd: string
  args: string[]
  cwd: string
  env: NodeJS.ProcessEnv
}

export interface GitCommandResult {
  stdout: string
  stderr: string
}

export type GitCommandRunner = (input: GitCommandInput) => Promise<GitCommandResult>

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export function maskSecretInText(text: string, secrets: string[] = []): string {
  let masked = text
  masked = masked.replace(/x-access-token:[^@\s]+@/gi, 'x-access-token:***@')
  masked = masked.replace(/(https?:\/\/)([^:@/\s]+):([^@/\s]+)@/gi, '$1$2:***@')

  for (const secret of secrets) {
    if (!secret || secret.trim().length === 0) continue
    masked = masked.replace(new RegExp(escapeRegExp(secret), 'g'), '***')
  }

  return masked
}

function sanitizeArtifactPath(filePath: string): string {
  const normalized = filePath.trim().replace(/\/+/g, '/').replace(/^\.\//, '')
  if (
    normalized.length === 0 ||
    normalized.startsWith('/') ||
    normalized.includes('..') ||
    normalized.includes('\0')
  ) {
    throw new Error(`INVALID_WORKSPACE_PATH:${filePath}`)
  }
  return normalized
}

export class GitCliReleaseError extends Error {
  readonly phase = 'release'
  readonly step: GitReleaseStep
  readonly summary: string
  readonly details?: string

  constructor(step: GitReleaseStep, summary: string, details?: string) {
    super(`phase=release step=${step}: ${summary}`)
    this.name = 'GitCliReleaseError'
    this.step = step
    this.summary = summary
    this.details = details
  }
}

const defaultRunCommand: GitCommandRunner = ({ cmd, args, cwd, env }) =>
  new Promise((resolve, reject) => {
    const child = spawn(cmd, args, {
      cwd,
      env,
      stdio: ['ignore', 'pipe', 'pipe'],
    })

    let stdout = ''
    let stderr = ''

    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString()
    })
    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString()
    })

    child.on('error', reject)

    child.on('close', (code) => {
      if (code === 0) {
        resolve({ stdout: stdout.trim(), stderr: stderr.trim() })
        return
      }

      const error = new Error(
        [`Command failed: ${cmd} ${args.join(' ')}`, stdout.trim(), stderr.trim()]
          .filter((line) => line.length > 0)
          .join('\n')
      )
      reject(error)
    })
  })

async function runGitCommand(
  input: {
    step: GitReleaseStep
    cwd: string
    env: NodeJS.ProcessEnv
    args: string[]
    runner: GitCommandRunner
    secret: string
    fallbackSummary: string
  }
): Promise<GitCommandResult> {
  try {
    return await input.runner({
      cmd: 'git',
      args: input.args,
      cwd: input.cwd,
      env: input.env,
    })
  } catch (error) {
    const raw = error instanceof Error ? error.message : String(error)
    const safe = maskSecretInText(raw, [input.secret])
    throw new GitCliReleaseError(input.step, input.fallbackSummary, safe.slice(-4000))
  }
}

async function emitCheckpoint(
  input: {
    checkpoints: GitReleaseCheckpoint[]
    onCheckpoint?: (checkpoint: GitReleaseCheckpoint) => Promise<void> | void
    step: GitReleaseStep
    summary: string
    startedAtMs: number
  }
) {
  const checkpoint: GitReleaseCheckpoint = {
    phase: 'release',
    step: input.step,
    summary: input.summary,
    durationMs: Math.max(0, Date.now() - input.startedAtMs),
  }
  input.checkpoints.push(checkpoint)
  await input.onCheckpoint?.(checkpoint)
}

export async function executeGitCliRelease(
  input: ExecuteGitCliReleaseInput
): Promise<ExecuteGitCliReleaseResult> {
  const workspaceBase = path.resolve(input.workspaceRoot ?? os.tmpdir())
  const tempDir = await fs.mkdtemp(path.join(workspaceBase, 'true-coding-release-'))
  const cloneDir = path.join(tempDir, 'repo')
  const askPassPath = path.join(tempDir, 'git-askpass.sh')
  const checkpoints: GitReleaseCheckpoint[] = []

  const runner = input.runCommand ?? defaultRunCommand

  try {
    await fs.writeFile(
      askPassPath,
      [
        '#!/bin/sh',
        'case "$1" in',
        '  *Username*) echo "x-access-token" ;;',
        '  *) echo "$GIT_PASSWORD" ;;',
        'esac',
      ].join('\n'),
      'utf-8'
    )
    await fs.chmod(askPassPath, 0o700)

    const gitEnv: NodeJS.ProcessEnv = {
      ...process.env,
      GIT_TERMINAL_PROMPT: '0',
      GIT_ASKPASS: askPassPath,
      GIT_PASSWORD: input.accessToken,
      GCM_INTERACTIVE: 'never',
    }

    const cloneStart = Date.now()
    await runGitCommand({
      step: 'clone',
      cwd: tempDir,
      env: gitEnv,
      args: ['clone', '--depth', '1', '--branch', input.baseBranch, input.repositoryCloneUrl, cloneDir],
      runner,
      secret: input.accessToken,
      fallbackSummary: 'clone_failed',
    })
    await emitCheckpoint({
      checkpoints,
      onCheckpoint: input.onCheckpoint,
      step: 'clone',
      summary: `base=${input.baseBranch}`,
      startedAtMs: cloneStart,
    })

    const checkoutStart = Date.now()
    const remoteBranch = await runGitCommand({
      step: 'checkout',
      cwd: cloneDir,
      env: gitEnv,
      args: ['ls-remote', '--heads', 'origin', input.branchName],
      runner,
      secret: input.accessToken,
      fallbackSummary: 'ls_remote_failed',
    })
    const branchExists = remoteBranch.stdout.trim().length > 0

    if (branchExists) {
      await runGitCommand({
        step: 'checkout',
        cwd: cloneDir,
        env: gitEnv,
        args: ['fetch', 'origin', input.branchName],
        runner,
        secret: input.accessToken,
        fallbackSummary: 'fetch_branch_failed',
      })
      await runGitCommand({
        step: 'checkout',
        cwd: cloneDir,
        env: gitEnv,
        args: ['checkout', '-B', input.branchName, 'FETCH_HEAD'],
        runner,
        secret: input.accessToken,
        fallbackSummary: 'checkout_branch_failed',
      })
    } else {
      await runGitCommand({
        step: 'checkout',
        cwd: cloneDir,
        env: gitEnv,
        args: ['checkout', '-B', input.branchName],
        runner,
        secret: input.accessToken,
        fallbackSummary: 'checkout_branch_failed',
      })
    }

    await emitCheckpoint({
      checkpoints,
      onCheckpoint: input.onCheckpoint,
      step: 'checkout',
      summary: branchExists ? `reused=${input.branchName}` : `created=${input.branchName}`,
      startedAtMs: checkoutStart,
    })

    const writeStart = Date.now()
    for (const artifact of input.artifacts) {
      const safePath = sanitizeArtifactPath(artifact.path)
      const absolutePath = path.join(cloneDir, safePath)
      await fs.mkdir(path.dirname(absolutePath), { recursive: true })
      await fs.writeFile(absolutePath, artifact.content, 'utf-8')
    }
    await emitCheckpoint({
      checkpoints,
      onCheckpoint: input.onCheckpoint,
      step: 'write',
      summary: `files=${input.artifacts.length}`,
      startedAtMs: writeStart,
    })

    const commitStart = Date.now()
    await runGitCommand({
      step: 'commit',
      cwd: cloneDir,
      env: gitEnv,
      args: ['add', '--all'],
      runner,
      secret: input.accessToken,
      fallbackSummary: 'git_add_failed',
    })

    const status = await runGitCommand({
      step: 'commit',
      cwd: cloneDir,
      env: gitEnv,
      args: ['status', '--porcelain'],
      runner,
      secret: input.accessToken,
      fallbackSummary: 'git_status_failed',
    })

    let commitSummary = 'no_changes'
    if (status.stdout.trim().length > 0) {
      await runGitCommand({
        step: 'commit',
        cwd: cloneDir,
        env: gitEnv,
        args: ['commit', '-m', input.commitMessage, '--no-gpg-sign'],
        runner,
        secret: input.accessToken,
        fallbackSummary: 'git_commit_failed',
      })
      commitSummary = 'created'
    }

    await emitCheckpoint({
      checkpoints,
      onCheckpoint: input.onCheckpoint,
      step: 'commit',
      summary: commitSummary,
      startedAtMs: commitStart,
    })

    const pushStart = Date.now()
    await runGitCommand({
      step: 'push',
      cwd: cloneDir,
      env: gitEnv,
      args: ['push', 'origin', input.branchName],
      runner,
      secret: input.accessToken,
      fallbackSummary: 'git_push_failed',
    })
    await emitCheckpoint({
      checkpoints,
      onCheckpoint: input.onCheckpoint,
      step: 'push',
      summary: `origin/${input.branchName}`,
      startedAtMs: pushStart,
    })

    const head = await runGitCommand({
      step: 'push',
      cwd: cloneDir,
      env: gitEnv,
      args: ['rev-parse', 'HEAD'],
      runner,
      secret: input.accessToken,
      fallbackSummary: 'git_rev_parse_failed',
    })

    return {
      branchName: input.branchName,
      commitSha: head.stdout.trim(),
      checkpoints,
    }
  } finally {
    if (!input.keepWorkspace) {
      await fs.rm(tempDir, { recursive: true, force: true })
    }
  }
}

