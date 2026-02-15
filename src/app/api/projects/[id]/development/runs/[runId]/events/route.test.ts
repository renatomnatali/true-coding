import { beforeEach, describe, expect, it, vi } from 'vitest'
import { GET } from './route'
import type { DevelopmentEvent } from '@/types'

const {
  authMock,
  assertProjectOwnershipMock,
  getDevelopmentRunMock,
  getDevelopmentRunEventsMock,
  getDevelopmentRunRetryBoundaryMock,
} = vi.hoisted(() => ({
  authMock: vi.fn(),
  assertProjectOwnershipMock: vi.fn(),
  getDevelopmentRunMock: vi.fn(),
  getDevelopmentRunEventsMock: vi.fn(),
  getDevelopmentRunRetryBoundaryMock: vi.fn(),
}))

vi.mock('@clerk/nextjs/server', () => ({
  auth: authMock,
}))

vi.mock('@/lib/development/auth', () => ({
  assertProjectOwnership: assertProjectOwnershipMock,
}))

vi.mock('@/lib/development/orchestrator', () => ({
  getDevelopmentRun: getDevelopmentRunMock,
  getDevelopmentRunEvents: getDevelopmentRunEventsMock,
  getDevelopmentRunRetryBoundary: getDevelopmentRunRetryBoundaryMock,
}))

async function readResponseBody(response: Response) {
  const reader = response.body?.getReader()
  if (!reader) return ''

  const decoder = new TextDecoder()
  let output = ''

  while (true) {
    const { value, done } = await reader.read()
    if (done) break
    output += decoder.decode(value, { stream: true })
  }

  output += decoder.decode()
  return output
}

describe('GET /api/projects/[id]/development/runs/[runId]/events', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    authMock.mockResolvedValue({ userId: 'user_123' })
    assertProjectOwnershipMock.mockResolvedValue(undefined)
  })

  it('starts stream from latest retry boundary on initial connection', async () => {
    const runningRun = {
      id: 'run-1',
      status: 'RUNNING',
    }

    const event: DevelopmentEvent = {
      id: 'evt-125',
      runId: 'run-1',
      sequence: 125,
      eventType: 'run_status',
      payload: { status: 'RUNNING' },
      createdAt: '2026-02-13T17:22:03.712Z',
    }

    getDevelopmentRunMock
      .mockResolvedValueOnce(runningRun)
      .mockResolvedValueOnce({ ...runningRun, status: 'SUCCEEDED' })

    getDevelopmentRunRetryBoundaryMock.mockResolvedValue(125)
    getDevelopmentRunEventsMock.mockResolvedValue([event])

    const response = await GET(
      new Request('http://localhost/api/projects/proj-1/development/runs/run-1/events'),
      { params: Promise.resolve({ id: 'proj-1', runId: 'run-1' }) }
    )

    expect(response.status).toBe(200)
    expect(getDevelopmentRunRetryBoundaryMock).toHaveBeenCalledWith('run-1')
    expect(getDevelopmentRunEventsMock).toHaveBeenCalledWith('run-1', 124)

    const body = await readResponseBody(response)
    expect(body).toContain('event: run_status')
    expect(body).toContain('event: done')
  })

  it('uses explicit "after" cursor and bypasses retry boundary lookup', async () => {
    const runningRun = {
      id: 'run-2',
      status: 'RUNNING',
    }

    const event: DevelopmentEvent = {
      id: 'evt-201',
      runId: 'run-2',
      sequence: 201,
      eventType: 'iteration_status',
      payload: { status: 'RUNNING', iterationIndex: 2 },
      createdAt: '2026-02-13T17:25:00.000Z',
    }

    getDevelopmentRunMock
      .mockResolvedValueOnce(runningRun)
      .mockResolvedValueOnce({ ...runningRun, status: 'SUCCEEDED' })

    getDevelopmentRunEventsMock.mockResolvedValue([event])

    const response = await GET(
      new Request('http://localhost/api/projects/proj-1/development/runs/run-2/events?after=200'),
      { params: Promise.resolve({ id: 'proj-1', runId: 'run-2' }) }
    )

    expect(response.status).toBe(200)
    expect(getDevelopmentRunRetryBoundaryMock).not.toHaveBeenCalled()
    expect(getDevelopmentRunEventsMock).toHaveBeenCalledWith('run-2', 200)

    const body = await readResponseBody(response)
    expect(body).toContain('event: iteration_status')
    expect(body).toContain('event: done')
  })
})
