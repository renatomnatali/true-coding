import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { prismaMock, appendRunEventMock, isRunActiveMock, cleanupSandboxMock } = vi.hoisted(() => ({
  prismaMock: {
    developmentRun: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    iterationRun: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    project: {
      update: vi.fn(),
    },
    runEvent: {
      findFirst: vi.fn(),
    },
  },
  appendRunEventMock: vi.fn(),
  isRunActiveMock: vi.fn(),
  cleanupSandboxMock: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('@/lib/db/prisma', () => ({
  prisma: prismaMock,
}))

vi.mock('./events', () => ({
  appendRunEvent: appendRunEventMock,
  getLatestRetryBoundarySequence: vi.fn(),
  listRunEvents: vi.fn(),
}))

vi.mock('./worker-registry', () => ({
  markRunActive: vi.fn(),
  unmarkRunActive: vi.fn(),
  isRunActive: isRunActiveMock,
}))

vi.mock('./workspace', () => ({
  cleanupSandbox: cleanupSandboxMock,
}))

vi.mock('./orchestrator', async (importOriginal) => {
  const original = await importOriginal<typeof import('./orchestrator')>()
  return {
    ...original,
    enqueueDevelopmentRun: vi.fn(),
  }
})

import { __moveRunToReleaseCheckpointForTest } from './orchestrator'
import {
  checkpointAction,
  recoverDevelopmentRun,
  retryDevelopmentRun,
} from './run-control'

describe('orchestrator recovery flows', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-02-13T23:00:00.000Z'))
    vi.clearAllMocks()
    appendRunEventMock.mockResolvedValue(undefined)
    isRunActiveMock.mockReturnValue(false)
    prismaMock.runEvent.findFirst.mockResolvedValue(null)
  })

  afterEach(() => {
    vi.clearAllTimers()
    vi.useRealTimers()
  })

  it('retryDevelopmentRun resets attemptCount before reprocessing failed iteration', async () => {
    prismaMock.developmentRun.findFirst.mockResolvedValue({
      id: 'run-1',
      status: 'WAITING_CHECKPOINT',
      currentIteration: 1,
      updatedAt: new Date('2026-02-13T22:00:00.000Z'),
    })
    prismaMock.developmentRun.findUnique.mockResolvedValue({
      workerSandboxPath: '/tmp/true-coding-run-old',
    })
    prismaMock.iterationRun.findFirst.mockResolvedValue({
      id: 'iter-1',
      index: 1,
      status: 'FAILED',
      attemptCount: 3,
    })
    prismaMock.iterationRun.update.mockResolvedValue({
      id: 'iter-1',
      status: 'PENDING',
      attemptCount: 0,
    })
    prismaMock.developmentRun.update.mockResolvedValue({
      id: 'run-1',
      status: 'RUNNING',
    })

    await retryDevelopmentRun('proj-1', 'run-1')

    expect(prismaMock.iterationRun.update).toHaveBeenCalledWith({
      where: { id: 'iter-1' },
      data: {
        status: 'PENDING',
        finishedAt: null,
        attemptCount: 0,
      },
    })
    expect(cleanupSandboxMock).toHaveBeenCalledWith('run-1')
  })

  it('checkpointAction resume resets attemptCount before restarting iteration', async () => {
    prismaMock.developmentRun.findFirst.mockResolvedValue({
      id: 'run-1',
      status: 'WAITING_CHECKPOINT',
    })
    prismaMock.developmentRun.findUnique.mockResolvedValue({
      workerSandboxPath: '/tmp/true-coding-run-old',
    })
    prismaMock.iterationRun.findFirst.mockResolvedValue({
      id: 'iter-1',
      index: 1,
      status: 'FAILED',
      attemptCount: 3,
    })
    prismaMock.iterationRun.update.mockResolvedValue({
      id: 'iter-1',
      status: 'PENDING',
      attemptCount: 0,
    })
    prismaMock.developmentRun.update.mockResolvedValue({
      id: 'run-1',
      status: 'RUNNING',
    })

    await checkpointAction({
      projectId: 'proj-1',
      runId: 'run-1',
      iterationIndex: 1,
      action: 'resume',
    })

    expect(prismaMock.iterationRun.update).toHaveBeenCalledWith({
      where: { id: 'iter-1' },
      data: {
        status: 'PENDING',
        finishedAt: null,
        attemptCount: 0,
      },
    })
    expect(cleanupSandboxMock).toHaveBeenCalledWith('run-1')
  })

  it('recoverDevelopmentRun resets exhausted running iteration before manual resume', async () => {
    const startedAt = new Date('2026-02-13T22:07:56.361Z')

    prismaMock.developmentRun.findFirst.mockResolvedValue({
      id: 'run-1',
      status: 'RUNNING',
      startedAt,
      currentIteration: 1,
      updatedAt: new Date('2026-02-13T22:00:00.000Z'),
    })
    prismaMock.runEvent.findFirst.mockResolvedValue({
      createdAt: new Date('2026-02-13T21:00:00.000Z'),
      eventType: 'RUN_STATUS',
    })
    prismaMock.developmentRun.findUnique.mockResolvedValue({
      workerSandboxPath: '/tmp/true-coding-run-old',
    })
    prismaMock.iterationRun.findFirst.mockResolvedValue({
      id: 'iter-1',
      index: 1,
      status: 'RUNNING',
      attemptCount: 3,
    })
    prismaMock.iterationRun.update.mockResolvedValue({
      id: 'iter-1',
      status: 'PENDING',
      attemptCount: 0,
    })
    prismaMock.developmentRun.update.mockResolvedValue({
      id: 'run-1',
      status: 'RUNNING',
      startedAt,
    })

    await recoverDevelopmentRun('proj-1', 'run-1')

    expect(prismaMock.iterationRun.update).toHaveBeenCalledWith({
      where: { id: 'iter-1' },
      data: {
        status: 'PENDING',
        finishedAt: null,
        attemptCount: 0,
      },
    })
    expect(cleanupSandboxMock).toHaveBeenCalledWith('run-1')
  })

  it('recoverDevelopmentRun does not enqueue duplicated worker when run has recent heartbeat', async () => {
    const startedAt = new Date('2026-02-13T22:07:56.361Z')
    const updatedAt = new Date('2026-02-13T22:09:00.000Z')

    prismaMock.developmentRun.findFirst.mockResolvedValue({
      id: 'run-1',
      status: 'RUNNING',
      startedAt,
      currentIteration: 1,
      updatedAt,
    })
    prismaMock.runEvent.findFirst.mockResolvedValue({
      createdAt: new Date('2026-02-13T22:09:30.000Z'),
      eventType: 'AGENT_TASK',
    })

    vi.setSystemTime(new Date('2026-02-13T22:10:00.000Z'))

    const result = await recoverDevelopmentRun('proj-1', 'run-1')

    expect(result.alreadyProcessing).toBe(true)
    expect(prismaMock.developmentRun.update).not.toHaveBeenCalled()
    expect(cleanupSandboxMock).not.toHaveBeenCalled()
  })

  it('moves run to WAITING_CHECKPOINT when release step fails', async () => {
    prismaMock.iterationRun.update.mockResolvedValue({
      id: 'iter-9',
      status: 'FAILED',
    })
    prismaMock.developmentRun.update.mockResolvedValue({
      id: 'run-9',
      status: 'WAITING_CHECKPOINT',
    })

    await __moveRunToReleaseCheckpointForTest({
      runId: 'run-9',
      iterationId: 'iter-9',
      iterationIndex: 1,
      step: 'push',
      summary: 'remote rejected update',
      attempt: 1,
    })

    expect(prismaMock.iterationRun.update).toHaveBeenCalledWith({
      where: { id: 'iter-9' },
      data: {
        status: 'FAILED',
        finishedAt: expect.any(Date),
      },
    })
    expect(prismaMock.developmentRun.update).toHaveBeenCalledWith({
      where: { id: 'run-9' },
      data: {
        status: 'WAITING_CHECKPOINT',
        errorSummary: expect.stringContaining('phase=release step=push'),
      },
    })
    expect(appendRunEventMock).toHaveBeenCalledWith(
      expect.objectContaining({
        runId: 'run-9',
        eventType: 'RUN_STATUS',
        payload: expect.objectContaining({
          status: 'WAITING_CHECKPOINT',
          phase: 'release',
          step: 'push',
        }),
      })
    )
  })
})
