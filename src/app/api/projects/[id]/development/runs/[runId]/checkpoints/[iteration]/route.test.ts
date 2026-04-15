import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
}))

vi.mock('@/lib/development/auth', () => ({
  assertProjectOwnership: vi.fn(),
}))

vi.mock('@/lib/development/run-control', () => ({
  checkpointAction: vi.fn(),
}))

import { auth } from '@clerk/nextjs/server'
import { assertProjectOwnership } from '@/lib/development/auth'
import { checkpointAction } from '@/lib/development/run-control'

const mockAuth = vi.mocked(auth)
const mockAssertProjectOwnership = vi.mocked(assertProjectOwnership)
const mockCheckpoint = vi.mocked(checkpointAction)

function makeRequest(body: Record<string, unknown> = { action: 'resume' }) {
  return new Request('http://localhost/api/projects/proj-1/development/runs/run_1/checkpoints/1', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

function makeParams(iteration = '1') {
  return { params: Promise.resolve({ id: 'proj-1', runId: 'run_1', iteration }) }
}

function setAuth(userId: string | null) {
  mockAuth.mockResolvedValue({ userId } as ReturnType<typeof auth> extends Promise<infer T> ? T : never)
}

describe('POST /api/projects/[id]/development/runs/[runId]/checkpoints/[iteration]', () => {
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

  it('retorna 400 VALIDATION_ERROR quando action nao esta no enum', async () => {
    const { POST } = await import('./route')
    setAuth('user_1')

    const response = await POST(makeRequest({ action: 'invalid' }), makeParams())
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('VALIDATION_ERROR')
    expect(Array.isArray(data.details)).toBe(true)
  })

  it('retorna 400 INVALID_ITERATION quando iteration e zero', async () => {
    const { POST } = await import('./route')
    setAuth('user_1')

    const response = await POST(makeRequest(), makeParams('0'))
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('INVALID_ITERATION')
  })

  it('retorna 400 INVALID_ITERATION quando iteration e negativo', async () => {
    const { POST } = await import('./route')
    setAuth('user_1')

    const response = await POST(makeRequest(), makeParams('-2'))
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('INVALID_ITERATION')
  })

  it('retorna 404 quando iteration nao existe', async () => {
    const { POST } = await import('./route')
    setAuth('user_1')
    mockAssertProjectOwnership.mockResolvedValue({ id: 'proj-1' })
    mockCheckpoint.mockRejectedValue(new Error('ITERATION_NOT_FOUND'))

    const response = await POST(makeRequest(), makeParams())
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error).toBe('ITERATION_NOT_FOUND')
  })

  it('retorna 409 RUN_NOT_RESUMABLE com mensagem pt-BR', async () => {
    const { POST } = await import('./route')
    setAuth('user_1')
    mockAssertProjectOwnership.mockResolvedValue({ id: 'proj-1' })
    mockCheckpoint.mockRejectedValue(new Error('RUN_NOT_RESUMABLE'))

    const response = await POST(makeRequest({ action: 'resume' }), makeParams())
    const data = await response.json()

    expect(response.status).toBe(409)
    expect(data.error).toBe('RUN_NOT_RESUMABLE')
    expect(data.message).toBe('A execução atual não está aguardando checkpoint para retomada.')
  })

  it('retorna 409 RUN_NOT_PAUSABLE com mensagem pt-BR', async () => {
    const { POST } = await import('./route')
    setAuth('user_1')
    mockAssertProjectOwnership.mockResolvedValue({ id: 'proj-1' })
    mockCheckpoint.mockRejectedValue(new Error('RUN_NOT_PAUSABLE'))

    const response = await POST(makeRequest({ action: 'pause' }), makeParams())
    const data = await response.json()

    expect(response.status).toBe(409)
    expect(data.error).toBe('RUN_NOT_PAUSABLE')
    expect(data.message).toBe('A execução atual não pode ser pausada neste estado.')
  })

  it.each(['pause', 'resume', 'approve'] as const)(
    'retorna 200 quando action valida (%s)',
    async (action) => {
      const { POST } = await import('./route')
      setAuth('user_1')
      mockAssertProjectOwnership.mockResolvedValue({ id: 'proj-1' })
      mockCheckpoint.mockResolvedValue({
        id: 'run_1',
        status: 'RUNNING',
      } as Awaited<ReturnType<typeof checkpointAction>>)

      const response = await POST(makeRequest({ action }), makeParams('2'))
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual({ runId: 'run_1', status: 'RUNNING', action })
      expect(mockCheckpoint).toHaveBeenCalledWith({
        projectId: 'proj-1',
        runId: 'run_1',
        iterationIndex: 2,
        action,
      })
    }
  )
})
