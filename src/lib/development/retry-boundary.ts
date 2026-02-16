interface RetryBoundaryEvent {
  sequence: number
  eventType: string
  message?: string | null
  payload?: Record<string, unknown> | null
}

export function getRetryBoundarySequence(events: RetryBoundaryEvent[]): number {
  let boundary = 0
  let previousRunStatus: string | null = null

  for (const event of events) {
    if (event.eventType !== 'run_status' && event.eventType !== 'RUN_STATUS') continue

    const payload = event.payload ?? {}
    const status = typeof payload.status === 'string' ? payload.status : null
    const action = typeof payload.action === 'string' ? payload.action : null
    const isRetryMessage =
      typeof event.message === 'string' &&
      event.message.toLowerCase().includes('retry requested')
    const isResumeTransitionWithoutAction =
      status === 'RUNNING' &&
      !action &&
      (
        previousRunStatus === 'WAITING_CHECKPOINT' ||
        previousRunStatus === 'FAILED'
      )

    if (
      status === 'RUNNING' &&
      (
        action === 'resume' ||
        action === 'approve' ||
        action === 'retry' ||
        action === 'manual_resume' ||
        action === 'auto_resume' ||
        isResumeTransitionWithoutAction ||
        isRetryMessage
      )
    ) {
      boundary = event.sequence
    }

    if (status) {
      previousRunStatus = status
    }
  }

  return boundary
}
