import { describe, it, expect, vi } from 'vitest'
import {
  createGitHubClient,
  createRepository,
  getAuthenticatedUser,
  listUserRepos,
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
})
