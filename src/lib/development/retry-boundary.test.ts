import { describe, expect, it } from 'vitest'
import { getRetryBoundarySequence } from './retry-boundary'

describe('getRetryBoundarySequence', () => {
  it('returns latest boundary when retry message exists even without action payload', () => {
    const boundary = getRetryBoundarySequence([
      {
        sequence: 10,
        eventType: 'RUN_STATUS',
        message: 'Run started',
        payload: { status: 'RUNNING' },
      },
      {
        sequence: 42,
        eventType: 'RUN_STATUS',
        message: 'Run retry requested',
        payload: { status: 'RUNNING', iterationIndex: 1 },
      },
    ])

    expect(boundary).toBe(42)
  })

  it('returns latest boundary when run_status contains retry action', () => {
    const boundary = getRetryBoundarySequence([
      {
        sequence: 50,
        eventType: 'run_status',
        message: 'Run resumed from checkpoint',
        payload: { status: 'RUNNING', action: 'resume' },
      },
      {
        sequence: 80,
        eventType: 'run_status',
        message: 'Retrying iteration',
        payload: { status: 'RUNNING', action: 'retry' },
      },
    ])

    expect(boundary).toBe(80)
  })

  it('treats manual resume action as a new timeline boundary', () => {
    const boundary = getRetryBoundarySequence([
      {
        sequence: 90,
        eventType: 'run_status',
        message: 'Run started',
        payload: { status: 'RUNNING' },
      },
      {
        sequence: 120,
        eventType: 'run_status',
        message: 'Run manually resumed by user',
        payload: { status: 'RUNNING', action: 'manual_resume' },
      },
    ])

    expect(boundary).toBe(120)
  })

  it('treats WAITING_CHECKPOINT -> RUNNING transition as boundary even without action', () => {
    const boundary = getRetryBoundarySequence([
      {
        sequence: 5,
        eventType: 'RUN_STATUS',
        message: 'Run queued',
        payload: { status: 'QUEUED' },
      },
      {
        sequence: 6,
        eventType: 'RUN_STATUS',
        message: 'Run started',
        payload: { status: 'RUNNING' },
      },
      {
        sequence: 90,
        eventType: 'RUN_STATUS',
        message: 'Run waiting checkpoint',
        payload: { status: 'WAITING_CHECKPOINT', iterationIndex: 1 },
      },
      {
        sequence: 120,
        eventType: 'RUN_STATUS',
        message: 'Run resumed from checkpoint',
        payload: { status: 'RUNNING', iterationIndex: 1 },
      },
    ])

    expect(boundary).toBe(120)
  })

  it('ignores run_status events that do not represent checkpoint retry/resume', () => {
    const boundary = getRetryBoundarySequence([
      {
        sequence: 5,
        eventType: 'RUN_STATUS',
        message: 'Run queued',
        payload: { status: 'QUEUED' },
      },
      {
        sequence: 6,
        eventType: 'RUN_STATUS',
        message: 'Run started',
        payload: { status: 'RUNNING' },
      },
    ])

    expect(boundary).toBe(0)
  })
})
