import { prisma } from '@/lib/db/prisma'
import { Prisma } from '@prisma/client'
import type { DevelopmentEvent } from '@/types/development'
import { getRetryBoundarySequence } from '@/lib/development/retry-boundary'

function mapRunEventType(eventType: string): DevelopmentEvent['eventType'] {
  switch (eventType) {
    case 'RUN_STATUS':
      return 'run_status'
    case 'ITERATION_STATUS':
      return 'iteration_status'
    case 'AGENT_TASK':
      return 'agent_task'
    case 'QUALITY_GATE':
      return 'quality_gate'
    case 'DEPLOY_STATUS':
      return 'deploy_status'
    case 'ERROR':
      return 'error'
    default:
      return 'info'
  }
}

export async function appendRunEvent(input: {
  runId: string
  iterationId?: string
  eventType:
    | 'RUN_STATUS'
    | 'ITERATION_STATUS'
    | 'AGENT_TASK'
    | 'QUALITY_GATE'
    | 'DEPLOY_STATUS'
    | 'ERROR'
    | 'INFO'
  message?: string
  payload?: Record<string, unknown>
}) {
  return prisma.runEvent.create({
    data: {
      runId: input.runId,
      iterationId: input.iterationId,
      eventType: input.eventType,
      message: input.message,
      payload: input.payload as Prisma.JsonObject | undefined,
    },
  })
}

export async function listRunEvents(runId: string, afterSequence = 0) {
  const events = await prisma.runEvent.findMany({
    where: {
      runId,
      sequence: { gt: afterSequence },
    },
    orderBy: { sequence: 'asc' },
    take: 200,
  })

  return events.map((event): DevelopmentEvent => ({
    id: event.id,
    runId: event.runId,
    iterationId: event.iterationId ?? undefined,
    sequence: event.sequence,
    eventType: mapRunEventType(event.eventType),
    message: event.message ?? undefined,
    payload:
      event.payload && typeof event.payload === 'object'
        ? (event.payload as Record<string, unknown>)
        : undefined,
    createdAt: event.createdAt.toISOString(),
  }))
}

export async function getLatestRetryBoundarySequence(runId: string) {
  const runEvents = await prisma.runEvent.findMany({
    where: {
      runId,
      eventType: 'RUN_STATUS',
    },
    orderBy: { sequence: 'asc' },
    select: {
      sequence: true,
      eventType: true,
      message: true,
      payload: true,
    },
  })

  return getRetryBoundarySequence(
    runEvents.map((event) => ({
      sequence: event.sequence,
      eventType: event.eventType,
      message: event.message,
      payload:
        event.payload && typeof event.payload === 'object'
          ? (event.payload as Record<string, unknown>)
          : null,
    }))
  )
}
