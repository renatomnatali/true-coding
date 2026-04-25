import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
}))

vi.mock('@/lib/development/auth', () => ({
  assertProjectOwnership: vi.fn(),
}))

vi.mock('@/lib/development/run-control', () => ({
  cancelDevelopmentRun: vi.fn(),
}))

import { auth } from '@clerk/nextjs/server'
import { assertProjectOwnership } from '@/lib/development/auth'
import { cancelDevelopmentRun } from '@/lib/development/run-control'

const mockAuth = vi.mocked(auth)
const mockAssertProjectOwnership = vi.mocked(assertProjectOwnership)
const mockCancel = vi.mocked(cancelDevelopmentRun)

function makeRequest() {
  return new Request('http://localhost/api/projects/proj-1/development/runs/run_1/cancel', {
    method: 'POST',
  })
}

function makeParams() {
  return { params: Promise.resolve({ id: 'proj-1', runId: 'run_1' }) }
}

function setAuth(userId: string | null) {
  mockAuth.mockResolvedValue({ userId } as ReturnType<typeof auth> extends Promise<infer T> ? T : never)
}

describe('POST /api/projects/[id]/development/runs/[runId]/cancel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('retorna 401 quando nao autenticado', async () => {
    const { POST } = await import('./route')
    setAuth(null)

    const response = await POST(makeRequest(), makeParams())
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe('UNAUTHORIZED')
  })

  it('retorna 403 quando usuario nao e dono do projeto', async () => {
    const { POST } = await import('./route')
    setAuth('user_1')
    mockAssertProjectOwnership.mockRejectedValue(new Error('FORBIDDEN'))

    const response = await POST(makeRequest(), makeParams())
    const data = await response.json()

    expect(response.status).toBe(403)
    expect(data.error).toBe('FORBIDDEN')
  })

  it('retorna 404 quando run nao existe', async () => {
    const { POST } = await import('./route')
    setAuth('user_1')
    mockAssertProjectOwnership.mockResolvedValue({ id: 'proj-1' })
    mockCancel.mockRejectedValue(new Error('RUN_NOT_FOUND'))

    const response = await POST(makeRequest(), makeParams())
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error).toBe('RUN_NOT_FOUND')
  })

  it('retorna 200 com status CANCELED em caso de sucesso', async () => {
    const { POST } = await import('./route')
    setAuth('user_1')
    mockAssertProjectOwnership.mockResolvedValue({ id: 'proj-1' })
    mockCancel.mockResolvedValue({
      id: 'run_1',
      status: 'CANCELED',
    } as Awaited<ReturnType<typeof cancelDevelopmentRun>>)

    const response = await POST(makeRequest(), makeParams())
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toEqual({ runId: 'run_1', status: 'CANCELED' })
    expect(mockCancel).toHaveBeenCalledWith('proj-1', 'run_1')
  })

  it('retorna 200 idempotente quando run ja esta em estado terminal', async () => {
    const { POST } = await import('./route')
    setAuth('user_1')
    mockAssertProjectOwnership.mockResolvedValue({ id: 'proj-1' })
    // cancelDevelopmentRun devolve o run terminal sem erro (comportamento idempotente)
    mockCancel.mockResolvedValue({
      id: 'run_1',
      status: 'SUCCEEDED',
    } as Awaited<ReturnType<typeof cancelDevelopmentRun>>)

    const response = await POST(makeRequest(), makeParams())
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.status).toBe('SUCCEEDED')
  })
})
