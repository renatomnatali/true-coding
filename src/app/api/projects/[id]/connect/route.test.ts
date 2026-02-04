import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from './route'

// Mock Clerk auth
vi.mock('@clerk/nextjs/server', () => ({ auth: vi.fn() }))

// Mock Prisma
vi.mock('@/lib/db/prisma', () => ({
  prisma: {
    project: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}))

// Mock crypto
vi.mock('@/lib/crypto', () => ({
  decrypt: vi.fn(() => 'decrypted-token'),
}))

// Mock GitHub client
vi.mock('@/lib/github/client', () => ({
  createGitHubClient: vi.fn(() => 'mock-octokit'),
  createRepository: vi.fn(),
}))

import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db/prisma'
import { decrypt } from '@/lib/crypto'
import { createGitHubClient, createRepository } from '@/lib/github/client'

const mockAuth = vi.mocked(auth)
const mockPrisma = vi.mocked(prisma)
const mockDecrypt = vi.mocked(decrypt)
const mockCreateGitHubClient = vi.mocked(createGitHubClient)
const mockCreateRepository = vi.mocked(createRepository)

function createRequest(body: object): Request {
  return new Request('http://localhost/api/projects/proj-1/connect', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

function createMockParams(id = 'proj-1') {
  return { params: Promise.resolve({ id }) }
}

// Base project with GitHub token on user
function setupProject(overrides: Record<string, unknown> = {}, userOverrides: Record<string, unknown> = {}) {
  mockAuth.mockResolvedValue({ userId: 'clerk_1' } as ReturnType<typeof auth> extends Promise<infer T> ? T : never)
  mockPrisma.project.findUnique.mockResolvedValue({
    id: 'proj-1',
    name: 'My Delivery App',
    status: 'CONNECTING',
    githubRepoUrl: null,
    productionUrl: null,
    user: {
      clerkId: 'clerk_1',
      githubAccessToken: 'encrypted-token',
      ...userOverrides,
    },
    ...overrides,
  } as unknown as Awaited<ReturnType<typeof prisma.project.findUnique>>)
  mockPrisma.project.update.mockResolvedValue({} as unknown as Awaited<ReturnType<typeof prisma.project.update>>)
}

// Mock repo response from GitHub
const mockRepoResponse = {
  html_url: 'https://github.com/testuser/my-delivery-app',
  owner: { login: 'testuser' },
  name: 'my-delivery-app',
}

describe('POST /api/projects/[id]/connect', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockCreateRepository.mockResolvedValue(mockRepoResponse as unknown as Awaited<ReturnType<typeof createRepository>>)
  })

  // ========================================================================
  // Auth & validation guards
  // ========================================================================

  it('should return 401 when not authenticated', async () => {
    mockAuth.mockResolvedValue({ userId: null } as ReturnType<typeof auth> extends Promise<infer T> ? T : never)

    const response = await POST(createRequest({ service: 'github' }), createMockParams())
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe('UNAUTHORIZED')
  })

  it('should return 400 for invalid service', async () => {
    setupProject()

    const response = await POST(createRequest({ service: 'invalid' }), createMockParams())
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('VALIDATION_ERROR')
  })

  it('should return 400 for missing service', async () => {
    setupProject()

    const response = await POST(createRequest({}), createMockParams())
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('VALIDATION_ERROR')
  })

  it('should return 404 when project not found', async () => {
    mockAuth.mockResolvedValue({ userId: 'clerk_1' } as ReturnType<typeof auth> extends Promise<infer T> ? T : never)
    mockPrisma.project.findUnique.mockResolvedValue(null)

    const response = await POST(createRequest({ service: 'github' }), createMockParams())
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error).toBe('PROJECT_NOT_FOUND')
  })

  it('should return 403 when user does not own project', async () => {
    mockAuth.mockResolvedValue({ userId: 'clerk_OTHER' } as ReturnType<typeof auth> extends Promise<infer T> ? T : never)
    mockPrisma.project.findUnique.mockResolvedValue({
      id: 'proj-1',
      name: 'Test',
      user: { clerkId: 'clerk_1', githubAccessToken: 'enc' },
    } as unknown as Awaited<ReturnType<typeof prisma.project.findUnique>>)

    const response = await POST(createRequest({ service: 'github' }), createMockParams())
    const data = await response.json()

    expect(response.status).toBe(403)
    expect(data.error).toBe('FORBIDDEN')
  })

  // ========================================================================
  // GitHub: criar repositório com sucesso
  // ========================================================================

  it('should create GitHub repo and persist data', async () => {
    setupProject()

    const response = await POST(createRequest({ service: 'github' }), createMockParams())
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(mockDecrypt).toHaveBeenCalledWith('encrypted-token')
    expect(mockCreateGitHubClient).toHaveBeenCalledWith('decrypted-token')
    expect(mockCreateRepository).toHaveBeenCalledWith('mock-octokit', {
      name: 'my-delivery-app',
      description: 'My Delivery App',
      isPrivate: true,
    })
    expect(mockPrisma.project.update).toHaveBeenCalledWith({
      where: { id: 'proj-1' },
      data: {
        githubRepoUrl: 'https://github.com/testuser/my-delivery-app',
        githubRepoOwner: 'testuser',
        githubRepoName: 'my-delivery-app',
      },
    })
    expect(data.githubRepoUrl).toBe('https://github.com/testuser/my-delivery-app')
    expect(data.githubRepoOwner).toBe('testuser')
    expect(data.githubRepoName).toBe('my-delivery-app')
  })

  it('should slugify project name for repo name', async () => {
    setupProject({ name: 'My Awesome App! v2.0' })

    await POST(createRequest({ service: 'github' }), createMockParams())

    expect(mockCreateRepository).toHaveBeenCalledWith('mock-octokit', expect.objectContaining({
      name: 'my-awesome-app-v2-0',
    }))
  })

  it('should return 409 when user has no GitHub token', async () => {
    setupProject({}, { githubAccessToken: null })

    const response = await POST(createRequest({ service: 'github' }), createMockParams())
    const data = await response.json()

    expect(response.status).toBe(409)
    expect(data.error).toBe('PREREQUISITE_NOT_MET')
    expect(mockCreateRepository).not.toHaveBeenCalled()
  })

  it('should return 500 when GitHub API fails', async () => {
    setupProject()
    mockCreateRepository.mockRejectedValue(new Error('GitHub API 422: name already exists'))

    const response = await POST(createRequest({ service: 'github' }), createMockParams())
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('INTERNAL_ERROR')
  })

  // ========================================================================
  // Vercel: stub connection
  // ========================================================================

  it('should stub Vercel connection and set productionUrl', async () => {
    setupProject({ githubRepoUrl: 'https://github.com/testuser/my-delivery-app' })

    const response = await POST(createRequest({ service: 'vercel' }), createMockParams())
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.productionUrl).toBe('https://my-delivery-app.vercel.app')
    expect(mockPrisma.project.update).toHaveBeenCalledWith({
      where: { id: 'proj-1' },
      data: {
        productionUrl: 'https://my-delivery-app.vercel.app',
        status: 'GENERATING',
      },
    })
  })

  it('should return 409 when Vercel called without GitHub repo', async () => {
    setupProject({ githubRepoUrl: null })

    const response = await POST(createRequest({ service: 'vercel' }), createMockParams())
    const data = await response.json()

    expect(response.status).toBe(409)
    expect(data.error).toBe('PREREQUISITE_NOT_MET')
    expect(mockPrisma.project.update).not.toHaveBeenCalled()
  })
})
