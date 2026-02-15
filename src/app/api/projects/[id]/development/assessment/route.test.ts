import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
}))

vi.mock('@/lib/development/auth', () => ({
  assertProjectOwnership: vi.fn(),
}))

vi.mock('@/lib/development/agents', () => ({
  runAssessmentAgent: vi.fn(),
  runIterationPlannerAgent: vi.fn(),
}))

vi.mock('@/lib/db/prisma', () => ({
  prisma: {
    project: {
      findUnique: vi.fn(),
    },
  },
}))

import { auth } from '@clerk/nextjs/server'
import { assertProjectOwnership } from '@/lib/development/auth'
import { runAssessmentAgent, runIterationPlannerAgent } from '@/lib/development/agents'
import { prisma } from '@/lib/db/prisma'

const mockAuth = vi.mocked(auth)
const mockAssertProjectOwnership = vi.mocked(assertProjectOwnership)
const mockRunAssessmentAgent = vi.mocked(runAssessmentAgent)
const mockRunIterationPlannerAgent = vi.mocked(runIterationPlannerAgent)
const mockPrisma = vi.mocked(prisma)

function makeRequest() {
  return new Request('http://localhost/api/projects/proj-1/development/assessment', {
    method: 'POST',
  })
}

function makeParams() {
  return {
    params: Promise.resolve({ id: 'proj-1' }),
  }
}

describe('POST /api/projects/[id]/development/assessment', () => {
  beforeEach(() => {
    vi.clearAllMocks()
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

  it('returns 409 when required plans are missing', async () => {
    const { POST } = await import('./route')

    mockAuth.mockResolvedValue({
      userId: 'user_1',
    } as ReturnType<typeof auth> extends Promise<infer T> ? T : never)
    mockAssertProjectOwnership.mockResolvedValue({ id: 'proj-1' })
    mockPrisma.project.findUnique.mockResolvedValue({
      id: 'proj-1',
      businessPlan: {},
      technicalPlan: null,
      uxPlan: {},
    } as Awaited<ReturnType<typeof prisma.project.findUnique>>)

    const response = await POST(makeRequest(), makeParams())
    const data = await response.json()

    expect(response.status).toBe(409)
    expect(data.error).toBe('PREREQUISITE_NOT_MET')
  })

  it('returns assessment and iteration plan on success', async () => {
    const { POST } = await import('./route')

    mockAuth.mockResolvedValue({
      userId: 'user_1',
    } as ReturnType<typeof auth> extends Promise<infer T> ? T : never)
    mockAssertProjectOwnership.mockResolvedValue({ id: 'proj-1' })
    mockPrisma.project.findUnique.mockResolvedValue({
      id: 'proj-1',
      businessPlan: { ok: true },
      technicalPlan: { pages: [] },
      uxPlan: { journeys: [] },
    } as Awaited<ReturnType<typeof prisma.project.findUnique>>)

    mockRunAssessmentAgent.mockResolvedValue({
      output: {
        complexityScore: 56,
        complexityLevel: 'medium',
        factors: [],
        recommendedIterations: 3,
      },
      tokenUsage: 100,
      cost: 0.001,
    })

    mockRunIterationPlannerAgent.mockResolvedValue({
      output: {
        assessment: {
          complexityScore: 56,
          complexityLevel: 'medium',
          factors: [],
          recommendedIterations: 3,
        },
        iterations: [
          {
            index: 1,
            name: 'Fundacao',
            slug: 'fundacao',
            scope: { goals: ['Base'], featureTags: ['@fundacao'], risks: [] },
            gherkinPath: 'docs/specifications/generated/iter-1-fundacao.feature',
          },
        ],
      },
      tokenUsage: 140,
      cost: 0.0015,
    })

    const response = await POST(makeRequest(), makeParams())
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.assessment.complexityScore).toBe(56)
    expect(data.iterations).toHaveLength(1)
    expect(data.agents).toHaveLength(2)
    expect(mockRunAssessmentAgent).toHaveBeenCalledTimes(1)
    expect(mockRunIterationPlannerAgent).toHaveBeenCalledTimes(1)
  })
})
