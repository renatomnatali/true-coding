import { randomUUID } from 'node:crypto'
import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { assertProjectOwnership } from '@/lib/development/auth'
import { runAssessmentAgent, runIterationPlannerAgent } from '@/lib/development/agents'

interface RouteParams {
  params: Promise<{ id: string }>
}

function mapError(error: unknown) {
  const message = error instanceof Error ? error.message : 'UNKNOWN_ERROR'

  switch (message) {
    case 'PROJECT_NOT_FOUND':
      return NextResponse.json({ error: 'PROJECT_NOT_FOUND' }, { status: 404 })
    case 'FORBIDDEN':
      return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 })
    case 'PLAN_PREREQUISITES_NOT_MET':
      return NextResponse.json(
        {
          error: 'PREREQUISITE_NOT_MET',
          message: 'Business, Technical and UX plans must exist before analyzing complexity.',
        },
        { status: 409 }
      )
    default:
      return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
  }
}

export async function POST(_request: Request, { params }: RouteParams) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
    }

    const { id } = await params
    await assertProjectOwnership(id, userId)

    const project = await prisma.project.findUnique({
      where: { id },
      select: {
        id: true,
        businessPlan: true,
        technicalPlan: true,
        uxPlan: true,
      },
    })

    if (!project) {
      throw new Error('PROJECT_NOT_FOUND')
    }

    if (!project.businessPlan || !project.technicalPlan || !project.uxPlan) {
      throw new Error('PLAN_PREREQUISITES_NOT_MET')
    }

    const context = {
      runId: `assessment-${randomUUID()}`,
      projectId: project.id,
      snapshot: {
        businessPlan: project.businessPlan,
        technicalPlan: project.technicalPlan,
        uxPlan: project.uxPlan,
      },
    }

    const assessmentStartedAt = Date.now()
    const assessment = await runAssessmentAgent(context)
    const assessmentDurationMs = Date.now() - assessmentStartedAt

    const plannerStartedAt = Date.now()
    const iterationPlan = await runIterationPlannerAgent(context, assessment.output)
    const plannerDurationMs = Date.now() - plannerStartedAt

    return NextResponse.json({
      assessment: assessment.output,
      iterations: iterationPlan.output.iterations,
      agents: [
        {
          agentName: 'AssessmentAgent',
          durationMs: assessmentDurationMs,
          tokenUsage: assessment.tokenUsage ?? null,
          cost: assessment.cost ?? null,
        },
        {
          agentName: 'IterationPlannerAgent',
          durationMs: plannerDurationMs,
          tokenUsage: iterationPlan.tokenUsage ?? null,
          cost: iterationPlan.cost ?? null,
        },
      ],
      generatedAt: new Date().toISOString(),
    })
  } catch (error) {
    return mapError(error)
  }
}
