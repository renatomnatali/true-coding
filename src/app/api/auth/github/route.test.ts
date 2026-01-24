import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET, DELETE } from './route'

// Mock dependencies
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
}))

vi.mock('next/headers', () => ({
  cookies: vi.fn(),
}))

vi.mock('@/lib/github/oauth', () => ({
  generateState: vi.fn(() => 'mock-state-12345'),
  getAuthorizationUrl: vi.fn((state: string) => `https://github.com/login/oauth/authorize?state=${state}`),
}))

vi.mock('@/lib/db/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}))

import { auth } from '@clerk/nextjs/server'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/db/prisma'

describe('GET /api/auth/github', () => {
  const mockCookieStore = {
    set: vi.fn(),
    get: vi.fn(),
    delete: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(cookies).mockResolvedValue(mockCookieStore as unknown as Awaited<ReturnType<typeof cookies>>)
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

  it('should redirect to GitHub authorization', async () => {
    vi.mocked(auth).mockResolvedValue({ userId: 'user_123' } as ReturnType<typeof auth> extends Promise<infer T> ? T : never)
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 1, clerkId: 'user_123' } as Awaited<ReturnType<typeof prisma.user.findUnique>>)

    const response = await GET()

    expect(response.status).toBe(307) // Redirect
    expect(response.headers.get('location')).toContain('github.com/login/oauth/authorize')
    expect(response.headers.get('location')).toContain('state=mock-state-12345')
  })

  it('should set state cookie for CSRF protection', async () => {
    vi.mocked(auth).mockResolvedValue({ userId: 'user_123' } as ReturnType<typeof auth> extends Promise<infer T> ? T : never)
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 1, clerkId: 'user_123' } as Awaited<ReturnType<typeof prisma.user.findUnique>>)

    await GET()

    expect(mockCookieStore.set).toHaveBeenCalledWith(
      'github_oauth_state',
      'mock-state-12345',
      expect.objectContaining({
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 600, // 10 minutes
        path: '/',
      })
    )
  })
})

describe('DELETE /api/auth/github', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return 401 when not authenticated', async () => {
    vi.mocked(auth).mockResolvedValue({ userId: null } as ReturnType<typeof auth> extends Promise<infer T> ? T : never)

    const response = await DELETE()
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe('UNAUTHORIZED')
  })

  it('should disconnect GitHub successfully', async () => {
    vi.mocked(auth).mockResolvedValue({ userId: 'user_123' } as ReturnType<typeof auth> extends Promise<infer T> ? T : never)
    vi.mocked(prisma.user.update).mockResolvedValue({} as Awaited<ReturnType<typeof prisma.user.update>>)

    const response = await DELETE()
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { clerkId: 'user_123' },
      data: {
        githubAccessToken: null,
        githubRefreshToken: null,
        githubTokenExpiry: null,
        githubUsername: null,
      },
    })
  })

  it('should handle errors gracefully', async () => {
    vi.mocked(auth).mockResolvedValue({ userId: 'user_123' } as ReturnType<typeof auth> extends Promise<infer T> ? T : never)
    vi.mocked(prisma.user.update).mockRejectedValue(new Error('Database error'))

    const response = await DELETE()
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('INTERNAL_ERROR')
  })
})
