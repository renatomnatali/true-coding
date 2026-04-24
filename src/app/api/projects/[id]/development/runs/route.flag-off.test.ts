import { describe, expect, it, vi } from 'vitest'

// TRC-05.1: cenário com a pipeline de Code Generation desligada (MVP
// Spec-as-a-Service). Mock isolado em arquivo próprio para não conflitar
// com o suite principal — qualquer mudança de @/config/features afeta o
// módulo route.ts no momento do import.
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

vi.mock('@/lib/development/auth', () => ({
  assertProjectOwnership: vi.fn(),
}))

vi.mock('@/lib/development/run-control', () => ({
  createDevelopmentRun: vi.fn(),
  isDevelopmentRunActiveInWorker: vi.fn(),
}))

vi.mock('@/lib/development/schema-health', () => ({
  assertAutonomousDevelopmentSchemaReady: vi.fn(),
}))

vi.mock('@/lib/db/prisma', () => ({
  prisma: {
    developmentRun: {
      findMany: vi.fn(),
    },
  },
}))

import { POST, GET } from './route'
import { auth } from '@clerk/nextjs/server'
import { assertProjectOwnership } from '@/lib/development/auth'

describe('rotas /api/projects/[id]/development/runs com ENABLE_CODE_GENERATION desligada', () => {
  it('POST retorna 404 sem invocar auth/DB', async () => {
    const response = await POST(
      new Request('http://localhost/api/projects/proj-1/development/runs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assessmentConfirmed: true }),
      }),
      { params: Promise.resolve({ id: 'proj-1' }) }
    )

    expect(response.status).toBe(404)
    expect(auth).not.toHaveBeenCalled()
    expect(assertProjectOwnership).not.toHaveBeenCalled()
  })

  it('GET retorna 404 sem invocar auth/DB', async () => {
    const response = await GET(
      new Request('http://localhost/api/projects/proj-1/development/runs'),
      { params: Promise.resolve({ id: 'proj-1' }) }
    )

    expect(response.status).toBe(404)
    expect(auth).not.toHaveBeenCalled()
    expect(assertProjectOwnership).not.toHaveBeenCalled()
  })
})
