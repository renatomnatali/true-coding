import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from './route'

// Mock Clerk auth
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
}))

// Mock Prisma
vi.mock('@/lib/db/prisma', () => ({
  prisma: {
    project: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}))

// Mock generator
vi.mock('@/lib/codegen/generator', () => ({
  generateProject: vi.fn(),
}))

// Mock GitHub client
vi.mock('@/lib/github/client', () => ({
  createGitHubClient: vi.fn(),
  createRepository: vi.fn(),
  createCommit: vi.fn(),
}))

// Mock crypto
vi.mock('@/lib/crypto', () => ({
  decrypt: vi.fn(),
}))

import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db/prisma'

const mockAuth = vi.mocked(auth)
const mockPrisma = vi.mocked(prisma)

function createRequest(body: unknown) {
  return new Request('http://localhost/api/generate', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

describe('POST /api/generate', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return 401 when not authenticated', async () => {
    mockAuth.mockResolvedValue({
      userId: null,
    } as ReturnType<typeof auth> extends Promise<infer T> ? T : never)

    const response = await POST(createRequest({ projectId: 'proj-1' }))
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe('UNAUTHORIZED')
  })

  it('should return 400 when projectId is missing', async () => {
    mockAuth.mockResolvedValue({
      userId: 'user_123',
    } as ReturnType<typeof auth> extends Promise<infer T> ? T : never)

    const response = await POST(createRequest({}))
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('PROJECT_ID_REQUIRED')
  })

  it('should return 404 when project not found', async () => {
    mockAuth.mockResolvedValue({
      userId: 'user_123',
    } as ReturnType<typeof auth> extends Promise<infer T> ? T : never)
    mockPrisma.project.findUnique.mockResolvedValue(null)

    const response = await POST(createRequest({ projectId: 'proj-1' }))
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error).toBe('PROJECT_NOT_FOUND')
  })

  it('should return 403 when user does not own project', async () => {
    mockAuth.mockResolvedValue({
      userId: 'user_123',
    } as ReturnType<typeof auth> extends Promise<infer T> ? T : never)
    mockPrisma.project.findUnique.mockResolvedValue({
      id: 'proj-1',
      user: { clerkId: 'other_user' },
    } as unknown as Awaited<ReturnType<typeof prisma.project.findUnique>>)

    const response = await POST(createRequest({ projectId: 'proj-1' }))
    const data = await response.json()

    expect(response.status).toBe(403)
    expect(data.error).toBe('FORBIDDEN')
  })

  it('should return 400 when technical plan is missing', async () => {
    mockAuth.mockResolvedValue({
      userId: 'user_123',
    } as ReturnType<typeof auth> extends Promise<infer T> ? T : never)
    mockPrisma.project.findUnique.mockResolvedValue({
      id: 'proj-1',
      technicalPlan: null,
      user: { clerkId: 'user_123' },
    } as unknown as Awaited<ReturnType<typeof prisma.project.findUnique>>)

    const response = await POST(createRequest({ projectId: 'proj-1' }))
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('TECHNICAL_PLAN_REQUIRED')
  })

  it('should return 400 when GitHub is not connected', async () => {
    mockAuth.mockResolvedValue({
      userId: 'user_123',
    } as ReturnType<typeof auth> extends Promise<infer T> ? T : never)
    mockPrisma.project.findUnique.mockResolvedValue({
      id: 'proj-1',
      technicalPlan: { dataModel: { entities: [] } },
      user: { clerkId: 'user_123', githubAccessToken: null },
    } as unknown as Awaited<ReturnType<typeof prisma.project.findUnique>>)

    const response = await POST(createRequest({ projectId: 'proj-1' }))
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('GITHUB_NOT_CONNECTED')
  })

  it('should return streaming response when all validations pass', async () => {
    mockAuth.mockResolvedValue({
      userId: 'user_123',
    } as ReturnType<typeof auth> extends Promise<infer T> ? T : never)
    mockPrisma.project.findUnique.mockResolvedValue({
      id: 'proj-1',
      name: 'Test Project',
      description: 'Test description',
      technicalPlan: {
        dataModel: { entities: [] },
        pages: [],
        components: [],
        apiEndpoints: [],
      },
      user: {
        clerkId: 'user_123',
        githubAccessToken: 'encrypted_token',
      },
    } as unknown as Awaited<ReturnType<typeof prisma.project.findUnique>>)

    // Import mocks after setting up
    const { generateProject } = await import('@/lib/codegen/generator')
    const mockedGenerateProject = vi.mocked(generateProject)

    // Mock generator to yield done event immediately
    mockedGenerateProject.mockImplementation(async function* () {
      yield { type: 'stage' as const, stage: 'loading_templates' as const }
      yield {
        type: 'done' as const,
        files: [{ path: 'package.json', content: '{}' }],
      }
    })

    const { createGitHubClient, createRepository, createCommit } = await import(
      '@/lib/github/client'
    )
    const mockedCreateGitHubClient = vi.mocked(createGitHubClient)
    const mockedCreateRepository = vi.mocked(createRepository)
    const mockedCreateCommit = vi.mocked(createCommit)

    mockedCreateGitHubClient.mockReturnValue({} as ReturnType<
      typeof createGitHubClient
    >)
    mockedCreateRepository.mockResolvedValue({
      html_url: 'https://github.com/user/test-project',
      owner: { login: 'user' },
      name: 'test-project',
    } as Awaited<ReturnType<typeof createRepository>>)
    mockedCreateCommit.mockResolvedValue(undefined)

    mockPrisma.project.update.mockResolvedValue({} as Awaited<
      ReturnType<typeof prisma.project.update>
    >)

    const { decrypt } = await import('@/lib/crypto')
    vi.mocked(decrypt).mockReturnValue('decrypted_token')

    const response = await POST(createRequest({ projectId: 'proj-1' }))

    expect(response.status).toBe(200)
    expect(response.headers.get('Content-Type')).toBe('text/event-stream')
  })

  it('should handle database errors gracefully', async () => {
    mockAuth.mockResolvedValue({
      userId: 'user_123',
    } as ReturnType<typeof auth> extends Promise<infer T> ? T : never)
    mockPrisma.project.findUnique.mockRejectedValue(new Error('DB Error'))

    const response = await POST(createRequest({ projectId: 'proj-1' }))
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('INTERNAL_ERROR')
  })
})
