import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET, PATCH, DELETE } from './route'

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
      delete: vi.fn(),
    },
  },
}))

import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db/prisma'

const mockAuth = vi.mocked(auth)
const mockPrisma = vi.mocked(prisma)

function createMockParams(id: string) {
  return { params: Promise.resolve({ id }) }
}

const mockRequest = new Request('http://localhost/api/projects/proj-1')

describe('GET /api/projects/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return 401 when not authenticated', async () => {
    mockAuth.mockResolvedValue({
      userId: null,
    } as ReturnType<typeof auth> extends Promise<infer T> ? T : never)

    const response = await GET(mockRequest, createMockParams('proj-1'))
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe('UNAUTHORIZED')
  })

  it('should return 404 when project not found', async () => {
    mockAuth.mockResolvedValue({
      userId: 'user_123',
    } as ReturnType<typeof auth> extends Promise<infer T> ? T : never)
    mockPrisma.project.findUnique.mockResolvedValue(null)

    const response = await GET(mockRequest, createMockParams('proj-1'))
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
      name: 'Test Project',
      user: { clerkId: 'other_user', githubUsername: null },
      conversations: [],
    } as unknown as Awaited<ReturnType<typeof prisma.project.findUnique>>)

    const response = await GET(mockRequest, createMockParams('proj-1'))
    const data = await response.json()

    expect(response.status).toBe(403)
    expect(data.error).toBe('FORBIDDEN')
  })

  it('should return project for owner', async () => {
    mockAuth.mockResolvedValue({
      userId: 'user_123',
    } as ReturnType<typeof auth> extends Promise<infer T> ? T : never)
    mockPrisma.project.findUnique.mockResolvedValue({
      id: 'proj-1',
      name: 'Test Project',
      status: 'IDEATION',
      user: { clerkId: 'user_123', githubUsername: 'testuser' },
      conversations: [],
    } as unknown as Awaited<ReturnType<typeof prisma.project.findUnique>>)

    const response = await GET(mockRequest, createMockParams('proj-1'))
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.name).toBe('Test Project')
  })

  it('should handle database errors gracefully', async () => {
    mockAuth.mockResolvedValue({
      userId: 'user_123',
    } as ReturnType<typeof auth> extends Promise<infer T> ? T : never)
    mockPrisma.project.findUnique.mockRejectedValue(new Error('DB Error'))

    const response = await GET(mockRequest, createMockParams('proj-1'))
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('INTERNAL_ERROR')
  })
})

