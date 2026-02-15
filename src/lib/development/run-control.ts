import { prisma } from '@/lib/db/prisma'
import { Prisma } from '@prisma/client'
import { appendRunEvent, getLatestRetryBoundarySequence, listRunEvents } from './events'
import { isRunActive } from './worker-registry'
import { TERMINAL_RUN_STATUSES } from './utils'
import { cleanupSandbox } from './workspace'
import { enqueueDevelopmentRun } from './orchestrator'
import type { ApprovedDevelopmentPlan } from './types'

const MAX_ITERATION_ATTEMPTS = 3

export async function createDevelopmentRun(
  projectId: string,
  approvedPlan?: ApprovedDevelopmentPlan
) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      id: true,
      status: true,
      businessPlan: true,
      technicalPlan: true,
      uxPlan: true,
      name: true,
      description: true,
      developmentRuns: {
        where: {
          status: {
            in: ['QUEUED', 'RUNNING', 'WAITING_CHECKPOINT'],
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 1,
        select: {
          id: true,
          status: true,
          createdAt: true,
        },
      },
    },
  })

  if (!project) {
    throw new Error('PROJECT_NOT_FOUND')
  }

  if (project.developmentRuns.length > 0) {
    return {
      run: project.developmentRuns[0],
      alreadyActive: true,
    }
  }

  if (!project.businessPlan || !project.technicalPlan || !project.uxPlan) {
    throw new Error('PLAN_PREREQUISITES_NOT_MET')
  }

  const run = await prisma.developmentRun.create({
    data: {
      projectId,
      status: 'QUEUED',
      plansSnapshot: {
        projectName: project.name,
        projectDescription: project.description,
        businessPlan: project.businessPlan,
        technicalPlan: project.technicalPlan,
        uxPlan: project.uxPlan,
        approvedAssessment: approvedPlan?.assessment ?? null,
        approvedIterations: approvedPlan?.iterations ?? null,
      } as unknown as Prisma.JsonObject,
    },
  })

  await appendRunEvent({
    runId: run.id,
    eventType: 'RUN_STATUS',
    message: 'Run queued',
    payload: { status: 'QUEUED' },
  })

  enqueueDevelopmentRun(run.id)

  return {
    run,
    alreadyActive: false,
  }
}

export async function getDevelopmentRun(projectId: string, runId: string) {
  return prisma.developmentRun.findFirst({
    where: {
      id: runId,
      projectId,
    },
    include: {
      iterations: {
        orderBy: { index: 'asc' },
        include: {
          qualityGates: {
            orderBy: { gateType: 'asc' },
          },
          agentTasks: {
            orderBy: { createdAt: 'asc' },
          },
        },
      },
    },
  })
}

export async function getDevelopmentRunEvents(runId: string, afterSequence = 0) {
  return listRunEvents(runId, afterSequence)
}

export function isDevelopmentRunActiveInWorker(runId: string): boolean {
  return isRunActive(runId)
}

export async function getDevelopmentRunRetryBoundary(runId: string) {
  return getLatestRetryBoundarySequence(runId)
}

export async function recoverDevelopmentRun(projectId: string, runId: string) {
  const run = await prisma.developmentRun.findFirst({
    where: {
      id: runId,
      projectId,
    },
    select: {
      id: true,
      status: true,
      startedAt: true,
      currentIteration: true,
    },
  })

  if (!run) {
    throw new Error('RUN_NOT_FOUND')
  }

  if (run.status !== 'QUEUED' && run.status !== 'RUNNING') {
    throw new Error('RUN_NOT_RECOVERABLE')
  }

  if (isRunActive(run.id)) {
    return {
      run,
      alreadyProcessing: true,
    }
  }

  if (run.currentIteration > 0) {
    const currentIteration = await prisma.iterationRun.findFirst({
      where: {
        runId: run.id,
        index: run.currentIteration,
      },
      select: {
        id: true,
        index: true,
        status: true,
        attemptCount: true,
      },
    })

    if (currentIteration && currentIteration.attemptCount >= MAX_ITERATION_ATTEMPTS) {
      await prisma.iterationRun.update({
        where: { id: currentIteration.id },
        data: {
          status: 'PENDING',
          finishedAt: null,
          attemptCount: 0,
        },
      })

      await appendRunEvent({
        runId: run.id,
        iterationId: currentIteration.id,
        eventType: 'INFO',
        message: 'Iteration retries reset before manual resume',
        payload: {
          iterationIndex: currentIteration.index,
          previousAttemptCount: currentIteration.attemptCount,
        },
      })
    }
  }

  await cleanupSandbox(run.id)

  const updatedRun = await prisma.developmentRun.update({
    where: { id: run.id },
    data: {
      status: 'RUNNING',
      startedAt: run.startedAt ?? new Date(),
      finishedAt: null,
      canceledAt: null,
    },
    select: {
      id: true,
      status: true,
      startedAt: true,
    },
  })

  await appendRunEvent({
    runId: run.id,
    eventType: 'RUN_STATUS',
    message: 'Run manually resumed by user',
    payload: {
      status: 'RUNNING',
      action: 'manual_resume',
    },
  })

  enqueueDevelopmentRun(run.id)

  return {
    run: updatedRun,
    alreadyProcessing: false,
  }
}

