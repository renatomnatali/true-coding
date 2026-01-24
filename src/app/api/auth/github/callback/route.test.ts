import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET } from './route'

// Mock dependencies
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
}))

vi.mock('next/headers', () => ({
  cookies: vi.fn(),
}))

vi.mock('@/lib/github/oauth', () => ({
  exchangeCodeForToken: vi.fn(),
}))

vi.mock('@/lib/github/client', () => ({
  createGitHubClient: vi.fn(),
  getAuthenticatedUser: vi.fn(),
}))

vi.mock('@/lib/db/prisma', () => ({
  prisma: {
    user: {
      update: vi.fn(),
    },
  },
}))

vi.mock('@/lib/crypto', () => ({
  encrypt: vi.fn((text: string) => `encrypted:${text}`),
}))

vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://app.test')

import { auth } from '@clerk/nextjs/server'
import { cookies } from 'next/headers'
import { exchangeCodeForToken } from '@/lib/github/oauth'
import { createGitHubClient, getAuthenticatedUser } from '@/lib/github/client'
import { prisma } from '@/lib/db/prisma'

describe('GET /api/auth/github/callback', () => {
  const mockCookieStore = {
    set: vi.fn(),
    get: vi.fn(),
    delete: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(cookies).mockResolvedValue(mockCookieStore as unknown as Awaited<ReturnType<typeof cookies>>)
  })

  it('should redirect to sign-in when not authenticated', async () => {
    vi.mocked(auth).mockResolvedValue({ userId: null } as ReturnType<typeof auth> extends Promise<infer T> ? T : never)

    const request = new Request('https://app.test/api/auth/github/callback?code=123&state=abc')
    const response = await GET(request)

    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toContain('/sign-in')
  })

  it('should redirect with error when OAuth error received from GitHub', async () => {
    vi.mocked(auth).mockResolvedValue({ userId: 'user_123' } as ReturnType<typeof auth> extends Promise<infer T> ? T : never)

    const request = new Request('https://app.test/api/auth/github/callback?error=access_denied&error_description=User+denied+access')
    const response = await GET(request)

    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toContain('error=github_auth_failed')
  })

  it('should redirect with error when code or state is missing', async () => {
    vi.mocked(auth).mockResolvedValue({ userId: 'user_123' } as ReturnType<typeof auth> extends Promise<infer T> ? T : never)

    const request = new Request('https://app.test/api/auth/github/callback')
    const response = await GET(request)

    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toContain('error=missing_params')
  })

  it('should redirect with error when state does not match cookie', async () => {
    vi.mocked(auth).mockResolvedValue({ userId: 'user_123' } as ReturnType<typeof auth> extends Promise<infer T> ? T : never)
    mockCookieStore.get.mockReturnValue({ value: 'different-state' })

    const request = new Request('https://app.test/api/auth/github/callback?code=123&state=abc')
    const response = await GET(request)

    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toContain('error=invalid_state')
  })

  it('should successfully exchange code and save encrypted tokens', async () => {
    vi.mocked(auth).mockResolvedValue({ userId: 'user_123' } as ReturnType<typeof auth> extends Promise<infer T> ? T : never)
    mockCookieStore.get.mockReturnValue({ value: 'valid-state' })

    vi.mocked(exchangeCodeForToken).mockResolvedValue({
      access_token: 'gho_test_token',
      token_type: 'bearer',
      scope: 'repo,user:email',
      refresh_token: 'gho_refresh_token',
      expires_in: 28800, // 8 hours
    })

    const mockOctokit = {}
    vi.mocked(createGitHubClient).mockReturnValue(mockOctokit as ReturnType<typeof createGitHubClient>)
    vi.mocked(getAuthenticatedUser).mockResolvedValue({
      login: 'testuser',
      id: 12345,
      name: 'Test User',
      email: 'test@example.com',
    } as Awaited<ReturnType<typeof getAuthenticatedUser>>)

    vi.mocked(prisma.user.update).mockResolvedValue({} as Awaited<ReturnType<typeof prisma.user.update>>)

    const request = new Request('https://app.test/api/auth/github/callback?code=valid-code&state=valid-state')
    const response = await GET(request)

    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toContain('github=connected')

    // Verify tokens are encrypted
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { clerkId: 'user_123' },
      data: {
        githubAccessToken: 'encrypted:gho_test_token',
        githubRefreshToken: 'encrypted:gho_refresh_token',
        githubTokenExpiry: expect.any(Date),
        githubUsername: 'testuser',
      },
    })

    // Verify state cookie is deleted
    expect(mockCookieStore.delete).toHaveBeenCalledWith('github_oauth_state')
  })

  it('should handle tokens without refresh token', async () => {
    vi.mocked(auth).mockResolvedValue({ userId: 'user_123' } as ReturnType<typeof auth> extends Promise<infer T> ? T : never)
    mockCookieStore.get.mockReturnValue({ value: 'valid-state' })

    vi.mocked(exchangeCodeForToken).mockResolvedValue({
      access_token: 'gho_test_token',
      token_type: 'bearer',
      scope: 'repo,user:email',
    })

    const mockOctokit = {}
    vi.mocked(createGitHubClient).mockReturnValue(mockOctokit as ReturnType<typeof createGitHubClient>)
    vi.mocked(getAuthenticatedUser).mockResolvedValue({
      login: 'testuser',
      id: 12345,
    } as Awaited<ReturnType<typeof getAuthenticatedUser>>)

    vi.mocked(prisma.user.update).mockResolvedValue({} as Awaited<ReturnType<typeof prisma.user.update>>)

    const request = new Request('https://app.test/api/auth/github/callback?code=valid-code&state=valid-state')
    await GET(request)

    // Verify refresh token is null when not provided
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { clerkId: 'user_123' },
      data: expect.objectContaining({
        githubRefreshToken: null,
        githubTokenExpiry: null,
      }),
    })
  })

  it('should handle exchange errors gracefully', async () => {
    vi.mocked(auth).mockResolvedValue({ userId: 'user_123' } as ReturnType<typeof auth> extends Promise<infer T> ? T : never)
    mockCookieStore.get.mockReturnValue({ value: 'valid-state' })

    vi.mocked(exchangeCodeForToken).mockRejectedValue(new Error('Invalid code'))

    const request = new Request('https://app.test/api/auth/github/callback?code=invalid-code&state=valid-state')
    const response = await GET(request)

    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toContain('error=github_auth_failed')
  })
})
