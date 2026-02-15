import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { assertProjectOwnership } from '@/lib/development/auth'
import { checkpointAction } from '@/lib/development/run-control'

interface RouteParams {
  params: Promise<{ id: string; runId: string; iteration: string }>
}

const checkpointSchema = z.object({
  action: z.enum(['pause', 'resume', 'approve']),
})

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
    }

    const body = await request.json()
    const { action } = checkpointSchema.parse(body)

    const { id, runId, iteration } = await params
    const iterationIndex = Number(iteration)

    if (!Number.isInteger(iterationIndex) || iterationIndex <= 0) {
      return NextResponse.json({ error: 'INVALID_ITERATION' }, { status: 400 })
    }

    await assertProjectOwnership(id, userId)

    const run = await checkpointAction({
      projectId: id,
      runId,
      iterationIndex,
      action,
    })

    return NextResponse.json({
      runId: run.id,
      status: run.status,
      action,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', details: error.errors },
        { status: 400 }
      )
    }

    const message = error instanceof Error ? error.message : 'UNKNOWN_ERROR'

    if (message === 'PROJECT_NOT_FOUND') {
      return NextResponse.json({ error: 'PROJECT_NOT_FOUND' }, { status: 404 })
    }

    if (message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 })
    }

    if (message === 'RUN_NOT_FOUND') {
      return NextResponse.json({ error: 'RUN_NOT_FOUND' }, { status: 404 })
    }

    if (message === 'ITERATION_NOT_FOUND') {
      return NextResponse.json({ error: 'ITERATION_NOT_FOUND' }, { status: 404 })
    }

    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
  }
}
