import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { describe, expect, it, vi } from 'vitest'
import {
  executeGitCliRelease,
  GitCliReleaseError,
  maskSecretInText,
} from './git-release-cli'

describe('executeGitCliRelease', () => {
  it('runs git release pipeline in expected command order', async () => {
    const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'tc-release-cli-'))
    const commands: string[] = []

    const runner = vi.fn(async (input: {
      cmd: string
      args: string[]
      cwd: string
      env: NodeJS.ProcessEnv
    }) => {
      commands.push(`${input.cmd} ${input.args.join(' ')}`)

      if (input.args[0] === 'clone') {
        const clonePath = input.args[input.args.length - 1]
        await fs.mkdir(clonePath, { recursive: true })
      }

      if (input.args.join(' ') === 'rev-parse HEAD') {
        return {
          stdout: 'abc123def456\n',
          stderr: '',
        }
      }

      if (input.args.join(' ') === 'status --porcelain') {
        return {
          stdout: 'M  src/lib/iterations/iter-1.ts',
          stderr: '',
        }
      }

      return {
        stdout: '',
        stderr: '',
      }
    })

    const result = await executeGitCliRelease({
      repositoryCloneUrl: 'https://github.com/acme/app.git',
      repositoryHtmlUrl: 'https://github.com/acme/app',
      baseBranch: 'main',
      branchName: 'iter/run-1-fundacao',
      commitMessage: 'feat(iter-1): Fundacao',
      artifacts: [
        {
          path: 'src/lib/iterations/iter-1.ts',
          content: 'export const iter = 1\n',
        },
      ],
      accessToken: 'ghs_example_token',
      workspaceRoot: tempRoot,
      runCommand: runner,
    })

    expect(commands).toEqual([
      expect.stringContaining('git clone --depth 1 --branch main'),
      expect.stringContaining('git ls-remote --heads origin iter/run-1-fundacao'),
      expect.stringContaining('git checkout -B iter/run-1-fundacao'),
      expect.stringContaining('git add --all'),
      expect.stringContaining('git status --porcelain'),
      expect.stringContaining('git commit -m feat(iter-1): Fundacao'),
      expect.stringContaining('git push origin iter/run-1-fundacao'),
      expect.stringContaining('git rev-parse HEAD'),
    ])

    expect(result.branchName).toBe('iter/run-1-fundacao')
    expect(result.commitSha).toBe('abc123def456')
    expect(result.checkpoints.map((checkpoint) => checkpoint.step)).toEqual([
      'clone',
      'checkout',
      'write',
      'commit',
      'push',
    ])
  })

  it('masks sensitive credentials from logs', () => {
    const masked = maskSecretInText(
      'fatal: could not read from https://x-access-token:ghs_123456789@github.com/acme/app.git'
    )
    expect(masked).toContain('***')
    expect(masked).not.toContain('ghs_123456789')
  })

  it('throws structured error with release step on git failure', async () => {
    const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'tc-release-cli-fail-'))

    const runner = vi.fn(async (input: {
      cmd: string
      args: string[]
      cwd: string
      env: NodeJS.ProcessEnv
    }) => {
      if (input.args[0] === 'clone') {
        const clonePath = input.args[input.args.length - 1]
        await fs.mkdir(clonePath, { recursive: true })
        return { stdout: '', stderr: '' }
      }

      if (input.args[0] === 'push') {
        throw new Error('fatal: could not push due to auth token ghs_123456789')
      }

      return { stdout: '', stderr: '' }
    })

    await expect(
      executeGitCliRelease({
        repositoryCloneUrl: 'https://github.com/acme/app.git',
        repositoryHtmlUrl: 'https://github.com/acme/app',
        baseBranch: 'main',
        branchName: 'iter/run-2-core',
        commitMessage: 'feat(iter-2): Core',
        artifacts: [
          {
            path: 'README.md',
            content: '# hello\n',
          },
        ],
        accessToken: 'ghs_example_token',
        workspaceRoot: tempRoot,
        runCommand: runner,
      })
    ).rejects.toMatchObject<Partial<GitCliReleaseError>>({
      phase: 'release',
      step: 'push',
    })
  })
})