export async function cancelDevelopmentRun(projectId: string, runId: string) {
  const run = await prisma.developmentRun.findFirst({
    where: { id: runId, projectId },
    select: { id: true, status: true },
  })

  if (!run) {
    throw new Error('RUN_NOT_FOUND')
  }

  if (TERMINAL_RUN_STATUSES.has(run.status)) {
    return run
  }

  const updated = await prisma.developmentRun.update({
    where: { id: run.id },
    data: {
      status: 'CANCELED',
      canceledAt: new Date(),
      finishedAt: new Date(),
    },
  })

  await prisma.project.update({
    where: { id: projectId },
    data: { status: 'FAILED' },
  })

  await appendRunEvent({
    runId,
    eventType: 'RUN_STATUS',
    message: 'Run canceled',
    payload: { status: 'CANCELED' },
  })

  return updated
}

export async function checkpointAction(input: {
  projectId: string
  runId: string
  iterationIndex: number
  action: 'pause' | 'resume' | 'approve'
}) {
  const run = await prisma.developmentRun.findFirst({
    where: { id: input.runId, projectId: input.projectId },
    select: { id: true, status: true },
  })

  if (!run) {
    throw new Error('RUN_NOT_FOUND')
  }

  const iteration = await prisma.iterationRun.findFirst({
    where: {
      runId: input.runId,
      index: input.iterationIndex,
    },
    select: { id: true, index: true, status: true },
  })

  if (!iteration) {
    throw new Error('ITERATION_NOT_FOUND')
  }

  if (input.action === 'pause') {
    const updated = await prisma.developmentRun.update({
      where: { id: run.id },
      data: {
        status: 'WAITING_CHECKPOINT',
        errorSummary: `Paused manually at iteration ${iteration.index}`,
      },
    })

    await appendRunEvent({
      runId: run.id,
      iterationId: iteration.id,
      eventType: 'RUN_STATUS',
      message: 'Run paused by checkpoint',
      payload: { status: 'WAITING_CHECKPOINT', iterationIndex: iteration.index },
    })

    return updated
  }

  await cleanupSandbox(run.id)

  await prisma.iterationRun.update({
    where: { id: iteration.id },
    data: {
      status: 'PENDING',
      finishedAt: null,
      attemptCount: 0,
    },
  })

  const updatedRun = await prisma.developmentRun.update({
    where: { id: run.id },
    data: {
      status: 'RUNNING',
      errorSummary: null,
    },
  })

  await appendRunEvent({
    runId: run.id,
    iterationId: iteration.id,
    eventType: 'RUN_STATUS',
    message: `Run resumed from checkpoint (${input.action})`,
    payload: { status: 'RUNNING', action: input.action, iterationIndex: iteration.index },
  })

  enqueueDevelopmentRun(run.id)

  return updatedRun
}

export async function retryDevelopmentRun(projectId: string, runId: string) {
  const run = await prisma.developmentRun.findFirst({
    where: { id: runId, projectId },
    select: { id: true, status: true, currentIteration: true },
  })

  if (!run) {
    throw new Error('RUN_NOT_FOUND')
  }

  if (run.status !== 'WAITING_CHECKPOINT' && run.status !== 'FAILED') {
    throw new Error('RUN_NOT_RETRYABLE')
  }

  await cleanupSandbox(run.id)

  const failedIteration = await prisma.iterationRun.findFirst({
    where: {
      runId,
      OR: [{ status: 'FAILED' }, { index: run.currentIteration }],
    },
    orderBy: { index: 'asc' },
  })

  if (failedIteration) {
    await prisma.iterationRun.update({
      where: { id: failedIteration.id },
      data: {
        status: 'PENDING',
        finishedAt: null,
        attemptCount: 0,
      },
    })
  }

  const updatedRun = await prisma.developmentRun.update({
    where: { id: run.id },
    data: {
      status: 'RUNNING',
      finishedAt: null,
      errorSummary: null,
    },
  })

  await appendRunEvent({
    runId,
    iterationId: failedIteration?.id,
    eventType: 'RUN_STATUS',
    message: 'Run retry requested',
    payload: {
      status: 'RUNNING',
      action: 'retry',
      iterationIndex: failedIteration?.index,
    },
  })

  enqueueDevelopmentRun(run.id)

  return updatedRun
}
