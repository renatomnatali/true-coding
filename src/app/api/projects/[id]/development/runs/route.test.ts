import { describe, it, expect, vi, beforeEach } from 'vitest'

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

import { auth } from '@clerk/nextjs/server'
import { assertProjectOwnership } from '@/lib/development/auth'
import { createDevelopmentRun, isDevelopmentRunActiveInWorker } from '@/lib/development/run-control'
import { assertAutonomousDevelopmentSchemaReady } from '@/lib/development/schema-health'
import { prisma } from '@/lib/db/prisma'

const mockAuth = vi.mocked(auth)
const mockAssertProjectOwnership = vi.mocked(assertProjectOwnership)
const mockCreateDevelopmentRun = vi.mocked(createDevelopmentRun)
const mockIsDevelopmentRunActiveInWorker = vi.mocked(isDevelopmentRunActiveInWorker)
const mockAssertAutonomousDevelopmentSchemaReady = vi.mocked(assertAutonomousDevelopmentSchemaReady)
const mockPrisma = vi.mocked(prisma)

function makeRequest(body: Record<string, unknown> = { assessmentConfirmed: true }) {
  return new Request('http://localhost/api/projects/proj-1/development/runs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

const approvedPlanPayload = {
  assessmentConfirmed: true,
  approvedAssessment: {
    complexityScore: 56,
    complexityLevel: 'medium',
    factors: [],
    recommendedIterations: 3,
  },
  approvedIterations: [
    {
      index: 1,
      name: 'Fundacao',
      slug: 'fundacao',
      scope: {
        goals: ['Base'],
        featureTags: ['@fundacao'],
        risks: [],
      },
      gherkinPath: 'docs/specifications/generated/iter-1-fundacao.feature',
    },
  ],
}

function makeParams() {
  return {
    params: Promise.resolve({ id: 'proj-1' }),
  }
}

describe('POST /api/projects/[id]/development/runs', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAuth.mockReset()
    mockAssertProjectOwnership.mockReset()
    mockAssertAutonomousDevelopmentSchemaReady.mockReset()
    mockCreateDevelopmentRun.mockReset()
    mockIsDevelopmentRunActiveInWorker.mockReset()
    mockPrisma.developmentRun.findMany.mockReset()
    process.env.AUTONOMOUS_DEV_EXECUTE_GATES = 'true'
  })

  it('returns 401 when unauthenticated', async () => {
    const { POST } = await import('./route')

    mockAuth.mockResolvedValue({
      userId: null,
    } as ReturnType<typeof auth> extends Promise<infer T> ? T : never)

    const response = await POST(makeRequest(), makeParams())
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe('UNAUTHORIZED')
  })

  it('returns 409 when complexity assessment is not confirmed', async () => {
    const { POST } = await import('./route')

    mockAuth.mockResolvedValue({
      userId: 'user_1',
    } as ReturnType<typeof auth> extends Promise<infer T> ? T : never)

    const response = await POST(makeRequest({ assessmentConfirmed: false }), makeParams())
    const data = await response.json()

    expect(response.status).toBe(409)
    expect(data.error).toBe('ASSESSMENT_REQUIRED')
  })

  it('returns 201 and run metadata on success', async () => {
    const { POST } = await import('./route')

    mockAuth.mockResolvedValue({
      userId: 'user_1',
    } as ReturnType<typeof auth> extends Promise<infer T> ? T : never)

    mockAssertProjectOwnership.mockResolvedValue({ id: 'proj-1' })
    mockAssertAutonomousDevelopmentSchemaReady.mockResolvedValue(undefined)
    mockCreateDevelopmentRun.mockResolvedValue({
      run: {
        id: 'run_1',
        status: 'QUEUED',
        createdAt: new Date('2026-02-13T12:00:00.000Z'),
      },
      alreadyActive: false,
    } as Awaited<ReturnType<typeof createDevelopmentRun>>)

    const response = await POST(makeRequest(approvedPlanPayload), makeParams())
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data.runId).toBe('run_1')
    expect(data.status).toBe('QUEUED')
    expect(data.alreadyActive).toBe(false)
    expect(mockAssertAutonomousDevelopmentSchemaReady).toHaveBeenCalledTimes(1)
    expect(mockCreateDevelopmentRun).toHaveBeenCalledWith(
      'proj-1',
      {
        assessment: approvedPlanPayload.approvedAssessment,
        iterations: approvedPlanPayload.approvedIterations,
      }
    )
  })

  it('returns 200 and active run metadata when run is already active', async () => {
    const { POST } = await import('./route')

    mockAuth.mockResolvedValue({
      userId: 'user_1',
    } as ReturnType<typeof auth> extends Promise<infer T> ? T : never)

    mockAssertProjectOwnership.mockResolvedValue({ id: 'proj-1' })
    mockAssertAutonomousDevelopmentSchemaReady.mockResolvedValue(undefined)
    mockCreateDevelopmentRun.mockResolvedValue({
      run: {
        id: 'run_active_1',
        status: 'RUNNING',
        createdAt: new Date('2026-02-13T12:10:00.000Z'),
      },
      alreadyActive: true,
    } as Awaited<ReturnType<typeof createDevelopmentRun>>)

    const response = await POST(makeRequest(), makeParams())
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.runId).toBe('run_active_1')
    expect(data.status).toBe('RUNNING')
    expect(data.alreadyActive).toBe(true)
    expect(mockAssertAutonomousDevelopmentSchemaReady).toHaveBeenCalledTimes(1)
  })

  it('maps missing prisma tables to migration required', async () => {
    const { POST } = await import('./route')

    mockAuth.mockResolvedValue({
      userId: 'user_1',
    } as ReturnType<typeof auth> extends Promise<infer T> ? T : never)

    mockAssertProjectOwnership.mockResolvedValue({ id: 'proj-1' })
    mockAssertAutonomousDevelopmentSchemaReady.mockRejectedValue(new Error('SCHEMA_NOT_APPLIED'))

    const response = await POST(makeRequest(), makeParams())
    const data = await response.json()

    expect(response.status).toBe(503)
    expect(data.error).toBe('MIGRATION_REQUIRED')
    expect(mockCreateDevelopmentRun).not.toHaveBeenCalled()
  })

  it('returns 400 when approved plan payload is malformed', async () => {
    const { POST } = await import('./route')

    mockAuth.mockResolvedValue({
      userId: 'user_1',
    } as ReturnType<typeof auth> extends Promise<infer T> ? T : never)

    const response = await POST(
      makeRequest({
        assessmentConfirmed: true,
        approvedAssessment: { complexityScore: 70 },
      }),
      makeParams()
    )
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('INVALID_APPROVED_PLAN')
    expect(mockCreateDevelopmentRun).not.toHaveBeenCalled()
  })

  it('returns 409 when execution is disabled in environment', async () => {
    const { POST } = await import('./route')

    process.env.AUTONOMOUS_DEV_EXECUTE_GATES = 'false'

    mockAuth.mockResolvedValue({
      userId: 'user_1',
    } as ReturnType<typeof auth> extends Promise<infer T> ? T : never)

    const response = await POST(makeRequest(approvedPlanPayload), makeParams())
    const data = await response.json()

    expect(response.status).toBe(409)
    expect(data.error).toBe('EXECUTION_DISABLED')
    expect(mockCreateDevelopmentRun).not.toHaveBeenCalled()
  })

  it('GET only lists runs and never auto-resumes execution', async () => {
    const { GET } = await import('./route')

    mockAuth.mockResolvedValue({
      userId: 'user_1',
    } as ReturnType<typeof auth> extends Promise<infer T> ? T : never)

    mockAssertProjectOwnership.mockResolvedValue({ id: 'proj-1' })
    mockIsDevelopmentRunActiveInWorker.mockReturnValue(false)
    mockPrisma.developmentRun.findMany.mockResolvedValue([
      {
        id: 'run_active_1',
        status: 'RUNNING',
        currentIteration: 1,
        totalIterations: 3,
        errorSummary: null,
        createdAt: new Date('2026-02-13T14:22:00.000Z'),
        startedAt: new Date('2026-02-13T14:22:03.000Z'),
        updatedAt: new Date('2026-02-13T14:22:03.000Z'),
        finishedAt: null,
      },
    ] as Awaited<ReturnType<typeof prisma.developmentRun.findMany>>)

    const response = await GET(
      new Request('http://localhost/api/projects/proj-1/development/runs'),
      makeParams()
    )
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(mockCreateDevelopmentRun).not.toHaveBeenCalled()
    expect(data.runs).toHaveLength(1)
    expect(data.runs[0].id).toBe('run_active_1')
    expect(data.runs[0].isStale).toBe(true)
  })

  it('GET marks active run as healthy when worker is active', async () => {
    const { GET } = await import('./route')

    mockAuth.mockResolvedValue({
      userId: 'user_1',
    } as ReturnType<typeof auth> extends Promise<infer T> ? T : never)

    mockAssertProjectOwnership.mockResolvedValue({ id: 'proj-1' })
    mockIsDevelopmentRunActiveInWorker.mockReturnValue(true)
    mockPrisma.developmentRun.findMany.mockResolvedValue([
      {
        id: 'run_active_2',
        status: 'RUNNING',
        currentIteration: 1,
        totalIterations: 3,
        errorSummary: null,
        createdAt: new Date('2026-02-13T14:30:00.000Z'),
        startedAt: new Date('2026-02-13T14:30:01.000Z'),
        updatedAt: new Date('2026-02-13T14:30:02.000Z'),
        finishedAt: null,
      },
    ] as Awaited<ReturnType<typeof prisma.developmentRun.findMany>>)

    const response = await GET(
      new Request('http://localhost/api/projects/proj-1/development/runs'),
      makeParams()
    )
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.runs).toHaveLength(1)
    expect(data.runs[0].id).toBe('run_active_2')
    expect(data.runs[0].isStale).toBe(false)
  })
})
