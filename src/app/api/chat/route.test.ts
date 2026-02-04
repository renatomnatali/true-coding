import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from './route'

// Mock Clerk auth
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
}))

// Mock Prisma
vi.mock('@/lib/db/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
    project: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    conversation: {
      create: vi.fn(),
      update: vi.fn(),
    },
    message: {
      create: vi.fn(),
    },
  },
}))

// Mock Claude streaming
vi.mock('@/lib/ai/claude', () => ({
  streamChat: vi.fn(),
}))

import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db/prisma'
import { streamChat } from '@/lib/ai/claude'

const mockAuth = vi.mocked(auth)
const mockPrisma = vi.mocked(prisma)
const mockStreamChat = vi.mocked(streamChat)

function createRequest(body: object): Request {
  return new Request('http://localhost/api/chat', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

async function drainStream(response: Response): Promise<string> {
  const reader = response.body?.getReader()
  const chunks: string[] = []
  if (reader) {
    const decoder = new TextDecoder()
    let done = false
    while (!done) {
      const result = await reader.read()
      done = result.done
      if (result.value) chunks.push(decoder.decode(result.value))
    }
  }
  return chunks.join('')
}

describe('POST /api/chat', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Authentication', () => {
    it('should return 401 when not authenticated', async () => {
      mockAuth.mockResolvedValue({ userId: null } as ReturnType<typeof auth> extends Promise<infer T> ? T : never)

      const request = createRequest({
        projectId: 'proj-1',
        message: 'Hello',
        phase: 'discovery',
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('UNAUTHORIZED')
    })

    it('should return 404 when user not found in database', async () => {
      mockAuth.mockResolvedValue({ userId: 'user_123' } as ReturnType<typeof auth> extends Promise<infer T> ? T : never)
      mockPrisma.user.findUnique.mockResolvedValue(null)

      const request = createRequest({
        projectId: 'proj-1',
        message: 'Hello',
        phase: 'discovery',
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('USER_NOT_FOUND')
    })
  })

  describe('Validation', () => {
    it('should return 400 for empty message', async () => {
      mockAuth.mockResolvedValue({ userId: 'user_123' } as ReturnType<typeof auth> extends Promise<infer T> ? T : never)

      const request = createRequest({
        projectId: 'proj-1',
        message: '',
        phase: 'discovery',
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('VALIDATION_ERROR')
    })

    it('should return 400 for invalid phase', async () => {
      mockAuth.mockResolvedValue({ userId: 'user_123' } as ReturnType<typeof auth> extends Promise<infer T> ? T : never)

      const request = createRequest({
        projectId: 'proj-1',
        message: 'Hello',
        phase: 'invalid-phase',
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('VALIDATION_ERROR')
    })

    it('should return 400 for missing projectId', async () => {
      mockAuth.mockResolvedValue({ userId: 'user_123' } as ReturnType<typeof auth> extends Promise<infer T> ? T : never)

      const request = createRequest({
        message: 'Hello',
        phase: 'discovery',
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('VALIDATION_ERROR')
    })
  })

  describe('Project ownership', () => {
    it('should return 404 when project not found', async () => {
      mockAuth.mockResolvedValue({ userId: 'user_123' } as ReturnType<typeof auth> extends Promise<infer T> ? T : never)
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'db-user-1',
        clerkId: 'user_123',
        email: 'test@example.com',
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      mockPrisma.project.findUnique.mockResolvedValue(null)

      const request = createRequest({
        projectId: 'nonexistent-proj',
        message: 'Hello',
        phase: 'discovery',
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('PROJECT_NOT_FOUND')
    })

    it('should return 404 when user does not own project', async () => {
      mockAuth.mockResolvedValue({ userId: 'user_123' } as ReturnType<typeof auth> extends Promise<infer T> ? T : never)
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'db-user-1',
        clerkId: 'user_123',
        email: 'test@example.com',
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      mockPrisma.project.findUnique.mockResolvedValue({
        id: 'proj-1',
        name: 'Other User Project',
        userId: 'db-user-OTHER', // Different user
        status: 'IDEATION',
        productionUrl: null,
        businessPlan: null,
        githubRepo: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        conversations: [],
      } as unknown as Awaited<ReturnType<typeof prisma.project.findUnique>>)

      const request = createRequest({
        projectId: 'proj-1',
        message: 'Hello',
        phase: 'discovery',
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('PROJECT_NOT_FOUND')
    })
  })

  describe('Streaming response', () => {
    it('should return SSE stream for valid request', async () => {
      mockAuth.mockResolvedValue({ userId: 'user_123' } as ReturnType<typeof auth> extends Promise<infer T> ? T : never)
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'db-user-1',
        clerkId: 'user_123',
        email: 'test@example.com',
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      mockPrisma.project.findUnique.mockResolvedValue({
        id: 'proj-1',
        name: 'My Project',
        userId: 'db-user-1',
        status: 'IDEATION',
        productionUrl: null,
        businessPlan: null,
        githubRepo: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        conversations: [],
      } as unknown as Awaited<ReturnType<typeof prisma.project.findUnique>>)
      mockPrisma.conversation.create.mockResolvedValue({
        id: 'conv-1',
        projectId: 'proj-1',
        phase: 'DISCOVERY',
        status: 'ACTIVE',
        currentQuestion: 1,
        completedQuestions: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        messages: [],
      } as unknown as Awaited<ReturnType<typeof prisma.conversation.create>>)
      mockPrisma.message.create.mockResolvedValue({
        id: 'msg-1',
        conversationId: 'conv-1',
        role: 'USER',
        content: 'Hello',
        createdAt: new Date(),
      })
      mockPrisma.conversation.update.mockResolvedValue({
        id: 'conv-1',
        projectId: 'proj-1',
        phase: 'DISCOVERY',
        status: 'ACTIVE',
        currentQuestion: 2,
        completedQuestions: [1],
        createdAt: new Date(),
        updatedAt: new Date(),
      } as unknown as Awaited<ReturnType<typeof prisma.conversation.update>>)

      // Mock streaming response
      async function* mockStream() {
        yield 'Hello, '
        yield 'how can I help?'
      }
      mockStreamChat.mockReturnValue(mockStream())

      const request = createRequest({
        projectId: 'proj-1',
        message: 'Hello',
        phase: 'discovery',
      })

      const response = await POST(request)

      expect(response.headers.get('Content-Type')).toBe('text/event-stream')
      expect(response.headers.get('Cache-Control')).toBe('no-cache')

      // Read the stream
      const reader = response.body?.getReader()
      const chunks: string[] = []

      if (reader) {
        const decoder = new TextDecoder()
        let done = false
        while (!done) {
          const result = await reader.read()
          done = result.done
          if (result.value) {
            chunks.push(decoder.decode(result.value))
          }
        }
      }

      const fullOutput = chunks.join('')
      expect(fullOutput).toContain('event: text')
      expect(fullOutput).toContain('Hello, ')
      expect(fullOutput).toContain('event: done')
    })
  })

  describe('Question progress (off-by-one regression)', () => {
    function setupBaseProject(conversationMessages: { role: string; content: string }[] = []) {
      mockAuth.mockResolvedValue({ userId: 'user_123' } as ReturnType<typeof auth> extends Promise<infer T> ? T : never)
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'db-user-1',
        clerkId: 'user_123',
        email: 'test@example.com',
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      const existingUserCount = conversationMessages.filter((m) => m.role === 'USER').length
      const currentQuestion = existingUserCount === 0 ? 1 : existingUserCount + 1
      const completedQuestions = existingUserCount === 0 ? [] : Array.from({ length: existingUserCount }, (_, i) => i + 1)

      mockPrisma.project.findUnique.mockResolvedValue({
        id: 'proj-1',
        name: 'My Project',
        userId: 'db-user-1',
        status: 'IDEATION',
        productionUrl: null,
        businessPlan: null,
        githubRepo: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        conversations: [{
          id: 'conv-1',
          projectId: 'proj-1',
          phase: 'DISCOVERY',
          status: 'ACTIVE',
          currentQuestion,
          completedQuestions,
          createdAt: new Date(),
          updatedAt: new Date(),
          messages: conversationMessages.map((m, i) => ({
            id: `msg-${i}`,
            conversationId: 'conv-1',
            role: m.role,
            content: m.content,
            createdAt: new Date(),
          })),
        }],
      } as unknown as Awaited<ReturnType<typeof prisma.project.findUnique>>)

      mockPrisma.message.create.mockResolvedValue({
        id: 'msg-new',
        conversationId: 'conv-1',
        role: 'USER',
        content: 'test',
        createdAt: new Date(),
      })
      mockPrisma.conversation.update.mockResolvedValue({
        id: 'conv-1',
        projectId: 'proj-1',
        phase: 'DISCOVERY',
        status: 'ACTIVE',
        currentQuestion: currentQuestion + 1,
        completedQuestions: [...completedQuestions, currentQuestion],
        createdAt: new Date(),
        updatedAt: new Date(),
      } as unknown as Awaited<ReturnType<typeof prisma.conversation.update>>)

      async function* mockStream() { yield 'Resposta do AI' }
      mockStreamChat.mockReturnValue(mockStream())
    }

    it('should NOT advance currentQuestion on first user message (Q0 answer)', async () => {
      setupBaseProject([])

      const response = await POST(createRequest({
        projectId: 'proj-1',
        message: 'Quero criar um app de delivery',
        phase: 'discovery',
      }))

      await drainStream(response)

      // First message answers Q0 (built-in prompt) — no advance should happen
      expect(mockPrisma.conversation.update).not.toHaveBeenCalled()
    })

    it('should advance currentQuestion on second user message (Q1 answer)', async () => {
      // Conversation has Q0 answered + AI asked Q1
      setupBaseProject([
        { role: 'USER', content: 'Quero criar um app de delivery' },
        { role: 'ASSISTANT', content: '**Qual problema você quer resolver?**' },
      ])

      const response = await POST(createRequest({
        projectId: 'proj-1',
        message: 'Ajudar restaurantes pequenos',
        phase: 'discovery',
      }))

      const output = await drainStream(response)

      // Should advance from 2 → 3
      expect(mockPrisma.conversation.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            currentQuestion: 3,
            completedQuestions: expect.arrayContaining([2]),
          }),
        })
      )

      expect(output).toContain('event: question_progress')
      expect(output).toContain('"current":3')
    })
  })
})
