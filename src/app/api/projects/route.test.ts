import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET, POST } from './route'

// Mock Clerk auth
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
  clerkClient: vi.fn(),
}))

// Mock Prisma
vi.mock('@/lib/db/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    project: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
  },
}))

import { auth, clerkClient } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db/prisma'

const mockAuth = vi.mocked(auth)
const mockClerkClient = vi.mocked(clerkClient)
const mockPrisma = vi.mocked(prisma)

describe('GET /api/projects', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return 401 when not authenticated', async () => {
    mockAuth.mockResolvedValue({ userId: null } as ReturnType<typeof auth> extends Promise<infer T> ? T : never)

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe('UNAUTHORIZED')
  })

  it('should return 404 when user not found', async () => {
    mockAuth.mockResolvedValue({ userId: 'user_123' } as ReturnType<typeof auth> extends Promise<infer T> ? T : never)
    mockPrisma.user.findUnique.mockResolvedValue(null)

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error).toBe('USER_NOT_FOUND')
  })

  it('should return projects for authenticated user', async () => {
    mockAuth.mockResolvedValue({ userId: 'user_123' } as ReturnType<typeof auth> extends Promise<infer T> ? T : never)
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'db-user-1',
      clerkId: 'user_123',
      email: 'test@example.com',
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    mockPrisma.project.findMany.mockResolvedValue([
      {
        id: 'proj-1',
        name: 'Test Project',
        status: 'IDEATION',
        productionUrl: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ] as unknown as Awaited<ReturnType<typeof prisma.project.findMany>>)

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.projects).toHaveLength(1)
    expect(data.projects[0].name).toBe('Test Project')
    expect(data.total).toBe(1)
  })
})

describe('POST /api/projects', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return 401 when not authenticated', async () => {
    mockAuth.mockResolvedValue({ userId: null } as ReturnType<typeof auth> extends Promise<infer T> ? T : never)

    const request = new Request('http://localhost/api/projects', {
      method: 'POST',
      body: JSON.stringify({ name: 'New Project' }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe('UNAUTHORIZED')
  })

  it('should return 400 for invalid request body', async () => {
    mockAuth.mockResolvedValue({ userId: 'user_123' } as ReturnType<typeof auth> extends Promise<infer T> ? T : never)

    const request = new Request('http://localhost/api/projects', {
      method: 'POST',
      body: JSON.stringify({ name: '' }), // Empty name should fail validation
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('VALIDATION_ERROR')
  })

  it('should create project for existing user', async () => {
    mockAuth.mockResolvedValue({ userId: 'user_123' } as ReturnType<typeof auth> extends Promise<infer T> ? T : never)
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'db-user-1',
      clerkId: 'user_123',
      email: 'test@example.com',
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    mockPrisma.project.create.mockResolvedValue({
      id: 'proj-new',
      name: 'New Project',
      status: 'IDEATION',
      userId: 'db-user-1',
      productionUrl: null,
      businessPlan: null,
      githubRepo: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    const request = new Request('http://localhost/api/projects', {
      method: 'POST',
      body: JSON.stringify({ name: 'New Project' }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data.name).toBe('New Project')
    expect(data.status).toBe('IDEATION')
  })

  it('should create user and project for new user', async () => {
    mockAuth.mockResolvedValue({ userId: 'user_new' } as ReturnType<typeof auth> extends Promise<infer T> ? T : never)
    mockPrisma.user.findUnique.mockResolvedValue(null)

    // Mock Clerk client
    const mockClerkClientInstance = {
      users: {
        getUser: vi.fn().mockResolvedValue({
          emailAddresses: [{ emailAddress: 'new@example.com' }],
        }),
      },
    }
    mockClerkClient.mockResolvedValue(mockClerkClientInstance as unknown as Awaited<ReturnType<typeof clerkClient>>)

    mockPrisma.user.create.mockResolvedValue({
      id: 'db-user-new',
      clerkId: 'user_new',
      email: 'new@example.com',
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    mockPrisma.project.create.mockResolvedValue({
      id: 'proj-new',
      name: 'First Project',
      status: 'IDEATION',
      userId: 'db-user-new',
      productionUrl: null,
      businessPlan: null,
      githubRepo: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    const request = new Request('http://localhost/api/projects', {
      method: 'POST',
      body: JSON.stringify({ name: 'First Project' }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data.name).toBe('First Project')
    expect(mockPrisma.user.create).toHaveBeenCalledWith({
      data: {
        clerkId: 'user_new',
        email: 'new@example.com',
      },
    })
  })

  it('should return 400 when user has no email in Clerk', async () => {
    mockAuth.mockResolvedValue({ userId: 'user_no_email' } as ReturnType<typeof auth> extends Promise<infer T> ? T : never)
    mockPrisma.user.findUnique.mockResolvedValue(null)

    const mockClerkClientInstance = {
      users: {
        getUser: vi.fn().mockResolvedValue({
          emailAddresses: [],
        }),
      },
    }
    mockClerkClient.mockResolvedValue(mockClerkClientInstance as unknown as Awaited<ReturnType<typeof clerkClient>>)

    const request = new Request('http://localhost/api/projects', {
      method: 'POST',
      body: JSON.stringify({ name: 'Project' }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('USER_EMAIL_NOT_FOUND')
  })
})
