import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { streamChat, type Message } from '@/lib/ai/claude'
import { DISCOVERY_SYSTEM_PROMPT } from '@/lib/ai/prompts/discovery'
import { isPlanReady, extractBusinessPlan } from '@/lib/ai/parsers'
import { prisma } from '@/lib/db/prisma'
import { Prisma } from '@prisma/client'

// ---------------------------------------------------------------------------
// Keyword pairs for each discovery question.
// Each pair is [word1, word2] — both must appear in the response (case-insensitive,
// diacritics-stripped) for us to conclude Claude re-asked that question.
// Chosen to be unique per question and resilient to bold markers / minor rephrasing.
// ---------------------------------------------------------------------------
const QUESTION_KEYWORDS: Record<number, [string, string]> = {
  1: ['problema', 'para quem'],        // "Qual problema voce quer resolver e para quem?"
  2: ['funcionalidades', 'must-have'], // "3-5 funcionalidades principais (must-have)"
  3: ['diferenciar', 'concorrentes'],  // "O que vai diferenciar ... concorrentes?"
  4: ['nice-to-have', 'futuro'],       // "nice-to-have para o futuro?"
  5: ['monetizar', 'projeto'],         // "Como pretende monetizar o projeto?"
}

/** Strip diacritics so "você" → "voce", "são" → "sao", etc. */
function stripDiacritics(s: string): string {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

/**
 * Returns true if Claude's response appears to re-ask question `n`.
 * Works regardless of diacritics, bold markdown, or minor rephrasing.
 */
export function claudeReAsked(questionNumber: number, response: string): boolean {
  const keywords = QUESTION_KEYWORDS[questionNumber]
  if (!keywords) return false
  const normalized = stripDiacritics(response.toLowerCase())
  return keywords.every((kw) => normalized.includes(kw.toLowerCase()))
}

const chatRequestSchema = z.object({
  projectId: z.string(),
  message: z.string().min(1).max(10000),
  phase: z.enum(['discovery', 'planning']),
})

export async function POST(request: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
    }

    const body = await request.json()
    const { projectId, message, phase } = chatRequestSchema.parse(body)

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    })

    if (!user) {
      return NextResponse.json({ error: 'USER_NOT_FOUND' }, { status: 404 })
    }

    // Get project and verify ownership
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        conversations: {
          where: { phase: phase.toUpperCase() as 'DISCOVERY' | 'PLANNING' },
          include: {
            messages: {
              orderBy: { createdAt: 'asc' },
            },
          },
        },
      },
    })

    if (!project || project.userId !== user.id) {
      return NextResponse.json({ error: 'PROJECT_NOT_FOUND' }, { status: 404 })
    }

    // Get or create conversation
    let conversation = project.conversations[0]
    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          projectId,
          phase: phase.toUpperCase() as 'DISCOVERY' | 'PLANNING',
          status: 'ACTIVE',
          currentQuestion: 1,
          completedQuestions: [],
        },
        include: { messages: true },
      })
    }

    // Save user message
    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: 'USER',
        content: message,
      },
    })

    // Question progress tracking for discovery phase.
    // The first user message answers Q0 ("O que criar?") — not one of the 5 tracked
    // questions. Advancement happens speculatively here and is confirmed or rolled
    // back after Claude responds (see inside the stream below).
    const existingUserMessages = conversation.messages.filter((m) => m.role === 'USER')
    const isFirstMessage = existingUserMessages.length === 0
    let currentQuestion = conversation.currentQuestion
    const completedQuestions = [...conversation.completedQuestions]
    // Track whether we speculatively advanced so we can roll back if Claude re-asks
    let speculativelyAdvanced = false
    const previousQuestion = currentQuestion

    if (phase === 'discovery' && !isFirstMessage && currentQuestion <= 5) {
      if (!completedQuestions.includes(currentQuestion)) {
        completedQuestions.push(currentQuestion)
      }
      const nextQuestion = Math.min(currentQuestion + 1, 5)

      await prisma.conversation.update({
        where: { id: conversation.id },
        data: {
          currentQuestion: nextQuestion,
          completedQuestions,
        },
      })

      currentQuestion = nextQuestion
      speculativelyAdvanced = true
    }

    // Build messages array for Claude
    const messages: Message[] = conversation.messages.map((msg) => ({
      role: msg.role.toLowerCase() as 'user' | 'assistant',
      content: msg.content,
    }))
    messages.push({ role: 'user', content: message })

    // Get system prompt based on phase
    const systemPrompt =
      phase === 'discovery' ? DISCOVERY_SYSTEM_PROMPT : DISCOVERY_SYSTEM_PROMPT // TODO: Add planning prompt

    // Create streaming response
    const encoder = new TextEncoder()
    let fullResponse = ''

    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of streamChat({
            phase,
            systemPrompt,
            messages,
          })) {
            fullResponse += chunk
            const event = `event: text\ndata: ${JSON.stringify({ content: chunk })}\n\n`
            controller.enqueue(encoder.encode(event))
          }

          // Save assistant message
          const savedMessage = await prisma.message.create({
            data: {
              conversationId: conversation.id,
              role: 'ASSISTANT',
              content: fullResponse,
            },
          })

          // Rollback check: if we speculatively advanced but Claude re-asked the
          // same question, undo the advancement so progress stays in sync.
          // Detection uses keyword pairs per question — robust against diacritics,
          // bold markdown (**...**), and minor Claude rephrasing.
          if (phase === 'discovery' && speculativelyAdvanced) {
            if (claudeReAsked(previousQuestion, fullResponse)) {
              const rolledBackQuestions = completedQuestions.filter((q) => q !== previousQuestion)
              await prisma.conversation.update({
                where: { id: conversation.id },
                data: {
                  currentQuestion: previousQuestion,
                  completedQuestions: rolledBackQuestions,
                },
              })
              currentQuestion = previousQuestion
              completedQuestions.splice(0, completedQuestions.length, ...rolledBackQuestions)
            }
          }

          // Emit question_progress event for discovery phase
          if (phase === 'discovery' && currentQuestion <= 5) {
            const progressEvent = `event: question_progress\ndata: ${JSON.stringify({
              progress: {
                current: currentQuestion,
                total: 5,
                completedQuestions,
              },
            })}\n\n`
            controller.enqueue(encoder.encode(progressEvent))
          }

          // Check if plan is ready
          if (isPlanReady(fullResponse)) {
            const plan = extractBusinessPlan(fullResponse)
            if (plan) {
              // Save plan to project
              await prisma.project.update({
                where: { id: projectId },
                data: {
                  businessPlan: plan as unknown as Prisma.JsonObject,
                  status: 'PLANNING',
                },
              })

              const planEvent = `event: plan_ready\ndata: ${JSON.stringify({ plan })}\n\n`
              controller.enqueue(encoder.encode(planEvent))
            }
          }

          // Send done event
          const doneEvent = `event: done\ndata: ${JSON.stringify({ messageId: savedMessage.id })}\n\n`
          controller.enqueue(encoder.encode(doneEvent))
          controller.close()
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : 'Unknown error'
          const errorEvent = `event: error\ndata: ${JSON.stringify({ message: errorMessage })}\n\n`
          controller.enqueue(encoder.encode(errorEvent))
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Chat error:', error)
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
  }
}
