import { beforeEach, describe, expect, it, vi } from 'vitest'

const {
  prismaMock,
  decryptMock,
  createGitHubClientMock,
  getRepositoryMock,
  findOpenPullRequestByHeadBaseMock,
  createPullRequestMock,
  mergePullRequestMock,
  executeGitCliReleaseMock,
} = vi.hoisted(() => ({
  prismaMock: {
    project: {
      findUnique: vi.fn(),
    },
  },
  decryptMock: vi.fn(),
  createGitHubClientMock: vi.fn(),
  getRepositoryMock: vi.fn(),
  findOpenPullRequestByHeadBaseMock: vi.fn(),
  createPullRequestMock: vi.fn(),
  mergePullRequestMock: vi.fn(),
  executeGitCliReleaseMock: vi.fn(),
}))

vi.mock('@/lib/db/prisma', () => ({
  prisma: prismaMock,
}))

vi.mock('@/lib/crypto', () => ({
  decrypt: decryptMock,
}))

vi.mock('@/lib/github/client', () => ({
  createGitHubClient: createGitHubClientMock,
  getRepository: getRepositoryMock,
  findOpenPullRequestByHeadBase: findOpenPullRequestByHeadBaseMock,
  createPullRequest: createPullRequestMock,
  mergePullRequest: mergePullRequestMock,
}))

vi.mock('./git-release-cli', () => ({
  executeGitCliRelease: executeGitCliReleaseMock,
}))

import { executeIterationGitRelease } from './gitops'

describe('executeIterationGitRelease', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('uses git CLI release path and merges PR', async () => {
    prismaMock.project.findUnique.mockResolvedValue({
      id: 'proj-1',
      githubRepoOwner: 'acme',
      githubRepoName: 'app',
      user: { githubAccessToken: 'enc_token' },
    })

    decryptMock.mockReturnValue('gh_token')
    createGitHubClientMock.mockReturnValue({} as never)
    getRepositoryMock.mockResolvedValue({
      default_branch: 'main',
      clone_url: 'https://github.com/acme/app.git',
      html_url: 'https://github.com/acme/app',
    })
    executeGitCliReleaseMock.mockResolvedValue({
      branchName: 'iter/run-1-fundacao',
      commitSha: 'commit_sha_1',
      checkpoints: [
        { phase: 'release', step: 'clone', summary: 'ok', durationMs: 10 },
        { phase: 'release', step: 'push', summary: 'ok', durationMs: 20 },
      ],
    })
    findOpenPullRequestByHeadBaseMock.mockResolvedValue(null)
    createPullRequestMock.mockResolvedValue({
      number: 42,
      html_url: 'https://github.com/acme/app/pull/42',
    })
    mergePullRequestMock.mockResolvedValue({ merged: true, sha: 'merge_sha_1' })

    const result = await executeIterationGitRelease({
      projectId: 'proj-1',
      iterationIndex: 1,
      iterationName: 'Fundacao',
      branchName: 'iter/run-1-fundacao',
      gherkinPath: 'docs/specifications/generated/iter-1-fundacao.feature',
      gherkinContent: '# language: pt\nFuncionalidade: Fundacao',
      artifacts: [
        { path: 'src/lib/iterations/iter-1.ts', content: 'export const i = 1' },
      ],
    })

    expect(executeGitCliReleaseMock).toHaveBeenCalledWith(
      expect.objectContaining({
        repositoryCloneUrl: 'https://github.com/acme/app.git',
        branchName: 'iter/run-1-fundacao',
        baseBranch: 'main',
        commitMessage: 'feat(iter-1): Fundacao',
      })
    )
    expect(result.commitSha).toBe('commit_sha_1')
    expect(result.pullRequestNumber).toBe(42)
    expect(result.mergeCommitSha).toBe('merge_sha_1')
  })

  it('reuses existing open PR for same head/base', async () => {
    prismaMock.project.findUnique.mockResolvedValue({
      id: 'proj-2',
      githubRepoOwner: 'acme',
      githubRepoName: 'app',
      user: { githubAccessToken: 'enc_token' },
    })
    decryptMock.mockReturnValue('gh_token')
    createGitHubClientMock.mockReturnValue({} as never)
    getRepositoryMock.mockResolvedValue({
      default_branch: 'main',
      clone_url: 'https://github.com/acme/app.git',
      html_url: 'https://github.com/acme/app',
    })
    executeGitCliReleaseMock.mockResolvedValue({
      branchName: 'iter/run-2-core',
      commitSha: 'commit_sha_2',
      checkpoints: [],
    })
    findOpenPullRequestByHeadBaseMock.mockResolvedValue({
      number: 77,
      html_url: 'https://github.com/acme/app/pull/77',
    })
    mergePullRequestMock.mockResolvedValue({ merged: true, sha: 'merge_sha_2' })

    const result = await executeIterationGitRelease({
      projectId: 'proj-2',
      iterationIndex: 2,
      iterationName: 'Core',
      branchName: 'iter/run-2-core',
      gherkinPath: 'docs/specifications/generated/iter-2-core.feature',
      gherkinContent: '# language: pt\nFuncionalidade: Core',
    })

    expect(createPullRequestMock).not.toHaveBeenCalled()
    expect(mergePullRequestMock).toHaveBeenCalledWith(
      expect.anything(),
      'acme',
      'app',
      77,
      'squash'
    )
    expect(result.pullRequestNumber).toBe(77)
  })

  it('propagates structured release step when git CLI fails', async () => {
    prismaMock.project.findUnique.mockResolvedValue({
      id: 'proj-3',
      githubRepoOwner: 'acme',
      githubRepoName: 'app',
      user: { githubAccessToken: 'enc_token' },
    })
    decryptMock.mockReturnValue('gh_token')
    createGitHubClientMock.mockReturnValue({} as never)
    getRepositoryMock.mockResolvedValue({
      default_branch: 'main',
      clone_url: 'https://github.com/acme/app.git',
      html_url: 'https://github.com/acme/app',
    })

    const releaseError = Object.assign(
      new Error('release failed at push'),
      {
        phase: 'release',
        step: 'push',
        summary: 'remote rejected update',
      }
    )
    executeGitCliReleaseMock.mockRejectedValue(releaseError)

    await expect(
      executeIterationGitRelease({
        projectId: 'proj-3',
        iterationIndex: 1,
        iterationName: 'Fundacao',
        branchName: 'iter/run-1-fundacao',
        gherkinPath: 'docs/specifications/generated/iter-1-fundacao.feature',
        gherkinContent: '# language: pt\nFuncionalidade: Fundacao',
      })
    ).rejects.toMatchObject({
      phase: 'release',
      step: 'push',
    })
  })

  it('throws clear error when repository is not connected', async () => {
    prismaMock.project.findUnique.mockResolvedValue({
      id: 'proj-4',
      githubRepoOwner: null,
      githubRepoName: null,
      user: { githubAccessToken: 'enc_token' },
    })

    await expect(
      executeIterationGitRelease({
        projectId: 'proj-4',
        iterationIndex: 1,
        iterationName: 'Fundacao',
        branchName: 'iter/run-1-fundacao',
        gherkinPath: 'docs/specifications/generated/iter-1-fundacao.feature',
        gherkinContent: '# language: pt\nFuncionalidade: Fundacao',
      })
    ).rejects.toThrow('GITHUB_NOT_CONNECTED')
  })
})

