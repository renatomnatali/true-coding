import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { streamChat, type Message } from '@/lib/ai/claude'
import {
  DISCOVERY_SYSTEM_PROMPT_V2,
  DISCOVERY_FEW_SHOT_EXAMPLES_V2,
} from '@/lib/ai/prompts/discovery'
import {
  isPlanReady,
  extractBusinessPlan,
  extractQuestionNumber,
} from '@/lib/ai/parsers'
import { prisma } from '@/lib/db/prisma'
import { Prisma } from '@prisma/client'
import type { DiscoveryState, QuestionProgress } from '@/types'
import { FEATURES } from '@/config/features'

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
      const newConversation = await prisma.conversation.create({
        data: {
          projectId,
          phase: phase.toUpperCase() as 'DISCOVERY' | 'PLANNING',
          status: 'ACTIVE',
          currentQuestion: phase === 'discovery' ? 1 : null,
          discoveryState:
            phase === 'discovery'
              ? ({
                  questions: {},
                  metadata: {
                    startedAt: new Date().toISOString(),
                    lastActivity: new Date().toISOString(),
                    totalTimeSeconds: 0,
                  },
                } as unknown as Prisma.JsonObject)
              : Prisma.JsonNull,
        },
        include: { messages: true },
      })
      conversation = {
        ...newConversation,
        messages: newConversation.messages || [],
      }
    }

    // Initialize discoveryState if null (for existing conversations)
    let discoveryState: DiscoveryState | null = null
    let completedQuestions: number[] = []

    if (phase === 'discovery') {
      if (!conversation.discoveryState) {
        discoveryState = {
          questions: {},
          metadata: {
            startedAt: new Date().toISOString(),
            lastActivity: new Date().toISOString(),
            totalTimeSeconds: 0,
          },
        }
      } else {
        discoveryState = conversation.discoveryState as unknown as DiscoveryState
      }
      completedQuestions = conversation.completedQuestions ?? []
    }

    // Save user message
    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: 'USER',
        content: message,
      },
    })

    // Build messages array for Claude
    const messages: Message[] = conversation.messages.map((msg) => ({
      role: msg.role.toLowerCase() as 'user' | 'assistant',
      content: msg.content,
    }))
    messages.push({ role: 'user', content: message })

    // Get system prompt based on phase
    const systemPrompt =
      phase === 'discovery' ? DISCOVERY_SYSTEM_PROMPT_V2 : DISCOVERY_SYSTEM_PROMPT_V2 // TODO: Add planning prompt

    // Prepend few-shot examples for discovery phase
    if (phase === 'discovery' && conversation.messages.length === 0) {
      // Only add examples on first message to set the pattern
      messages.unshift(...DISCOVERY_FEW_SHOT_EXAMPLES_V2)
    }

    // Create streaming response
    const encoder = new TextEncoder()
    let fullResponse = ''

    const stream = new ReadableStream({
      async start(controller) {
        try {
          console.log('[CHAT API] Starting streaming...')
          for await (const chunk of streamChat({
            phase,
            systemPrompt,
            messages,
          })) {
            fullResponse += chunk
            const event = `event: text\ndata: ${JSON.stringify({ content: chunk })}\n\n`
            controller.enqueue(encoder.encode(event))
          }
          console.log('[CHAT API] Streaming completed. Full response length:', fullResponse.length)

          // Save assistant message
          const savedMessage = await prisma.message.create({
            data: {
              conversationId: conversation.id,
              role: 'ASSISTANT',
              content: fullResponse,
            },
          })

          // Discovery Phase: Track progress (if feature enabled)
          if (phase === 'discovery' && discoveryState && FEATURES.STRUCTURED_DISCOVERY) {
            const questionNumber = extractQuestionNumber(fullResponse)
            console.log('[CHAT API] Question detected:', questionNumber)
            console.log('[CHAT API] Feature flag STRUCTURED_DISCOVERY:', FEATURES.STRUCTURED_DISCOVERY)

            if (questionNumber) {
              // Update discoveryState with the question that was just asked
              discoveryState.questions[questionNumber] = {
                asked: true,
                answered: false, // Will be answered in next user message
                userResponse: '',
                extractedData: {},
                timestamp: new Date().toISOString(),
              }

              // Mark previous question as answered
              if (questionNumber > 1) {
                const prevQuestion = questionNumber - 1
                if (discoveryState.questions[prevQuestion]) {
                  discoveryState.questions[prevQuestion].answered = true
                  discoveryState.questions[prevQuestion].userResponse = message
                }

                // Add to completedQuestions if not already there
                if (!completedQuestions.includes(prevQuestion)) {
                  completedQuestions.push(prevQuestion)
                }
              }

              // Update metadata
              discoveryState.metadata.lastActivity = new Date().toISOString()
              const startTime = new Date(discoveryState.metadata.startedAt).getTime()
              const now = new Date().getTime()
              discoveryState.metadata.totalTimeSeconds = Math.floor((now - startTime) / 1000)

              // Update conversation in database
              await prisma.conversation.update({
                where: { id: conversation.id },
                data: {
                  discoveryState: discoveryState as unknown as Prisma.JsonObject,
                  currentQuestion: questionNumber,
                  completedQuestions,
                },
              })

              // Emit question_progress event
              const progressData: QuestionProgress = {
                current: questionNumber,
                total: 5,
              }
              console.log('[CHAT API] Emitting question_progress:', progressData)
              const progressEvent = `event: question_progress\ndata: ${JSON.stringify({ progress: progressData })}\n\n`
              controller.enqueue(encoder.encode(progressEvent))
            }
          }

          // Check if plan is ready
          // With feature flag: only after all 5 questions in discovery
          // Without feature flag: check anytime (original behavior)
          const shouldCheckPlan = phase !== 'discovery'
            || !FEATURES.STRUCTURED_DISCOVERY
            || completedQuestions.length >= 5

          if (shouldCheckPlan) {
            console.log('[CHAT API] Checking if plan is ready...')
            console.log('[CHAT API] Response length:', fullResponse.length)
            console.log('[CHAT API] Last 500 chars:', fullResponse.substring(fullResponse.length - 500))
            console.log('[CHAT API] Contains coreFeatures?', fullResponse.includes('"coreFeatures"'))
            console.log('[CHAT API] Contains targetAudience?', fullResponse.includes('"targetAudience"'))
            console.log('[CHAT API] Contains { and }?', fullResponse.includes('{') && fullResponse.includes('}'))

            const planReady = isPlanReady(fullResponse)
            console.log('[CHAT API] isPlanReady result:', planReady)

            if (planReady) {
              const plan = extractBusinessPlan(fullResponse)
              console.log('[CHAT API] Extracted plan:', plan ? 'SUCCESS' : 'FAILED')

              if (plan) {
                console.log('[CHAT API] Plan name:', plan.name)

                // Save plan to project
                await prisma.project.update({
                  where: { id: projectId },
                  data: {
                    businessPlan: plan as unknown as Prisma.JsonObject,
                    status: 'PLANNING',
                  },
                })

                // Mark discovery as completed
                if (phase === 'discovery') {
                  await prisma.conversation.update({
                    where: { id: conversation.id },
                    data: {
                      status: 'COMPLETED',
                    },
                  })
                }

                console.log('[CHAT API] Sending plan_ready event')
                const planEvent = `event: plan_ready\ndata: ${JSON.stringify({ plan })}\n\n`
                controller.enqueue(encoder.encode(planEvent))
              }
            } else if (phase === 'discovery' && completedQuestions.length >= 5) {
              // All questions answered but no plan generated yet - warn
              console.warn('[CHAT API] All 5 questions completed but plan not generated')
            }
          } else {
            console.log('[CHAT API] Skipping plan check - not all questions answered yet')
            console.log('[CHAT API] Completed questions:', completedQuestions.length, '/', 5)
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
