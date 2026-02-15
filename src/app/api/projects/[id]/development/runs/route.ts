import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { assertProjectOwnership } from '@/lib/development/auth'
import { createDevelopmentRun, isDevelopmentRunActiveInWorker } from '@/lib/development/orchestrator'
import { assertAutonomousDevelopmentSchemaReady } from '@/lib/development/schema-health'
import type { ApprovedDevelopmentPlan } from '@/lib/development/types'
import type { AssessmentResult, IterationPlanItem } from '@/types/development'

const STALE_RUN_THRESHOLD_MS = 60_000

interface RouteParams {
  params: Promise<{ id: string }>
}

interface StartRunRequestBody {
  assessmentConfirmed?: boolean
  approvedAssessment?: unknown
  approvedIterations?: unknown
}

function isExecutionEnabled() {
  return process.env.AUTONOMOUS_DEV_EXECUTE_GATES === 'true'
}

function isAssessmentResult(value: unknown): value is AssessmentResult {
  if (!value || typeof value !== 'object') return false

  const candidate = value as Partial<AssessmentResult>
  if (typeof candidate.complexityScore !== 'number') return false
  if (!['simple', 'medium', 'complex'].includes(String(candidate.complexityLevel))) return false
  if (typeof candidate.recommendedIterations !== 'number') return false
  if (!Array.isArray(candidate.factors)) return false

  return candidate.factors.every((factor) => (
    factor &&
    typeof factor === 'object' &&
    typeof factor.name === 'string' &&
    typeof factor.score === 'number' &&
    typeof factor.maxScore === 'number' &&
    typeof factor.detail === 'string'
  ))
}

function isIterationPlanItem(value: unknown): value is IterationPlanItem {
  if (!value || typeof value !== 'object') return false

  const candidate = value as Partial<IterationPlanItem>
  if (typeof candidate.index !== 'number') return false
  if (typeof candidate.name !== 'string') return false
  if (typeof candidate.slug !== 'string') return false
  if (typeof candidate.gherkinPath !== 'string') return false
  if (!candidate.scope || typeof candidate.scope !== 'object') return false

  const scope = candidate.scope as Partial<IterationPlanItem['scope']>
  return (
    Array.isArray(scope.goals) &&
    scope.goals.every((goal) => typeof goal === 'string') &&
    Array.isArray(scope.featureTags) &&
    scope.featureTags.every((tag) => typeof tag === 'string') &&
    Array.isArray(scope.risks) &&
    scope.risks.every((risk) => typeof risk === 'string')
  )
}

function parseApprovedPlan(body: StartRunRequestBody): ApprovedDevelopmentPlan | undefined {
  const hasAssessment = typeof body.approvedAssessment !== 'undefined'
  const hasIterations = typeof body.approvedIterations !== 'undefined'

  if (!hasAssessment && !hasIterations) {
    return undefined
  }

  if (!hasAssessment || !hasIterations) {
    throw new Error('INVALID_APPROVED_PLAN')
  }

  if (!isAssessmentResult(body.approvedAssessment)) {
    throw new Error('INVALID_APPROVED_PLAN')
  }

  if (!Array.isArray(body.approvedIterations) || body.approvedIterations.length === 0) {
    throw new Error('INVALID_APPROVED_PLAN')
  }

  if (!body.approvedIterations.every((iteration) => isIterationPlanItem(iteration))) {
    throw new Error('INVALID_APPROVED_PLAN')
  }

  return {
    assessment: body.approvedAssessment,
    iterations: body.approvedIterations,
  }
}

