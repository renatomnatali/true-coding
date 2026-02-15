import { describe, it, expect, vi } from 'vitest'
import {
  createGitHubClient,
  createRepository,
  getAuthenticatedUser,
  listUserRepos,
  createPullRequest,
  mergePullRequest,
  findOpenPullRequestByHeadBase,
} from './client'

// Mock Octokit
vi.mock('@octokit/rest', () => ({
  Octokit: vi.fn().mockImplementation(() => ({
    repos: {
      createForAuthenticatedUser: vi.fn(),
      listForAuthenticatedUser: vi.fn(),
      get: vi.fn(),
    },
    users: {
      getAuthenticated: vi.fn(),
    },
    git: {
      getRef: vi.fn(),
      getCommit: vi.fn(),
      createBlob: vi.fn(),
      createTree: vi.fn(),
      createCommit: vi.fn(),
      updateRef: vi.fn(),
      createRef: vi.fn(),
    },
    pulls: {
      list: vi.fn(),
      create: vi.fn(),
      merge: vi.fn(),
    },
  })),
}))

describe('GitHub Client', () => {
  describe('createGitHubClient', () => {
    it('should create Octokit instance with token', () => {
      const client = createGitHubClient('test-token')
      expect(client).toBeDefined()
    })
  })

  describe('createRepository', () => {
    it('should create repository with correct options', async () => {
      const mockRepo = {
        id: 123,
        name: 'test-repo',
        full_name: 'user/test-repo',
        html_url: 'https://github.com/user/test-repo',
      }

      const client = createGitHubClient('test-token')
      ;(client.repos.createForAuthenticatedUser as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: mockRepo,
      })

      const result = await createRepository(client, {
        name: 'test-repo',
        description: 'Test description',
        isPrivate: true,
      })

      expect(client.repos.createForAuthenticatedUser).toHaveBeenCalledWith({
        name: 'test-repo',
        description: 'Test description',
        private: true,
        auto_init: true,
        has_issues: true,
        has_wiki: false,
      })

      expect(result).toEqual(mockRepo)
    })

    it('should default to public repository', async () => {
      const client = createGitHubClient('test-token')
      ;(client.repos.createForAuthenticatedUser as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: { id: 1 },
      })

      await createRepository(client, {
        name: 'test-repo',
        description: 'Test',
      })

      expect(client.repos.createForAuthenticatedUser).toHaveBeenCalledWith(
        expect.objectContaining({ private: false })
      )
    })
  })

  describe('getAuthenticatedUser', () => {
    it('should return authenticated user', async () => {
      const mockUser = {
        login: 'testuser',
        id: 123,
        name: 'Test User',
        email: 'test@example.com',
      }

      const client = createGitHubClient('test-token')
      ;(client.users.getAuthenticated as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: mockUser,
      })

      const result = await getAuthenticatedUser(client)

      expect(result).toEqual(mockUser)
    })
  })

  describe('listUserRepos', () => {
    it('should list repos with pagination', async () => {
      const mockRepos = [
        { id: 1, name: 'repo1' },
        { id: 2, name: 'repo2' },
      ]

      const client = createGitHubClient('test-token')
      ;(client.repos.listForAuthenticatedUser as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: mockRepos,
      })

      const result = await listUserRepos(client, 10, 2)

      expect(client.repos.listForAuthenticatedUser).toHaveBeenCalledWith({
        sort: 'updated',
        per_page: 10,
        page: 2,
      })

      expect(result).toEqual(mockRepos)
    })

    it('should use default pagination', async () => {
      const client = createGitHubClient('test-token')
      ;(client.repos.listForAuthenticatedUser as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: [],
      })

      await listUserRepos(client)

      expect(client.repos.listForAuthenticatedUser).toHaveBeenCalledWith({
        sort: 'updated',
        per_page: 30,
        page: 1,
      })
    })
  })

  describe('createPullRequest', () => {
    it('should create pull request with correct parameters', async () => {
      const client = createGitHubClient('test-token')
      ;(client.pulls.create as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: {
          number: 101,
          html_url: 'https://github.com/acme/app/pull/101',
          state: 'open',
        },
      })

      const result = await createPullRequest(
        client,
        'acme',
        'app',
        'feat(iter-1): Fundacao',
        'iter/run-1-fundacao',
        'main',
        'PR body'
      )

      expect(client.pulls.create).toHaveBeenCalledWith({
        owner: 'acme',
        repo: 'app',
        title: 'feat(iter-1): Fundacao',
        head: 'iter/run-1-fundacao',
        base: 'main',
        body: 'PR body',
      })
      expect(result.number).toBe(101)
    })
  })

  describe('mergePullRequest', () => {
    it('should merge pull request with squash strategy', async () => {
      const client = createGitHubClient('test-token')
      ;(client.pulls.merge as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: {
          merged: true,
          sha: 'merge_sha_123',
          message: 'Pull Request successfully merged',
        },
      })

      const result = await mergePullRequest(
        client,
        'acme',
        'app',
        101,
        'squash'
      )

      expect(client.pulls.merge).toHaveBeenCalledWith({
        owner: 'acme',
        repo: 'app',
        pull_number: 101,
        merge_method: 'squash',
      })
      expect(result.merged).toBe(true)
      expect(result.sha).toBe('merge_sha_123')
    })
  })

  describe('findOpenPullRequestByHeadBase', () => {
    it('should return open PR when head/base matches', async () => {
      const client = createGitHubClient('test-token')
      ;(client.pulls.list as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: [
          {
            number: 91,
            state: 'open',
            html_url: 'https://github.com/acme/app/pull/91',
            head: { label: 'acme:iter/run-1-fundacao', ref: 'iter/run-1-fundacao' },
            base: { ref: 'main' },
          },
        ],
      })

      const result = await findOpenPullRequestByHeadBase(
        client,
        'acme',
        'app',
        'acme:iter/run-1-fundacao',
        'main'
      )

      expect(client.pulls.list).toHaveBeenCalledWith({
        owner: 'acme',
        repo: 'app',
        state: 'open',
        head: 'acme:iter/run-1-fundacao',
        base: 'main',
        per_page: 1,
      })
      expect(result?.number).toBe(91)
    })

    it('should return null when no open PR exists for head/base', async () => {
      const client = createGitHubClient('test-token')
      ;(client.pulls.list as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: [],
      })

      const result = await findOpenPullRequestByHeadBase(
        client,
        'acme',
        'app',
        'acme:iter/run-9-missing',
        'main'
      )

      expect(result).toBeNull()
    })
  })
})
