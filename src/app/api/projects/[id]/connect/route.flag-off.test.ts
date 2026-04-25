/**
 * TRC-05.2 — cobre o cenário ENABLE_CODE_GENERATION=false em
 * /api/projects/[id]/connect: Netlify retorna 410 e skip continua valendo.
 *
 * Os outros caminhos do endpoint (GitHub, validações genéricas) já são
 * cobertos por route.test.ts, que roda com a flag ON via setup global.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mockar @/config/features ANTES de importar a rota: a rota lê
// ENABLE_CODE_GENERATION no escopo do módulo, então precisa ver o mock no
// momento do import.
vi.mock('@/config/features', () => ({
  ENABLE_CODE_GENERATION: false,
}))

vi.mock('@clerk/nextjs/server', () => ({ auth: vi.fn() }))

vi.mock('@/lib/db/prisma', () => ({
  prisma: {
    project: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}))

vi.mock('@/lib/crypto', () => ({
  decrypt: vi.fn(() => 'decrypted-token'),
}))

vi.mock('@/lib/github/client', () => ({
  createGitHubClient: vi.fn(() => 'mock-octokit'),
  createRepository: vi.fn(),
  getAuthenticatedUser: vi.fn(),
  getRepository: vi.fn(),
}))

vi.mock('@/lib/netlify/client', () => ({
  createNetlifySite: vi.fn(),
}))

import { POST } from './route'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db/prisma'
import { createNetlifySite } from '@/lib/netlify/client'

const mockAuth = vi.mocked(auth)
const mockPrisma = vi.mocked(prisma)
const mockCreateNetlifySite = vi.mocked(createNetlifySite)

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

function setupOwnedProject(overrides: Record<string, unknown> = {}) {
  mockAuth.mockResolvedValue({ userId: 'clerk_1' } as ReturnType<typeof auth> extends Promise<infer T> ? T : never)
  mockPrisma.project.findUnique.mockResolvedValue({
    id: 'proj-1',
    name: 'My App',
    status: 'CONNECTING',
    githubRepoUrl: null,
    productionUrl: null,
    user: {
      clerkId: 'clerk_1',
      githubAccessToken: 'encrypted',
      netlifyAccessToken: 'encrypted-netlify',
    },
    ...overrides,
  } as unknown as Awaited<ReturnType<typeof prisma.project.findUnique>>)
}

describe('POST /api/projects/[id]/connect — ENABLE_CODE_GENERATION=false (TRC-05.2)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 410 NETLIFY_DISABLED when service=netlify and flag is OFF', async () => {
    setupOwnedProject({
      githubRepoUrl: 'https://github.com/testuser/my-app',
      githubRepoOwner: 'testuser',
      githubRepoName: 'my-app',
    })

    const response = await POST(createRequest({ service: 'netlify' }), createMockParams())
    const data = await response.json()

    expect(response.status).toBe(410)
    expect(data.error).toBe('NETLIFY_DISABLED')
    expect(typeof data.message).toBe('string')
    expect(data.message).toMatch(/Netlify/i)
    expect(mockCreateNetlifySite).not.toHaveBeenCalled()
    expect(mockPrisma.project.update).not.toHaveBeenCalled()
  })

  it('accepts service=skip as idempotent no-op (returns 200 { skipped: true })', async () => {
    setupOwnedProject()

    const response = await POST(createRequest({ service: 'skip' }), createMockParams())
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toEqual({ skipped: true })
    expect(mockPrisma.project.update).not.toHaveBeenCalled()
    expect(mockCreateNetlifySite).not.toHaveBeenCalled()
  })

  it('rejects unknown service even with flag OFF', async () => {
    setupOwnedProject()

    const response = await POST(createRequest({ service: 'unknown' }), createMockParams())
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('VALIDATION_ERROR')
    expect(data.message).toMatch(/skip/)
  })

  it('still requires authentication for skip', async () => {
    mockAuth.mockResolvedValue({ userId: null } as ReturnType<typeof auth> extends Promise<infer T> ? T : never)

    const response = await POST(createRequest({ service: 'skip' }), createMockParams())
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe('UNAUTHORIZED')
  })

  it('still enforces ownership for skip', async () => {
    mockAuth.mockResolvedValue({ userId: 'someone-else' } as ReturnType<typeof auth> extends Promise<infer T> ? T : never)
    mockPrisma.project.findUnique.mockResolvedValue({
      id: 'proj-1',
      name: 'My App',
      user: { clerkId: 'clerk_1' },
    } as unknown as Awaited<ReturnType<typeof prisma.project.findUnique>>)

    const response = await POST(createRequest({ service: 'skip' }), createMockParams())
    const data = await response.json()

    expect(response.status).toBe(403)
    expect(data.error).toBe('FORBIDDEN')
  })
})
