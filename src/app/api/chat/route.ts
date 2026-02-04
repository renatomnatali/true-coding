import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { streamChat, type Message } from '@/lib/ai/claude'
import { DISCOVERY_SYSTEM_PROMPT } from '@/lib/ai/prompts/discovery'
import { isPlanReady, extractBusinessPlan } from '@/lib/ai/parsers'
import { prisma } from '@/lib/db/prisma'
import { Prisma } from '@prisma/client'

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

    // Update question progress for discovery phase
    // The first user message answers Q0 ("O que criar?") which is built into the UI,
    // not one of the 5 tracked questions. Only advance after the AI has asked Q1+.
    let currentQuestion = conversation.currentQuestion
    const completedQuestions = [...conversation.completedQuestions]
    // Uses the in-memory snapshot from the Prisma query above — excludes the
    // message.create on line 70, so length === 0 means this is the first message.
    const existingUserMessages = conversation.messages.filter((m) => m.role === 'USER')
    const isFirstMessage = existingUserMessages.length === 0

    if (phase === 'discovery' && !isFirstMessage && currentQuestion <= 5) {
      // Mark current question as completed (if not already)
      if (!completedQuestions.includes(currentQuestion)) {
        completedQuestions.push(currentQuestion)
      }
      // Advance to next question (max 5)
      const nextQuestion = Math.min(currentQuestion + 1, 5)

      // Update conversation in database
      await prisma.conversation.update({
        where: { id: conversation.id },
        data: {
          currentQuestion: nextQuestion,
          completedQuestions,
        },
      })

      currentQuestion = nextQuestion
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
