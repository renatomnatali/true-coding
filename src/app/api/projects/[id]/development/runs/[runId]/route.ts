import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { assertProjectOwnership } from '@/lib/development/auth'
import { getDevelopmentRun } from '@/lib/development/orchestrator'

interface RouteParams {
  params: Promise<{ id: string; runId: string }>
}

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
    }

    const { id, runId } = await params
    await assertProjectOwnership(id, userId)

    const run = await getDevelopmentRun(id, runId)

    if (!run) {
      return NextResponse.json({ error: 'RUN_NOT_FOUND' }, { status: 404 })
    }

    return NextResponse.json({ run })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'UNKNOWN_ERROR'

    if (message === 'PROJECT_NOT_FOUND') {
      return NextResponse.json({ error: 'PROJECT_NOT_FOUND' }, { status: 404 })
    }

    if (message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 })
    }

    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
  }
}
