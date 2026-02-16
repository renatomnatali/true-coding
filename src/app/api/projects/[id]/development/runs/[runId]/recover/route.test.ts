import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
}))

vi.mock('@/lib/development/auth', () => ({
  assertProjectOwnership: vi.fn(),
}))

vi.mock('@/lib/development/run-control', () => ({
  recoverDevelopmentRun: vi.fn(),
}))

import { auth } from '@clerk/nextjs/server'
import { assertProjectOwnership } from '@/lib/development/auth'
import { recoverDevelopmentRun } from '@/lib/development/run-control'

const mockAuth = vi.mocked(auth)
const mockAssertProjectOwnership = vi.mocked(assertProjectOwnership)
const mockRecoverDevelopmentRun = vi.mocked(recoverDevelopmentRun)

function makeParams() {
  return {
    params: Promise.resolve({ id: 'proj-1', runId: 'run-1' }),
  }
}

describe('POST /api/projects/[id]/development/runs/[runId]/recover', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAuth.mockReset()
    mockAssertProjectOwnership.mockReset()
    mockRecoverDevelopmentRun.mockReset()
  })

  it('returns 401 when unauthenticated', async () => {
    const { POST } = await import('./route')

    mockAuth.mockResolvedValue({
      userId: null,
    } as ReturnType<typeof auth> extends Promise<infer T> ? T : never)

    const response = await POST(
      new Request('http://localhost/api/projects/proj-1/development/runs/run-1/recover', {
        method: 'POST',
      }),
      makeParams()
    )
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe('UNAUTHORIZED')
  })

  it('returns 200 and run metadata on successful recovery', async () => {
    const { POST } = await import('./route')

    mockAuth.mockResolvedValue({
      userId: 'user_1',
    } as ReturnType<typeof auth> extends Promise<infer T> ? T : never)
    mockAssertProjectOwnership.mockResolvedValue({ id: 'proj-1' })
    mockRecoverDevelopmentRun.mockResolvedValue({
      run: {
        id: 'run-1',
        status: 'RUNNING',
      },
      alreadyProcessing: false,
    } as Awaited<ReturnType<typeof recoverDevelopmentRun>>)

    const response = await POST(
      new Request('http://localhost/api/projects/proj-1/development/runs/run-1/recover', {
        method: 'POST',
      }),
      makeParams()
    )
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(mockRecoverDevelopmentRun).toHaveBeenCalledWith('proj-1', 'run-1')
    expect(data.runId).toBe('run-1')
    expect(data.status).toBe('RUNNING')
    expect(data.alreadyProcessing).toBe(false)
  })

  it('returns 409 when run cannot be manually recovered', async () => {
    const { POST } = await import('./route')

    mockAuth.mockResolvedValue({
      userId: 'user_1',
    } as ReturnType<typeof auth> extends Promise<infer T> ? T : never)
    mockAssertProjectOwnership.mockResolvedValue({ id: 'proj-1' })
    mockRecoverDevelopmentRun.mockRejectedValue(new Error('RUN_NOT_RECOVERABLE'))

    const response = await POST(
      new Request('http://localhost/api/projects/proj-1/development/runs/run-1/recover', {
        method: 'POST',
      }),
      makeParams()
    )
    const data = await response.json()

    expect(response.status).toBe(409)
    expect(data.error).toBe('RUN_NOT_RECOVERABLE')
  })
})
