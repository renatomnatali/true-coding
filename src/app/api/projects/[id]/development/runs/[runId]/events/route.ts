import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { assertProjectOwnership } from '@/lib/development/auth'
import {
  getDevelopmentRunEvents,
  getDevelopmentRun,
  getDevelopmentRunRetryBoundary,
} from '@/lib/development/orchestrator'

interface RouteParams {
  params: Promise<{ id: string; runId: string }>
}

const TERMINAL = new Set(['FAILED', 'CANCELED', 'SUCCEEDED'])

export async function GET(request: Request, { params }: RouteParams) {
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

    const url = new URL(request.url)
    const initialAfter = Number(url.searchParams.get('after') ?? '0')

    const retryBoundary =
      Number.isFinite(initialAfter) && initialAfter > 0
        ? 0
        : await getDevelopmentRunRetryBoundary(runId)

    const encoder = new TextEncoder()
    let lastSequence = Number.isFinite(initialAfter) ? initialAfter : 0
    if (lastSequence <= 0 && retryBoundary > 0) {
      lastSequence = retryBoundary - 1
    }
    let stopped = false
    let timer: ReturnType<typeof setInterval> | null = null

    const stream = new ReadableStream({
      start(controller) {
        const send = async () => {
          if (stopped) return

          const events = await getDevelopmentRunEvents(runId, lastSequence)

          for (const event of events) {
            lastSequence = event.sequence
            controller.enqueue(
              encoder.encode(
                `event: ${event.eventType}\ndata: ${JSON.stringify(event)}\n\n`
              )
            )
          }

          const latestRun = await getDevelopmentRun(id, runId)
          if (!latestRun) {
            controller.enqueue(
              encoder.encode(`event: error\ndata: ${JSON.stringify({ error: 'RUN_NOT_FOUND' })}\n\n`)
            )
            stopped = true
            controller.close()
            return
          }

          if (TERMINAL.has(latestRun.status)) {
            controller.enqueue(
              encoder.encode(
                `event: done\ndata: ${JSON.stringify({
                  runId,
                  status: latestRun.status,
                  lastSequence,
                })}\n\n`
              )
            )
            stopped = true
            if (timer) {
              clearInterval(timer)
              timer = null
            }
            controller.close()
          }
        }

        void send()
        timer = setInterval(() => {
          void send()
        }, 1000)
      },
      cancel() {
        stopped = true
        if (timer) {
          clearInterval(timer)
          timer = null
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
      },
    })
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
