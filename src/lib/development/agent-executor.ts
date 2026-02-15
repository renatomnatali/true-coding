import { prisma } from '@/lib/db/prisma'
import { Prisma } from '@prisma/client'
import { appendRunEvent } from './events'
import { hashInput } from './utils'

async function createAgentTask(input: {
  runId: string
  iterationId?: string
  agentName: string
  inputPayload: Record<string, unknown>
}) {
  const task = await prisma.agentTaskRun.create({
    data: {
      runId: input.runId,
      iterationId: input.iterationId,
      agentName: input.agentName,
      inputHash: hashInput(input.inputPayload),
      status: 'RUNNING',
      startedAt: new Date(),
    },
  })

  await appendRunEvent({
    runId: input.runId,
    iterationId: input.iterationId,
    eventType: 'AGENT_TASK',
    message: `${input.agentName} started`,
    payload: {
      taskId: task.id,
      agentName: input.agentName,
      status: 'RUNNING',
    },
  })

  return task
}

async function completeAgentTask(input: {
  runId: string
  iterationId?: string
  taskId: string
  agentName: string
  status: 'SUCCEEDED' | 'FAILED'
  output?: unknown
  tokenUsage?: number
  cost?: number
  errorMessage?: string
  startedAt: number
}) {
  const durationMs = Date.now() - input.startedAt

  await prisma.agentTaskRun.update({
    where: { id: input.taskId },
    data: {
      status: input.status,
      output:
        input.output && typeof input.output === 'object'
          ? (input.output as Prisma.JsonObject)
          : undefined,
      tokenUsage: input.tokenUsage,
      cost: input.cost,
      errorMessage: input.errorMessage,
      durationMs,
      finishedAt: new Date(),
    },
  })

  await appendRunEvent({
    runId: input.runId,
    iterationId: input.iterationId,
    eventType: 'AGENT_TASK',
    message: `${input.agentName} ${input.status.toLowerCase()}`,
    payload: {
      taskId: input.taskId,
      agentName: input.agentName,
      status: input.status,
      durationMs,
      ...(input.errorMessage ? { error: input.errorMessage } : {}),
    },
  })
}

export async function executeAgent<TOutput extends object>(input: {
  runId: string
  iterationId?: string
  agentName: string
  payload: Record<string, unknown>
  run: () => Promise<{ output: TOutput; tokenUsage?: number; cost?: number }>
}) {
  const startedAt = Date.now()
  const task = await createAgentTask({
    runId: input.runId,
    iterationId: input.iterationId,
    agentName: input.agentName,
    inputPayload: input.payload,
  })

  try {
    const result = await input.run()

    await completeAgentTask({
      runId: input.runId,
      iterationId: input.iterationId,
      taskId: task.id,
      agentName: input.agentName,
      status: 'SUCCEEDED',
      output: result.output,
      tokenUsage: result.tokenUsage,
      cost: result.cost,
      startedAt,
    })

    return result
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Agent failed'
    const output =
      error && typeof error === 'object'
        ? (() => {
            const data = error as Record<string, unknown>
            const phase = typeof data.phase === 'string' ? data.phase : null
            const step = typeof data.step === 'string' ? data.step : null
            const summary = typeof data.summary === 'string' ? data.summary : null
            const details = typeof data.details === 'string' ? data.details : null
            if (!phase && !step && !summary && !details) return undefined
            return {
              ...(phase ? { phase } : {}),
              ...(step ? { step } : {}),
              ...(summary ? { summary } : {}),
              ...(details ? { details } : {}),
            }
          })()
        : undefined

    await completeAgentTask({
      runId: input.runId,
      iterationId: input.iterationId,
      taskId: task.id,
      agentName: input.agentName,
      status: 'FAILED',
      output,
      errorMessage: message,
      startedAt,
    })

    throw error
  }
}
