import type { GateRunOutput } from './types'

const ROOT_CAUSE_PATTERNS = [
  /failed to resolve import/i,
  /cannot find module/i,
  /should not be imported outside/i,
  /error occurred prerendering page/i,
  /next\.js build worker exited/i,
  /\berror:/i,
  /does not exist/i,
  /workspace_not_prepared/i,
]

const NOISY_LINE_PATTERNS = [
  /^>\s/,
  /^run\s+v/i,
  /^test files\s+/i,
  /^tests?\s+/i,
  /^start at\s+/i,
  /^duration\s+/i,
  /^⎯+/,
  /^✓\s+/,
  /^⚠\s+/,
  /^\s*at\s+/,
]

function normalizeLines(snippet: string): string[] {
  return snippet
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
}

function pickRootCauseLine(lines: string[]): string | null {
  for (const pattern of ROOT_CAUSE_PATTERNS) {
    const match = lines.find((line) => pattern.test(line))
    if (match) return match
  }
  return null
}

function pickFallbackLine(lines: string[]): string | null {
  for (const line of lines) {
    const noisy = NOISY_LINE_PATTERNS.some((pattern) => pattern.test(line))
    if (!noisy) return line
  }
  return null
}

export function extractPrimaryGateFailureDetail(gate: GateRunOutput): string | null {
  if (gate.passed || !gate.report) return null

  const report = gate.report
  const reason = typeof report.reason === 'string' ? report.reason : null
  if (reason) return reason

  const snippet = typeof report.snippet === 'string' ? report.snippet : null
  if (!snippet) return null

  const lines = normalizeLines(snippet)
  if (lines.length === 0) return null

  const rootCause = pickRootCauseLine(lines)
  if (rootCause) return rootCause.slice(0, 220)

  const fallback = pickFallbackLine(lines)
  if (fallback) return fallback.slice(0, 220)

  return lines[0].slice(0, 220)
}

export function buildFailedGateSummary(gates: GateRunOutput[]): string {
  return gates
    .filter((gate) => {
      if (gate.passed) return false
      const reason =
        gate.report && typeof gate.report.reason === 'string'
          ? gate.report.reason
          : null
      return reason !== 'skipped_due_to_previous_failure'
    })
    .map((gate) => {
      const detail = extractPrimaryGateFailureDetail(gate)
      return detail ? `${gate.gateType} (${detail})` : gate.gateType
    })
    .join(', ')
}
