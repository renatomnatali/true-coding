import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from './route'

vi.mock('@clerk/nextjs/server', () => ({ auth: vi.fn() }))
vi.mock('@/lib/db/prisma', () => ({
  prisma: {
    project: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}))
vi.mock('@/lib/ai/claude', () => ({ chat: vi.fn() }))

import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db/prisma'
import { chat } from '@/lib/ai/claude'

const mockAuth = vi.mocked(auth)
const mockPrisma = vi.mocked(prisma)
const mockChat = vi.mocked(chat)

function createRequest(body: object): Request {
  return new Request('http://localhost/api/projects/proj-1/approve', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

function createMockParams(id = 'proj-1') {
  return { params: Promise.resolve({ id }) }
}

// Cenário base: projeto com businessPlan, sem aprovações
function setupProject(overrides: Record<string, unknown> = {}) {
  mockAuth.mockResolvedValue({ userId: 'clerk_1' } as ReturnType<typeof auth> extends Promise<infer T> ? T : never)
  mockPrisma.project.findUnique.mockResolvedValue({
    id: 'proj-1',
    status: 'PLANNING',
    businessPlan: { name: 'Test App', coreFeatures: [] },
    technicalPlan: null,
    uxPlan: null,
    businessPlanApproved: false,
    technicalPlanApproved: false,
    uxPlanApproved: false,
    user: { clerkId: 'clerk_1' },
    ...overrides,
  } as unknown as Awaited<ReturnType<typeof prisma.project.findUnique>>)
  mockPrisma.project.update.mockResolvedValue({} as unknown as Awaited<ReturnType<typeof prisma.project.update>>)
}

describe('POST /api/projects/[id]/approve', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ========================================================================
  // Auth & validation
  // ========================================================================

  it('should return 401 when not authenticated', async () => {
    mockAuth.mockResolvedValue({ userId: null } as ReturnType<typeof auth> extends Promise<infer T> ? T : never)

    const response = await POST(createRequest({ planType: 'business' }), createMockParams())
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe('UNAUTHORIZED')
  })

  it('should return 400 for invalid planType', async () => {
    setupProject()

    const response = await POST(createRequest({ planType: 'invalid' }), createMockParams())
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('VALIDATION_ERROR')
  })

  it('should return 404 when project not found', async () => {
    mockAuth.mockResolvedValue({ userId: 'clerk_1' } as ReturnType<typeof auth> extends Promise<infer T> ? T : never)
    mockPrisma.project.findUnique.mockResolvedValue(null)

    const response = await POST(createRequest({ planType: 'business' }), createMockParams())
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error).toBe('PROJECT_NOT_FOUND')
  })

  it('should return 403 when user does not own project', async () => {
    mockAuth.mockResolvedValue({ userId: 'clerk_OTHER' } as ReturnType<typeof auth> extends Promise<infer T> ? T : never)
    mockPrisma.project.findUnique.mockResolvedValue({
      id: 'proj-1',
      user: { clerkId: 'clerk_1' },
    } as unknown as Awaited<ReturnType<typeof prisma.project.findUnique>>)

    const response = await POST(createRequest({ planType: 'business' }), createMockParams())
    const data = await response.json()

    expect(response.status).toBe(403)
    expect(data.error).toBe('FORBIDDEN')
  })

  // ========================================================================
  // Cenário: Prerequisitos não atendidos (ordem sequencial)
  // ========================================================================

  it('should return 409 when approving business plan without businessPlan generated', async () => {
    setupProject({ businessPlan: null })

    const response = await POST(createRequest({ planType: 'business' }), createMockParams())
    const data = await response.json()

    expect(response.status).toBe(409)
    expect(data.error).toBe('PREREQUISITE_NOT_MET')
    expect(mockChat).not.toHaveBeenCalled()
  })

  it('should return 409 when approving technical plan before business is approved', async () => {
    setupProject({ businessPlanApproved: false })

    const response = await POST(createRequest({ planType: 'technical' }), createMockParams())
    const data = await response.json()

    expect(response.status).toBe(409)
    expect(data.error).toBe('PREREQUISITE_NOT_MET')
    expect(mockChat).not.toHaveBeenCalled()
  })

  it('should return 409 when approving ux plan before technical is approved', async () => {
    setupProject({ businessPlanApproved: true, technicalPlanApproved: false })

    const response = await POST(createRequest({ planType: 'ux' }), createMockParams())
    const data = await response.json()

    expect(response.status).toBe(409)
    expect(data.error).toBe('PREREQUISITE_NOT_MET')
    expect(mockChat).not.toHaveBeenCalled()
  })

  // ========================================================================
  // Cenário: Aprovar Business Plan → gera Technical Plan
  // (planning.feature lines 86-93)
  // ========================================================================

  it('should generate technicalPlan when approving business plan', async () => {
    setupProject()
    mockChat.mockResolvedValue({
      text: `Here is the plan:\n\`\`\`json\n{"architecture":{"type":"monolith","description":"Next.js"},"stack":[]}\n\`\`\``,
      stopReason: 'end_turn',
    })

    const response = await POST(createRequest({ planType: 'business' }), createMockParams())

    expect(response.status).toBe(200)
    expect(mockPrisma.project.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          businessPlanApproved: true,
          technicalPlan: { architecture: { type: 'monolith', description: 'Next.js' }, stack: [] },
        }),
      })
    )
  })

  it('should call Claude with businessPlan context for technical plan generation', async () => {
    setupProject()
    mockChat.mockResolvedValue({
      text: '```json\n{"architecture":{"type":"monolith"}}\n```',
      stopReason: 'end_turn',
    })

    await POST(createRequest({ planType: 'business' }), createMockParams())

    expect(mockChat).toHaveBeenCalledWith(
      expect.objectContaining({
        phase: 'planning',
        messages: expect.arrayContaining([
          expect.objectContaining({
            role: 'user',
            content: expect.stringContaining('Test App'),
          }),
        ]),
      })
    )
  })

  // ========================================================================
  // Cenário: Aprovar Technical Plan → gera UX Plan
  // (planning.feature lines 149-157)
  // ========================================================================

  it('should generate uxPlan when approving technical plan', async () => {
    setupProject({
      businessPlanApproved: true,
      technicalPlan: { architecture: { type: 'monolith' } },
    })
    mockChat.mockResolvedValue({
      text: '```json\n{"personas":[{"name":"João","age":30,"role":"Dev","goals":["g1"],"painPoints":["p1"]}]}\n```',
      stopReason: 'end_turn',
    })

    const response = await POST(createRequest({ planType: 'technical' }), createMockParams())

    expect(response.status).toBe(200)
    expect(mockPrisma.project.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          technicalPlanApproved: true,
          uxPlan: { personas: [{ name: 'João', age: 30, role: 'Dev', goals: ['g1'], painPoints: ['p1'] }] },
        }),
      })
    )
  })

  // ========================================================================
  // Cenário: Aprovar UX Plan → avança para CONNECTING
  // (planning.feature lines 206-213)
  // ========================================================================

  it('should advance to CONNECTING when approving ux plan', async () => {
    setupProject({
      businessPlanApproved: true,
      technicalPlanApproved: true,
      technicalPlan: { architecture: { type: 'monolith' } },
      uxPlan: { personas: [] },
    })

    const response = await POST(createRequest({ planType: 'ux' }), createMockParams())

    expect(response.status).toBe(200)
    // UX approval does NOT call Claude — just advances status
    expect(mockChat).not.toHaveBeenCalled()
    expect(mockPrisma.project.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          uxPlanApproved: true,
          status: 'CONNECTING',
        }),
      })
    )
  })

  // ========================================================================
  // Cenário: Erro na geração (planning.feature lines 289-296)
  // ========================================================================

  it('should return 500 when plan generation fails', async () => {
    setupProject()
    mockChat.mockRejectedValue(new Error('Claude timeout'))

    const response = await POST(createRequest({ planType: 'business' }), createMockParams())
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('GENERATION_ERROR')
    // businessPlanApproved deve permanecer false
    expect(mockPrisma.project.update).not.toHaveBeenCalled()
  })

  it('should return 500 when Claude returns unparseable JSON', async () => {
    setupProject()
    mockChat.mockResolvedValue({
      text: 'Sorry, I cannot generate that.',
      stopReason: 'end_turn',
    })

    const response = await POST(createRequest({ planType: 'business' }), createMockParams())
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('GENERATION_ERROR')
  })

  // ========================================================================
  // Cenário: Resposta truncada pela API (stop_reason = max_tokens)
  // ========================================================================

  it('should return 503 RESPONSE_TRUNCATED when TechnicalPlan is truncated by max_tokens', async () => {
    setupProject()
    mockChat.mockResolvedValue({
      text: '```json\n{"architecture": {"type": "monolith"',
      stopReason: 'max_tokens',
    })

    const response = await POST(createRequest({ planType: 'business' }), createMockParams())
    const data = await response.json()

    expect(response.status).toBe(503)
    expect(data.error).toBe('RESPONSE_TRUNCATED')
    expect(mockPrisma.project.update).not.toHaveBeenCalled()
  })

  it('should return 503 RESPONSE_TRUNCATED when UXPlan is truncated by max_tokens', async () => {
    setupProject({
      businessPlanApproved: true,
      technicalPlan: { architecture: { type: 'monolith' } },
    })
    mockChat.mockResolvedValue({
      text: '```json\n{"personas": [{"name": "João"',
      stopReason: 'max_tokens',
    })

    const response = await POST(createRequest({ planType: 'technical' }), createMockParams())
    const data = await response.json()

    expect(response.status).toBe(503)
    expect(data.error).toBe('RESPONSE_TRUNCATED')
    expect(mockPrisma.project.update).not.toHaveBeenCalled()
  })

  it('should return 503 when JSON required repair even without max_tokens stop_reason', async () => {
    setupProject()
    // stop_reason is end_turn but the JSON block has no closing ``` — extractJSON will repair it
    mockChat.mockResolvedValue({
      text: '```json\n{"architecture": {"type": "monolith", "description": "Next.js"}',
      stopReason: 'end_turn',
    })

    const response = await POST(createRequest({ planType: 'business' }), createMockParams())
    const data = await response.json()

    expect(response.status).toBe(503)
    expect(data.error).toBe('RESPONSE_TRUNCATED')
    expect(mockPrisma.project.update).not.toHaveBeenCalled()
  })
})