describe('PATCH /api/projects/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  function createPatchRequest(body: unknown) {
    return new Request('http://localhost/api/projects/proj-1', {
      method: 'PATCH',
      body: JSON.stringify(body),
    })
  }

  it('should return 401 when not authenticated', async () => {
    mockAuth.mockResolvedValue({
      userId: null,
    } as ReturnType<typeof auth> extends Promise<infer T> ? T : never)

    const response = await PATCH(
      createPatchRequest({ name: 'Updated' }),
      createMockParams('proj-1')
    )
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe('UNAUTHORIZED')
  })

  it('should return 404 when project not found', async () => {
    mockAuth.mockResolvedValue({
      userId: 'user_123',
    } as ReturnType<typeof auth> extends Promise<infer T> ? T : never)
    mockPrisma.project.findUnique.mockResolvedValue(null)

    const response = await PATCH(
      createPatchRequest({ name: 'Updated' }),
      createMockParams('proj-1')
    )
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

    const response = await PATCH(
      createPatchRequest({ name: 'Updated' }),
      createMockParams('proj-1')
    )
    const data = await response.json()

    expect(response.status).toBe(403)
    expect(data.error).toBe('FORBIDDEN')
  })

  it('should update allowed fields', async () => {
    mockAuth.mockResolvedValue({
      userId: 'user_123',
    } as ReturnType<typeof auth> extends Promise<infer T> ? T : never)
    mockPrisma.project.findUnique.mockResolvedValue({
      id: 'proj-1',
      name: 'Old Name',
      user: { clerkId: 'user_123' },
    } as unknown as Awaited<ReturnType<typeof prisma.project.findUnique>>)
    mockPrisma.project.update.mockResolvedValue({
      id: 'proj-1',
      name: 'New Name',
      description: 'New Description',
      status: 'PLANNING',
    } as unknown as Awaited<ReturnType<typeof prisma.project.update>>)

    const response = await PATCH(
      createPatchRequest({
        name: 'New Name',
        description: 'New Description',
        status: 'PLANNING',
      }),
      createMockParams('proj-1')
    )
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.name).toBe('New Name')
    expect(mockPrisma.project.update).toHaveBeenCalledWith({
      where: { id: 'proj-1' },
      data: {
        name: 'New Name',
        description: 'New Description',
        status: 'PLANNING',
      },
    })
  })

  it('should ignore non-allowed fields', async () => {
    mockAuth.mockResolvedValue({
      userId: 'user_123',
    } as ReturnType<typeof auth> extends Promise<infer T> ? T : never)
    mockPrisma.project.findUnique.mockResolvedValue({
      id: 'proj-1',
      user: { clerkId: 'user_123' },
    } as unknown as Awaited<ReturnType<typeof prisma.project.findUnique>>)
    mockPrisma.project.update.mockResolvedValue({
      id: 'proj-1',
      name: 'Updated',
    } as unknown as Awaited<ReturnType<typeof prisma.project.update>>)

    const response = await PATCH(
      createPatchRequest({
        name: 'Updated',
        userId: 'hacker_id', // Should be ignored
        id: 'hacked_id', // Should be ignored
      }),
      createMockParams('proj-1')
    )

    expect(response.status).toBe(200)
    expect(mockPrisma.project.update).toHaveBeenCalledWith({
      where: { id: 'proj-1' },
      data: { name: 'Updated' }, // Only name, not userId or id
    })
  })
})

describe('DELETE /api/projects/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return 401 when not authenticated', async () => {
    mockAuth.mockResolvedValue({
      userId: null,
    } as ReturnType<typeof auth> extends Promise<infer T> ? T : never)

    const response = await DELETE(mockRequest, createMockParams('proj-1'))
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe('UNAUTHORIZED')
  })

  it('should return 404 when project not found', async () => {
    mockAuth.mockResolvedValue({
      userId: 'user_123',
    } as ReturnType<typeof auth> extends Promise<infer T> ? T : never)
    mockPrisma.project.findUnique.mockResolvedValue(null)

    const response = await DELETE(mockRequest, createMockParams('proj-1'))
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

    const response = await DELETE(mockRequest, createMockParams('proj-1'))
    const data = await response.json()

    expect(response.status).toBe(403)
    expect(data.error).toBe('FORBIDDEN')
  })

  it('should delete project for owner', async () => {
    mockAuth.mockResolvedValue({
      userId: 'user_123',
    } as ReturnType<typeof auth> extends Promise<infer T> ? T : never)
    mockPrisma.project.findUnique.mockResolvedValue({
      id: 'proj-1',
      user: { clerkId: 'user_123' },
    } as unknown as Awaited<ReturnType<typeof prisma.project.findUnique>>)
    mockPrisma.project.delete.mockResolvedValue({} as Awaited<
      ReturnType<typeof prisma.project.delete>
    >)

    const response = await DELETE(mockRequest, createMockParams('proj-1'))
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(mockPrisma.project.delete).toHaveBeenCalledWith({
      where: { id: 'proj-1' },
    })
  })

  it('should handle database errors gracefully', async () => {
    mockAuth.mockResolvedValue({
      userId: 'user_123',
    } as ReturnType<typeof auth> extends Promise<infer T> ? T : never)
    mockPrisma.project.findUnique.mockRejectedValue(new Error('DB Error'))

    const response = await DELETE(mockRequest, createMockParams('proj-1'))
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('INTERNAL_ERROR')
  })
})
