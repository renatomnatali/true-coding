import { describe, expect, it } from 'vitest'
import { buildFailedGateSummary, extractPrimaryGateFailureDetail } from './gate-diagnostics'
import type { GateRunOutput } from './types'

describe('extractPrimaryGateFailureDetail', () => {
  it('prioritizes actionable root-cause lines over npm command banners', () => {
    const detail = extractPrimaryGateFailureDetail({
      gateType: 'UNIT',
      passed: false,
      durationMs: 1000,
      report: {
        snippet: [
          '> aplicativo@0.1.0 test',
          '> vitest run',
          '',
          'Error: Failed to resolve import "@testing-library/jest-dom/vitest" from "src/test/setup.ts".',
          'at TransformPluginContext.error',
        ].join('\n'),
      },
    })

    expect(detail).toContain('Failed to resolve import')
    expect(detail).not.toContain('> aplicativo@0.1.0 test')
  })

  it('falls back to explicit report.reason when present', () => {
    const detail = extractPrimaryGateFailureDetail({
      gateType: 'BUILD',
      passed: false,
      durationMs: 200,
      report: {
        reason: 'workspace_not_prepared',
        snippet: '> app@0.1.0 build',
      },
    })

    expect(detail).toBe('workspace_not_prepared')
  })
})

describe('buildFailedGateSummary', () => {
  it('builds concise multi-gate summary using extracted root causes', () => {
    const gates: GateRunOutput[] = [
      {
        gateType: 'BUILD',
        passed: false,
        durationMs: 100,
        report: {
          snippet: [
            '> app@0.1.0 build',
            '> next build',
            'Error: <Html> should not be imported outside of pages/_document.',
          ].join('\n'),
        },
      },
      {
        gateType: 'UNIT',
        passed: false,
        durationMs: 100,
        report: {
          snippet: [
            '> app@0.1.0 test',
            '> vitest run',
            'Error: Failed to resolve import "@testing-library/jest-dom/vitest".',
          ].join('\n'),
        },
      },
      {
        gateType: 'SECURITY',
        passed: true,
        durationMs: 50,
      },
    ]

    const summary = buildFailedGateSummary(gates)

    expect(summary).toContain('BUILD (Error: <Html> should not be imported outside of pages/_document.)')
    expect(summary).toContain('UNIT (Error: Failed to resolve import "@testing-library/jest-dom/vitest".)')
    expect(summary).not.toContain('SECURITY')
  })

  it('ignores skipped dependent gates in failure summary', () => {
    const gates: GateRunOutput[] = [
      {
        gateType: 'BUILD',
        passed: false,
        durationMs: 100,
        report: {
          snippet: 'Error: build exploded',
        },
      },
      {
        gateType: 'UNIT',
        passed: false,
        durationMs: 0,
        report: {
          reason: 'skipped_due_to_previous_failure',
        },
      },
      {
        gateType: 'BDD',
        passed: false,
        durationMs: 0,
        report: {
          reason: 'skipped_due_to_previous_failure',
        },
      },
    ]

    const summary = buildFailedGateSummary(gates)
    expect(summary).toBe('BUILD (Error: build exploded)')
  })
})
