import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET } from './route'

// Mock dependencies
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
}))

vi.mock('@/lib/db/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
  },
}))

import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db/prisma'

describe('GET /api/user/github-status', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return 401 when not authenticated', async () => {
    vi.mocked(auth).mockResolvedValue({ userId: null } as ReturnType<typeof auth> extends Promise<infer T> ? T : never)

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe('UNAUTHORIZED')
  })

  it('should return 404 when user not found', async () => {
    vi.mocked(auth).mockResolvedValue({ userId: 'user_123' } as ReturnType<typeof auth> extends Promise<infer T> ? T : never)
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null)

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error).toBe('USER_NOT_FOUND')
  })

  it('should return connected=false when no GitHub username', async () => {
    vi.mocked(auth).mockResolvedValue({ userId: 'user_123' } as ReturnType<typeof auth> extends Promise<infer T> ? T : never)
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      githubUsername: null,
      githubTokenExpiry: null,
    } as Awaited<ReturnType<typeof prisma.user.findUnique>>)

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.connected).toBe(false)
    expect(data.username).toBeNull()
    expect(data.expired).toBe(false)
  })

  it('should return connected=true when GitHub is connected', async () => {
    vi.mocked(auth).mockResolvedValue({ userId: 'user_123' } as ReturnType<typeof auth> extends Promise<infer T> ? T : never)
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      githubUsername: 'testuser',
      githubTokenExpiry: new Date(Date.now() + 3600000), // 1 hour from now
    } as Awaited<ReturnType<typeof prisma.user.findUnique>>)

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.connected).toBe(true)
    expect(data.username).toBe('testuser')
    expect(data.expired).toBe(false)
  })

  it('should return expired=true when token is expired', async () => {
    vi.mocked(auth).mockResolvedValue({ userId: 'user_123' } as ReturnType<typeof auth> extends Promise<infer T> ? T : never)
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      githubUsername: 'testuser',
      githubTokenExpiry: new Date(Date.now() - 3600000), // 1 hour ago
    } as Awaited<ReturnType<typeof prisma.user.findUnique>>)

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.connected).toBe(false) // connected=false when expired
    expect(data.username).toBe('testuser')
    expect(data.expired).toBe(true)
  })

  it('should handle errors gracefully', async () => {
    vi.mocked(auth).mockResolvedValue({ userId: 'user_123' } as ReturnType<typeof auth> extends Promise<infer T> ? T : never)
    vi.mocked(prisma.user.findUnique).mockRejectedValue(new Error('Database error'))

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('INTERNAL_ERROR')
  })
})
