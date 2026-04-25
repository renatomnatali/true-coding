import { describe, expect, it, vi } from 'vitest'

// TRC-05.1: /api/generate (legacy code generation endpoint) também precisa
// retornar 404 com a flag OFF.
vi.mock('@/config/features', () => ({
  FEATURES: {
    AUTONOMOUS_DEVELOPMENT_V1: true,
    ENABLE_CODE_GENERATION: false,
  },
  ENABLE_CODE_GENERATION: false,
}))

vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
}))

vi.mock('@/lib/db/prisma', () => ({
  prisma: {
    project: { findUnique: vi.fn(), update: vi.fn() },
  },
}))

vi.mock('@/lib/codegen/generator', () => ({
  generateProject: vi.fn(),
}))

vi.mock('@/lib/github/client', () => ({
  createGitHubClient: vi.fn(),
  createRepository: vi.fn(),
  createCommit: vi.fn(),
  getRepository: vi.fn(),
}))

vi.mock('@/lib/crypto', () => ({
  decrypt: vi.fn(),
}))

import { POST } from './route'
import { auth } from '@clerk/nextjs/server'

describe('POST /api/generate com ENABLE_CODE_GENERATION desligada', () => {
  it('retorna 404 sem invocar auth ou pipeline', async () => {
    const response = await POST(
      new Request('http://localhost/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: 'proj-1' }),
      })
    )

    expect(response.status).toBe(404)
    expect(auth).not.toHaveBeenCalled()
  })
})