function mapError(error: unknown) {
  const message = error instanceof Error ? error.message : 'UNKNOWN_ERROR'

  switch (message) {
    case 'PROJECT_NOT_FOUND':
      return NextResponse.json({ error: 'PROJECT_NOT_FOUND' }, { status: 404 })
    case 'FORBIDDEN':
      return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 })
    case 'RUN_ALREADY_ACTIVE':
      return NextResponse.json(
        { error: 'RUN_ALREADY_ACTIVE', message: 'Já existe uma execução ativa para este projeto.' },
        { status: 409 }
      )
    case 'PLAN_PREREQUISITES_NOT_MET':
      return NextResponse.json(
        { error: 'PREREQUISITE_NOT_MET', message: 'Business, Technical and UX plans must exist before starting development.' },
        { status: 409 }
      )
    case 'INVALID_APPROVED_PLAN':
      return NextResponse.json(
        {
          error: 'INVALID_APPROVED_PLAN',
          message:
            'Payload de plano aprovado inválido. Envie assessment + iterações válidas ou omita ambos os campos.',
        },
        { status: 400 }
      )
    case 'SCHEMA_NOT_APPLIED':
      return NextResponse.json(
        {
          error: 'MIGRATION_REQUIRED',
          message:
            'Schema de desenvolvimento autônomo ainda não foi aplicado. Execute as migrations do Prisma antes de iniciar uma run.',
        },
        { status: 503 }
      )
    case 'EXECUTION_DISABLED':
      return NextResponse.json(
        {
          error: 'EXECUTION_DISABLED',
          message:
            'Execução do pipeline autônomo está desativada neste ambiente. Ative AUTONOMOUS_DEV_EXECUTE_GATES=true para continuar.',
        },
        { status: 409 }
      )
    default:
      if (message.includes('does not exist')) {
        return NextResponse.json(
          {
            error: 'MIGRATION_REQUIRED',
            message:
              'Schema de desenvolvimento autônomo ainda não foi aplicado. Execute as migrations do Prisma antes de iniciar uma run.',
          },
          { status: 503 }
        )
      }
      return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
  }
}

export async function POST(_request: Request, { params }: RouteParams) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
    }

    const body = await _request
      .json()
      .catch(() => ({})) as StartRunRequestBody

    if (body.assessmentConfirmed !== true) {
      return NextResponse.json(
        {
          error: 'ASSESSMENT_REQUIRED',
          message:
            'A análise de complexidade é obrigatória antes de iniciar o desenvolvimento.',
        },
        { status: 409 }
      )
    }

    if (!isExecutionEnabled()) {
      throw new Error('EXECUTION_DISABLED')
    }

    const { id } = await params
    await assertProjectOwnership(id, userId)
    const approvedPlan = parseApprovedPlan(body)
    await assertAutonomousDevelopmentSchemaReady()

    const result = await createDevelopmentRun(id, approvedPlan)
    const run = result.run

    return NextResponse.json(
      {
        runId: run.id,
        status: run.status,
        createdAt: run.createdAt,
        alreadyActive: result.alreadyActive,
      },
      { status: result.alreadyActive ? 200 : 201 }
    )
  } catch (error) {
    return mapError(error)
  }
}

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
    }

    const { id } = await params
    await assertProjectOwnership(id, userId)

    const runs = await prisma.developmentRun.findMany({
      where: { projectId: id },
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: {
        id: true,
        status: true,
        currentIteration: true,
        totalIterations: true,
        errorSummary: true,
        createdAt: true,
        startedAt: true,
        finishedAt: true,
        updatedAt: true,
      },
    })

    const now = Date.now()
    const mappedRuns = runs.map((run) => {
      const isActiveLifecycleStatus = run.status === 'QUEUED' || run.status === 'RUNNING'
      const workerActive = isActiveLifecycleStatus
        ? isDevelopmentRunActiveInWorker(run.id)
        : false
      const staleByInactivity =
        isActiveLifecycleStatus &&
        !workerActive &&
        now - run.updatedAt.getTime() > STALE_RUN_THRESHOLD_MS

      return {
        id: run.id,
        status: run.status,
        currentIteration: run.currentIteration,
        totalIterations: run.totalIterations,
        errorSummary: run.errorSummary,
        createdAt: run.createdAt,
        updatedAt: run.updatedAt,
        startedAt: run.startedAt,
        finishedAt: run.finishedAt,
        isStale: staleByInactivity,
      }
    })

    return NextResponse.json({ runs: mappedRuns })
  } catch (error) {
    return mapError(error)
  }
}
